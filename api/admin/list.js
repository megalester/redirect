/**
 * Fetch all redirects from Redis
 * Endpoint: /api/admin/list
 *
 * Requires env:
 * - ADMIN_TOKEN
 * - REDIS_URL
 */

import { createClient } from "redis";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "558d280cbd595086c711cca7789b1be4";
const REDIS_URL = process.env.REDIS_URL;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = req.headers["x-admin-token"];
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  if (!REDIS_URL) {
    return res.status(500).json({ ok: false, error: "REDIS_URL not configured" });
  }

  const redis = createClient({ url: REDIS_URL });
  redis.on("error", (err) => console.error("Redis Client Error", err));

  try {
    await redis.connect();

    // Fetch all keys matching "redirect:*"
    const keys = await redis.keys("redirect:*");
    const redirects = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) redirects.push(JSON.parse(data));
    }

    await redis.quit();
    res.status(200).json({ ok: true, redirects });
  } catch (err) {
    console.error("Failed to fetch redirects:", err);
    await redis.quit();
    res.status(500).json({ ok: false, error: err.message });
  }
}
