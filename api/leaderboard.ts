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
      `SELECT GU.user_id, GU.username, SUM(scores.score) as total_score
      FROM guest_users GU
      JOIN (
      SELECT player1_id as user_id, player1_score as score FROM matches WHERE state = 'finished'
      UNION ALL
      SELECT player2_id as user_id, player2_score as score FROM matches WHERE state = 'finished'
      ) scores ON GU.user_id = scores.user_id
      GROUP BY GU.user_id, GU.username
      ORDER BY total_score DESC
      LIMIT 10`
    );
    await connection.end();
    res.status(200).json({ topPlayers: rows });
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard data" });
  }
}
