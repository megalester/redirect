// POST { password: "..." } -> { ok: true, token: "..." }
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const { password } = req.body || {};
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ ok: false, error: "Admin password not configured on server." });
  }

  if (!password) return res.status(400).json({ ok: false, error: "Missing password" });

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Invalid password" });
  }

  // create a token — simple HMAC of timestamp + secret
  const token = crypto.createHmac("sha256", ADMIN_PASSWORD).update(String(Date.now())).digest("hex").slice(0, 32);

  // Respond with token (client stores in memory/localStorage)
  res.json({ ok: true, token });
}
