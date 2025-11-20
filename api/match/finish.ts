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
    const { matchId } = req.body;
    const [result] = await pool.execute(
      "UPDATE matches SET status = ? WHERE match_id = ? AND status = ?",
      ["finished", matchId, "in_progress"]
    );
    await pool.end();
    res.status(200).json({ message: "Match finished successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}
