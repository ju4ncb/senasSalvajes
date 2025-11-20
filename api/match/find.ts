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
    const [rows] = await pool.execute(
      "SELECT * FROM matches WHERE status = 'waiting'"
    );
    await pool.end();
    if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      return res.status(404).json({ message: "No available matches found" });
    }
    res
      .status(200)
      .json({
        matchId: (Array.isArray(rows) ? rows[0] : (rows as any)).match_id,
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}
