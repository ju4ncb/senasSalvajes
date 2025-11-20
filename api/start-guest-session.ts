import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
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
    const { username } = req.body;
    const randomProfileIconNumber = (
      Math.floor(Math.random() * 7) + 1
    ).toString();

    await pool.execute(
      "INSERT INTO guest_users (username, profile_icon_number) VALUES (?, ?)",
      [username, randomProfileIconNumber]
    );

    const [result] = await pool.execute("SELECT LAST_INSERT_ID() as userId");
    const userId = (result as any)[0].userId;

    const [result2] = await pool.execute(
      "SELECT created_at, updated_at FROM guest_users WHERE user_id = ?",
      [userId]
    );
    const createdAt = (result2 as any)[0].created_at;
    const updatedAt = (result2 as any)[0].updated_at;

    const secret = process.env.GUEST_SESSION_JWT_SECRET;
    if (!secret) {
      throw new Error("JWT secret not configured");
    }

    const token = jwt.sign(
      { userId, username, randomProfileIconNumber, createdAt, updatedAt },
      secret,
      {
        expiresIn: "1h",
      }
    );
    res.setHeader(
      "Set-Cookie",
      `guest_session_token=${token}; HttpOnly; Max-Age=3600; Path=/`
    );
    return res.status(200).json({ message: "Guest session started" });
  } catch (error) {
    console.error("Error creating guest session:", error);
    return res.status(500).json({ message: "Failed to create guest session" });
  }
}
