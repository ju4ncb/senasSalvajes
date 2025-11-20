import type { VercelRequest, VercelResponse } from "@vercel/node";
import mysql from "mysql2/promise";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
  };
  try {
    const pool = mysql.createPool(dbConfig);
    const { matchId } = req.query;
    const [rows] = await pool.execute(
      `SELECT M.*, GU.username as player1_name, GU2.username as player2_name FROM matches M 
      INNER JOIN guest_users GU ON M.player1_id = GU.user_id 
      INNER JOIN guest_users GU2 ON M.player2_id = GU2.user_id 
      WHERE M.match_id = ? ORDER BY M.match_id DESC LIMIT 1`,
      [matchId]
    );
    await pool.end();
    if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      return res.status(404).json({ message: "Match not found" });
    }
    const match = Array.isArray(rows) ? rows[0] : rows;
    res.status(200).json({
      matchId: (match as any).match_id,
      player1Id: (match as any).player1_id,
      player2Id: (match as any).player2_id,
      player1username: (match as any).player1_name,
      player2username: (match as any).player2_name,
      player1Score: (match as any).player1_score,
      player2Score: (match as any).player2_score,
      status: (match as any).status,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}
