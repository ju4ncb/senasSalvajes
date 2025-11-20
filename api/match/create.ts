import type { VercelRequest, VercelResponse } from "@vercel/node";
import mysql from "mysql2/promise";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
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
    const { player1Id } = req.body;
    const [result] = await pool.execute(
      "INSERT INTO matches (player1_id, player1_score, player2_id, player2_score, status) VALUES (?, ?, ?, ?, ?)",
      [player1Id, 0, null, 0, "waiting"]
    );
    const matchId = (result as any).insertId;
    return res
      .status(200)
      .json({
        matchId,
        player1Id,
        player1Score: 0,
        player2Id: null,
        player2Score: 0,
        status: "waiting",
      });
  } catch (error) {
    console.error("Error creating match:", error);
    return res.status(500).json({ message: "Failed to create match" });
  }
}
