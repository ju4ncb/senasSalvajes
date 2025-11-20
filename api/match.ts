import type { VercelRequest, VercelResponse } from "@vercel/node";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

function getDB() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action;

  if (!action) {
    return res.status(400).json({ message: "Missing action parameter" });
  }

  try {
    switch (action) {
      case "create":
        if (req.method !== "POST")
          return res.status(405).json({ message: "Method not allowed" });
        return createMatch(req, res);

      case "find":
        if (req.method !== "GET")
          return res.status(405).json({ message: "Method not allowed" });
        return findMatch(req, res);

      case "join":
        if (req.method !== "GET")
          return res.status(405).json({ message: "Method not allowed" });
        return joinMatch(req, res);

      case "verify-in-match":
        if (req.method !== "GET")
          return res.status(405).json({ message: "Method not allowed" });
        return verifyMatch(req, res);

      case "verify-someone-joined":
        if (req.method !== "GET")
          return res.status(405).json({ message: "Method not allowed" });
        return verifySomeoneJoined(req, res);

      case "finish":
        if (req.method !== "POST")
          return res.status(405).json({ message: "Method not allowed" });
        return finishMatch(req, res);

      case "cancel":
        if (req.method !== "POST")
          return res.status(405).json({ message: "Method not allowed" });
        return cancelMatch(req, res);

      case "cancel-waiting-matches":
        if (req.method !== "GET")
          return res.status(405).json({ message: "Method not allowed" });
        return cancelWaitingMatches(req, res);

      case "get-current-match":
        if (req.method !== "GET")
          return res.status(405).json({ message: "Method not allowed" });
        return getCurrentMatch(req, res);

      case "get-current-player":
        if (req.method !== "GET")
          return res.status(405).json({ message: "Method not allowed" });
        return getCurrentPlayer(req, res);

      case "get-all-slots":
        if (req.method !== "GET")
          return res.status(405).json({ message: "Method not allowed" });
        return getAllSlots(req, res);

      case "flip-slot":
        if (req.method !== "POST")
          return res.status(405).json({ message: "Method not allowed" });
        return flipSlot(req, res);

      case "reset-slots":
        if (req.method !== "POST")
          return res.status(405).json({ message: "Method not allowed" });
        return resetSlots(req, res);

      case "mark-slots-as-matched":
        if (req.method !== "POST")
          return res.status(405).json({ message: "Method not allowed" });
        return markSlotsAsMatched(req, res);

      default:
        return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error in main handler:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function createMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  try {
    const { player1Id } = req.body;

    const [result] = await pool.execute(
      "INSERT INTO matches (player1_id, player1_score, player2_id, player2_score, player_turn, state) VALUES (?, ?, ?, ?, ?, ?)",
      [player1Id, 0, null, 0, player1Id, "waiting"]
    );

    const matchId = (result as any).insertId;

    const matchToken = jwt.sign(
      { matchId },
      process.env.GUEST_SESSION_JWT_SECRET!,
      { expiresIn: "1h" }
    );

    const gridSize = 6;
    const totalPairs = 18;

    interface Card {
      value: number;
      imageType: string;
    }

    const allNums = Array.from({ length: 22 }, (_, i) => i + 1);
    const chosen = [];

    while (chosen.length < totalPairs) {
      const idx = Math.floor(Math.random() * allNums.length);
      chosen.push(allNums.splice(idx, 1)[0]);
    }

    const cards = [] as Card[];
    chosen.forEach((v) => {
      cards.push({ value: v, imageType: `S` });
      cards.push({ value: v, imageType: `F` });
    });

    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    const descriptionMap: { [key: number]: string } = {
      1: "Araña",
      2: "Ballena",
      3: "Burro",
      4: "Caballo",
      5: "Cabra",
      6: "Camello",
      7: "Canguro",
      8: "Cangrejo",
      9: "Caracol",
      10: "Cerdo",
      11: "Cocodrilo",
      12: "Conejo",
      13: "Cucaracha",
      14: "Culebra",
      15: "Elefante",
      16: "Gallina",
      17: "Gallo",
      18: "Gato",
      19: "Gorila",
      20: "Gusano",
      21: "Hipopótamo",
      22: "Hormiga",
    };

    const insertSlotSQL = `
      INSERT INTO match_grid_slots
      (match_id, value, image_type, image_url, state, x_position, y_position, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const card = cards[i * gridSize + j];
        const imageUrl = card.imageType.endsWith("S")
          ? `/assets/signs/sign-${card.value}.jpg`
          : `/assets/figures/figure-${card.value}.jpg`;
        const description = descriptionMap[card.value];
        await pool.execute(insertSlotSQL, [
          matchId,
          card.value,
          card.imageType,
          imageUrl,
          "hidden",
          i,
          j,
          description,
        ]);
      }
    }

    res.setHeader(
      "Set-Cookie",
      `match_session_token=${matchToken}; HttpOnly; Path=/; Max-Age=3600`
    );

    return res.status(200).json({
      matchId,
      player1Id,
      player1Score: 0,
      player2Id: null,
      player2Score: 0,
      playerTurn: player1Id,
      state: "waiting",
    });
  } finally {
    await pool.end();
  }
}

async function findMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  try {
    const token = req.cookies?.["guest_session_token"];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    let decoded: { userId: string };
    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      decoded = jwt.verify(token, secret) as { userId: string };
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    const excludePlayerId = decoded.userId;

    const [rows] = await pool.execute(
      "SELECT * FROM matches WHERE state = 'waiting' AND player1_id != ? LIMIT 1",
      [excludePlayerId]
    );

    if (!rows || (Array.isArray(rows) && rows.length === 0))
      return res.status(404).json({ message: "No available matches found" });

    const matchId = (Array.isArray(rows) ? rows[0] : (rows as any)).match_id;

    const matchToken = jwt.sign(
      { matchId },
      process.env.GUEST_SESSION_JWT_SECRET!,
      { expiresIn: "1h" }
    );

    res.setHeader("Cache-Control", "no-store");

    res.setHeader(
      "Set-Cookie",
      `match_session_token=${matchToken}; HttpOnly; Path=/; Max-Age=3600`
    );

    return res.status(200).json({ matchId });
  } finally {
    await pool.end();
  }
}

async function joinMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  try {
    const guestSessionToken = req.cookies?.["guest_session_token"];
    const matchToken = req.cookies?.["match_session_token"];

    if (!guestSessionToken) {
      return res
        .status(401)
        .json({ message: "No guest session token provided" });
    }

    if (!matchToken) {
      return res.status(400).json({ message: "No match token provided" });
    }

    let userDecodedData: { userId: string };
    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      userDecodedData = jwt.verify(guestSessionToken, secret) as {
        userId: string;
      };
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    const guestUserId = userDecodedData.userId;

    let decodedMatch: { matchId: string };
    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      decodedMatch = jwt.verify(matchToken, secret) as { matchId: string };
    } catch {
      return res.status(401).json({ message: "Invalid match token" });
    }

    const matchId = decodedMatch.matchId;

    await pool.execute(
      "UPDATE matches SET player2_id = ?, state = ? WHERE match_id = ? AND state = ?",
      [guestUserId, "playing", matchId, "waiting"]
    );

    return res.status(200).json({ message: "Joined match successfully" });
  } finally {
    await pool.end();
  }
}

async function verifyMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  try {
    const token = req.cookies?.["guest_session_token"];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    let decoded: { userId: string };
    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      decoded = jwt.verify(token, secret) as { userId: string };
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
    const guestUserId = decoded.userId;

    const [rows] = await pool.execute(
      "SELECT * FROM matches WHERE (player1_id = ? OR player2_id = ?) AND state = 'playing'",
      [guestUserId, guestUserId]
    );

    if (!rows || (Array.isArray(rows) && rows.length === 0))
      return res
        .status(404)
        .json({ message: "No active match found for this user" });

    const match = Array.isArray(rows) ? rows[0] : rows;
    return res.status(200).json({ matchId: (match as any).match_id });
  } finally {
    await pool.end();
  }
}

async function verifySomeoneJoined(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  try {
    const token = req.cookies?.["guest_session_token"];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    let decoded: { userId: string };
    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      decoded = jwt.verify(token, secret) as { userId: string };
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    const guestUserId = decoded.userId;

    const [rows] = await pool.execute(
      "SELECT * FROM matches WHERE player1_id = ? AND state = 'playing'",
      [guestUserId]
    );

    if (!rows || (Array.isArray(rows) && rows.length === 0))
      return res
        .status(404)
        .json({ message: "No match with a second player found for this user" });

    const match = Array.isArray(rows) ? rows[0] : rows;
    return res.status(200).json({ matchId: (match as any).match_id });
  } finally {
    await pool.end();
  }
}

async function finishMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  try {
    const matchToken = req.cookies?.["match_session_token"];

    let decodedMatch: { matchId: string };
    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      decodedMatch = jwt.verify(matchToken, secret) as { matchId: string };
    } catch {
      return res.status(401).json({ message: "Invalid match token" });
    }

    const matchId = decodedMatch.matchId;

    await pool.execute(
      "UPDATE matches SET state = ? WHERE match_id = ? AND state = ?",
      ["finished", matchId, "playing"]
    );

    res.setHeader(
      "Set-Cookie",
      "match_session_token=; HttpOnly; Path=/; Max-Age=0"
    );

    return res.status(200).json({ message: "Match finished successfully" });
  } finally {
    await pool.end();
  }
}

async function cancelMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  try {
    const matchToken = req.cookies?.["match_session_token"];

    if (!matchToken) {
      return res.status(400).json({ message: "No match token provided" });
    }

    let decodedMatch: { matchId: string };
    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      decodedMatch = jwt.verify(matchToken, secret) as { matchId: string };
    } catch {
      return res.status(401).json({ message: "Invalid match token" });
    }

    const matchId = decodedMatch.matchId;

    await pool.execute(
      "UPDATE matches SET state = ? WHERE match_id = ? AND state IN (?, ?)",
      ["cancelled", matchId, "waiting", "playing"]
    );

    res.setHeader(
      "Set-Cookie",
      "match_session_token=; HttpOnly; Path=/; Max-Age=0"
    );

    return res.status(200).json({ message: "Match cancelled successfully" });
  } finally {
    await pool.end();
  }
}

async function cancelWaitingMatches(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  const guestSessionToken = req.cookies?.["guest_session_token"];

  if (!guestSessionToken) {
    return res.status(400).json({ message: "No guest session token provided" });
  }

  let decodedGuest: { userId: string };

  try {
    const secret = process.env.GUEST_SESSION_JWT_SECRET!;
    decodedGuest = jwt.verify(guestSessionToken, secret) as { userId: string };
  } catch {
    return res.status(401).json({ message: "Invalid guest session token" });
  }

  const userId = decodedGuest.userId;

  try {
    await pool.execute(
      "UPDATE matches SET state = ? WHERE state = ? AND player1_id = ?",
      ["cancelled", "waiting", userId]
    );
    return res
      .status(200)
      .json({ message: "Waiting matches cancelled successfully" });
  } finally {
    await pool.end();
  }
}

async function getCurrentMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  try {
    const matchToken = req.cookies?.["match_session_token"];

    if (!matchToken) {
      return res.status(400).json({ message: "No match token provided" });
    }

    let decodedMatch: { matchId: string };
    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      decodedMatch = jwt.verify(matchToken, secret) as { matchId: string };
    } catch {
      return res.status(401).json({ message: "Invalid match token" });
    }

    const matchId = decodedMatch.matchId;

    const [rows] = await pool.execute(
      `SELECT M.*, GU.username AS player1_name, GU2.username AS player2_name, GU.profile_icon_number AS player1_icon_number, GU2.profile_icon_number AS player2_icon_number
       FROM matches M
       INNER JOIN guest_users GU ON M.player1_id = GU.user_id 
       LEFT JOIN guest_users GU2 ON M.player2_id = GU2.user_id 
       WHERE M.match_id = ? ORDER BY M.match_id DESC LIMIT 1`,
      [matchId]
    );

    if (!rows || (Array.isArray(rows) && rows.length === 0))
      return res.status(404).json({ message: "Match not found" });

    const match = Array.isArray(rows) ? rows[0] : rows;

    return res.status(200).json({
      matchId: (match as any).match_id,
      player1Id: (match as any).player1_id,
      player2Id: (match as any).player2_id,
      player1username: (match as any).player1_name,
      player2username: (match as any).player2_name,
      player1IconNumber: (match as any).player1_icon_number,
      player2IconNumber: (match as any).player2_icon_number,
      player1Score: (match as any).player1_score,
      player2Score: (match as any).player2_score,
      playerTurn: (match as any).player_turn,
      state: (match as any).state,
      createdAt: (match as any).created_at,
      updatedAt: (match as any).updated_at,
    });
  } finally {
    await pool.end();
  }
}

async function getCurrentPlayer(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  try {
    const guestSessionToken = req.cookies?.["guest_session_token"];
    const matchToken = req.cookies?.["match_session_token"];

    if (!guestSessionToken) {
      return res
        .status(400)
        .json({ message: "No guest session token provided" });
    }

    let decodedGuest: { userId: string };
    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      decodedGuest = jwt.verify(guestSessionToken, secret) as {
        userId: string;
      };
    } catch {
      return res.status(401).json({ message: "Invalid guest session token" });
    }

    if (!matchToken) {
      return res.status(400).json({ message: "No match token provided" });
    }

    let decodedMatch: { matchId: string };
    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      decodedMatch = jwt.verify(matchToken, secret) as { matchId: string };
    } catch {
      return res.status(401).json({ message: "Invalid match token" });
    }
    const matchId = decodedMatch.matchId;

    const [rows] = await pool.execute(
      "SELECT player_turn, player1_id FROM matches WHERE match_id = ?",
      [matchId]
    );
    if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      return res.status(404).json({ message: "Match not found" });
    }
    const match = Array.isArray(rows) ? rows[0] : rows;
    const isFirstPlayerTurn =
      (match as any).player_turn === (match as any).player1_id;
    const amIPlayerOne = (match as any).player1_id === decodedGuest.userId;

    return res.status(200).json({ isFirstPlayerTurn, amIPlayerOne, match });
  } finally {
    await pool.end();
  }
}

async function getAllSlots(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  try {
    const matchToken = req.cookies?.["match_session_token"];

    if (!matchToken) {
      return res.status(400).json({ message: "No match token provided" });
    }

    let decodedMatch: { matchId: string };
    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      decodedMatch = jwt.verify(matchToken, secret) as { matchId: string };
    } catch {
      return res.status(401).json({ message: "Invalid match token" });
    }

    const matchId = decodedMatch.matchId;
    const [rows] = await pool.execute(
      `SELECT slot_id, value, image_type, image_url, state, x_position, y_position, description
       FROM match_grid_slots
       WHERE match_id = ?`,
      [matchId]
    );

    if (!rows || (Array.isArray(rows) && rows.length === 0))
      return res.status(404).json({ message: "No slots found for this match" });

    const slots = (rows as any[]).map((row) => ({
      slotId: row.slot_id,
      value: row.value,
      imageType: row.image_type,
      imageUrl: row.image_url,
      state: row.state,
      xPosition: row.x_position,
      yPosition: row.y_position,
      description: row.description,
    }));

    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json(slots);
  } finally {
    await pool.end();
  }
}

async function flipSlot(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  try {
    const { slotId } = req.body;
    await pool.execute(
      "UPDATE match_grid_slots SET state = ? WHERE slot_id = ?",
      ["revealed", slotId]
    );

    return res.status(200).json({ message: "Slot flipped successfully" });
  } finally {
    await pool.end();
  }
}

async function resetSlots(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  try {
    const { slotIds } = req.body;
    const placeholders = slotIds.map(() => "?").join(", ");

    await pool.execute(
      `UPDATE match_grid_slots SET state = ? WHERE slot_id IN (${placeholders})`,
      ["hidden", ...slotIds]
    );

    // Change turn to the other player
    const guestSessionToken = req.cookies?.["guest_session_token"];
    const matchToken = req.cookies?.["match_session_token"];
    if (!guestSessionToken || !matchToken) {
      return res
        .status(400)
        .json({ message: "Missing session tokens for turn change" });
    }
    let decodedGuest: { userId: string };
    let decodedMatch: { matchId: string };

    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      decodedGuest = jwt.verify(guestSessionToken, secret) as {
        userId: string;
      };
      decodedMatch = jwt.verify(matchToken, secret) as { matchId: string };
    } catch {
      return res.status(401).json({ message: "Invalid session tokens" });
    }

    const matchId = decodedMatch.matchId;

    const [rows] = await pool.execute(
      "SELECT player1_id, player2_id, player_turn FROM matches WHERE match_id = ?",
      [matchId]
    );

    if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      return res
        .status(404)
        .json({ message: "Match not found for turn change" });
    }

    const match = Array.isArray(rows) ? rows[0] : rows;
    const currentTurnPlayerId = (match as any).player_turn;
    const player1Id = (match as any).player1_id;
    const player2Id = (match as any).player2_id;

    const newTurnPlayerId =
      currentTurnPlayerId === player1Id ? player2Id : player1Id;

    await pool.execute(
      "UPDATE matches SET player_turn = ? WHERE match_id = ?",
      [newTurnPlayerId, matchId]
    );

    return res.status(200).json({
      message: "Slots reset successfully",
    });
  } finally {
    await pool.end();
  }
}

async function markSlotsAsMatched(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  try {
    const guestSessionToken = req.cookies?.["guest_session_token"];
    const matchToken = req.cookies?.["match_session_token"];

    if (!guestSessionToken) {
      return res
        .status(401)
        .json({ message: "No guest session token provided" });
    }

    if (!matchToken) {
      return res.status(400).json({ message: "No match token provided" });
    }

    let decodedGuest: { userId: string };
    let decodedMatch: { matchId: string };

    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      decodedGuest = jwt.verify(guestSessionToken, secret) as {
        userId: string;
      };
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    try {
      const secret = process.env.GUEST_SESSION_JWT_SECRET!;
      decodedMatch = jwt.verify(matchToken, secret) as { matchId: string };
    } catch {
      return res.status(401).json({ message: "Invalid match token" });
    }

    const matchId = decodedMatch.matchId;

    const [rows] = await pool.execute(
      "SELECT * FROM matches WHERE match_id = ?",
      [matchId]
    );
    const match = (rows as any[])[0];

    if (
      decodedGuest.userId !== (match as any).player1_id &&
      decodedGuest.userId !== (match as any).player2_id
    ) {
      return res
        .status(403)
        .json({ message: "User not authorized to mark slots as matched" });
    }

    const { slotIds } = req.body;
    const placeholders = slotIds.map(() => "?").join(", ");
    await pool.execute(
      `UPDATE match_grid_slots SET state = ? WHERE slot_id IN (${placeholders})`,
      ["matched", ...slotIds]
    );

    const isPlayer1 = decodedGuest.userId === (match as any).player1_id;
    const scoreField = isPlayer1 ? "player1_score" : "player2_score";

    await pool.execute(
      `UPDATE matches SET ${scoreField} = ${scoreField} + 1 WHERE match_id = ?`,
      [matchId]
    );

    return res
      .status(200)
      .json({ message: "Slots marked as matched successfully" });
  } finally {
    await pool.end();
  }
}
