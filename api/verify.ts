import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const token = req.cookies?.["guest_session_token"];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const secret = process.env.GUEST_SESSION_JWT_SECRET!;
    const decoded = jwt.verify(token, secret) as {
      username: string;
      randomProfileIconNumber: string;
    };
    return res.status(200).json(decoded);
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
