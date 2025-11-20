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
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT GU.username, M.player1_score FROM guest_users GU 
      JOIN matches M ON GU.user_id = M.player1_id 
      UNION ALL SELECT GU.username, M.player2_score FROM guest_users GU 
      JOIN matches M ON GU.user_id = M.player2_id ORDER BY player1_score DESC LIMIT 10`
    );
    await connection.end();
    res.status(200).json({ topPlayers: rows });
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard data" });
  }
}
