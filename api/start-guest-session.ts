import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username } = req.body;
  const randomProfileIconNumber = (
    Math.floor(Math.random() * 10) + 1
  ).toString();
  const secret = process.env.GUEST_SESSION_JWT_SECRET;
  if (!secret) {
    throw new Error("JWT secret not configured");
  }

  const token = jwt.sign({ username, randomProfileIconNumber }, secret, {
    expiresIn: "1h",
  });
  res.setHeader(
    "Set-Cookie",
    `guest_session_token=${token}; HttpOnly; Max-Age=3600; Path=/`
  );
  return res.status(200).json({ message: "Guest session started" });
}
