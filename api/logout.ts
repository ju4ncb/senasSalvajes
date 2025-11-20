import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  res.setHeader(
    "Set-Cookie",
    `guest_session_token=; HttpOnly; Max-Age=0; Path=/`
  );
  return res.status(200).json({ message: "Logged out" });
}
