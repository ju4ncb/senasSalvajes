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
      // -------------------------------------------------
      // CREATE MATCH
      // -------------------------------------------------
      case "create":
        if (req.method !== "POST")
          return res.status(405).json({ message: "Method not allowed" });

        return createMatch(req, res);

      // -------------------------------------------------
      // FIND WAITING MATCH
      // -------------------------------------------------
      case "find":
        if (req.method !== "GET")
          return res.status(405).json({ message: "Method not allowed" });

        return findMatch(req, res);

      // -------------------------------------------------
      // JOIN MATCH
      // -------------------------------------------------
      case "join":
        if (req.method !== "GET")
          return res.status(405).json({ message: "Method not allowed" });

        return joinMatch(req, res);

      // -------------------------------------------------
      // VERIFY MATCH
      // -------------------------------------------------
      case "verify-in-match":
        if (req.method !== "GET")
          return res.status(405).json({ message: "Method not allowed" });

        return verifyMatch(req, res);

      // -------------------------------------------------
      // VERIFY SOMEONE JOINED
      // -------------------------------------------------
      case "verify-someone-joined":
        if (req.method !== "GET")
          return res.status(405).json({ message: "Method not allowed" });

        return verifySomeoneJoined(req, res);

      // -------------------------------------------------
      // FINISH MATCH
      // -------------------------------------------------
      case "finish":
        if (req.method !== "POST")
          return res.status(405).json({ message: "Method not allowed" });

        return finishMatch(req, res);

      // -------------------------------------------------
      // CANCEL MATCH
      // -------------------------------------------------
      case "cancel":
        if (req.method !== "POST")
          return res.status(405).json({ message: "Method not allowed" });

        return cancelMatch(req, res);

      // -------------------------------------------------
      // GET MATCH INFO
      // -------------------------------------------------
      case "get":
        if (req.method !== "GET")
          return res.status(405).json({ message: "Method not allowed" });

        return getCurrentMatch(req, res);

      default:
        return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error in main handler:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ============================================================
// ======================= HANDLERS ============================
// ============================================================

async function createMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  const { player1Id } = req.body;

  const [result] = await pool.execute(
    "INSERT INTO matches (player1_id, player1_score, player2_id, player2_score, state) VALUES (?, ?, ?, ?, ?)",
    [player1Id, 0, null, 0, "waiting"]
  );

  const matchId = (result as any).insertId;

  return res.status(200).json({
    matchId,
    player1Id,
    player1Score: 0,
    player2Id: null,
    player2Score: 0,
    state: "waiting",
  });
}

async function findMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  const token = req.cookies?.["guest_session_token"];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  let decoded: { userId: string };
  try {
    const secret = process.env.GUEST_SESSION_JWT_SECRET!;
    decoded = jwt.verify(token, secret) as {
      userId: string;
    };
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

  // Save matchId in session as well
  const matchToken = jwt.sign(
    { matchId },
    process.env.GUEST_SESSION_JWT_SECRET!,
    { expiresIn: "1h" }
  );

  res.setHeader(
    "Set-Cookie",
    `match_session_token=${matchToken}; HttpOnly; Path=/; Max-Age=3600`
  );

  return res.status(200).json({
    matchId,
  });
}

async function joinMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  const guestSessionToken = req.cookies?.["guest_session_token"];
  const matchToken = req.cookies?.["match_session_token"];

  if (!guestSessionToken) {
    return res.status(401).json({ message: "No guest session token provided" });
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
    decodedMatch = jwt.verify(matchToken, secret) as {
      matchId: string;
    };
  } catch {
    return res.status(401).json({ message: "Invalid match token" });
  }

  const matchId = decodedMatch.matchId;

  await pool.execute(
    "UPDATE matches SET player2_id = ?, state = ? WHERE match_id = ? AND state = ?",
    [guestUserId, "playing", matchId, "waiting"]
  );

  return res.status(200).json({ message: "Joined match successfully" });
}

async function verifyMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  const token = req.cookies?.["guest_session_token"];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  let decoded: { userId: string };
  try {
    const secret = process.env.GUEST_SESSION_JWT_SECRET!;
    decoded = jwt.verify(token, secret) as {
      userId: string;
    };
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
}

async function verifySomeoneJoined(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  const token = req.cookies?.["guest_session_token"];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  let decoded: { userId: string };
  try {
    const secret = process.env.GUEST_SESSION_JWT_SECRET!;
    decoded = jwt.verify(token, secret) as {
      userId: string;
    };
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
}

async function finishMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  const { matchId } = req.body;

  await pool.execute(
    "UPDATE matches SET state = ? WHERE match_id = ? AND state = ?",
    ["finished", matchId, "playing"]
  );

  return res.status(200).json({ message: "Match finished successfully" });
}

async function cancelMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
  const { matchId } = req.body;

  await pool.execute(
    "UPDATE matches SET state = ? WHERE match_id = ? AND state IN (?, ?)",
    ["cancelled", matchId, "waiting", "playing"]
  );

  return res.status(200).json({ message: "Match cancelled successfully" });
}

async function getCurrentMatch(req: VercelRequest, res: VercelResponse) {
  const pool = getDB();
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
    `SELECT M.*, GU.username AS player1_name, GU2.username AS player2_name 
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
    player1Score: (match as any).player1_score,
    player2Score: (match as any).player2_score,
    state: (match as any).state,
  });
}
