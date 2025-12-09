/**
 * Usage:
 * node scripts/generate_local.js https://example.com/page
 *
 * Requires env:
 * - ADMIN_TOKEN (your admin token from Vercel)
 * - REDIS_URL (your Redis/Upstash URL, optional)
 */

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { createClient } from "redis";

const destination = process.argv[2];
if (!destination) {
  console.error("Usage: node scripts/generate_local.js <destinationUrl>");
  process.exit(1);
}

// Admin token
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "558d280cbd595086c711cca7789b1be4";

// Redis URL (optional)
const REDIS_URL = process.env.REDIS_URL;

// Local fallback file
const redirectsPath = path.resolve("data/redirects.json");
if (!fs.existsSync(redirectsPath)) fs.writeFileSync(redirectsPath, "[]", "utf-8");

// Subdomains
const subdomains = ["gd2", "yrn", "8jr"];
function pickSubdomain(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return subdomains[Math.abs(hash) % subdomains.length];
}

// Generate a random slug
function generateSlug(length = 6) {
  return Math.random().toString(36).substring(2, 2 + length);
}

// Cleanup old redirects (>30 days)
function cleanupLocalRedirects() {
  let redirects = [];
  try { redirects = JSON.parse(fs.readFileSync(redirectsPath, "utf-8")); } catch {}
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  redirects = redirects.filter(r => !r.timestamp || now - r.timestamp <= THIRTY_DAYS);
  fs.writeFileSync(redirectsPath, JSON.stringify(redirects, null, 2), "utf-8");
}

(async () => {
  cleanupLocalRedirects();

  let slug = generateSlug();
  let subdomain = pickSubdomain(slug);
  const timestamp = Date.now();

  // Try saving via API first
  try {
    const res = await fetch("https://redirect-phi-one.vercel.app/api/admin/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": ADMIN_TOKEN
      },
      body: JSON.stringify({ destination })
    });

    const json = await res.json();
    if (json.ok) {
      slug = json.slug || slug;
      subdomain = pickSubdomain(slug);
      console.log("✅ Redirect generated via API!");
    } else {
      console.warn("⚠️ API failed, falling back to Redis/local:", json.error);
    }
  } catch (err) {
    console.warn("⚠️ API error, falling back to Redis/local:", err.message);
  }

  if (REDIS_URL) {
    // Connect to Redis
    const redis = createClient({ url: REDIS_URL });
    redis.on("error", (err) => console.error("Redis Client Error:", err));
    await redis.connect();

    try {
      const key = `redirect:${slug}`;
      await redis.set(key, JSON.stringify({ slug, destination, subdomain, timestamp }));
      console.log("✅ Redirect saved in Redis!");

      // Cleanup old Redis keys (optional, scan & delete)
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      let cursor = 0;
      do {
        const result = await redis.scan(cursor, { MATCH: "redirect:*", COUNT: 100 });
        cursor = parseInt(result.cursor);
        for (const key of result.keys) {
          const val = await redis.get(key);
          if (val) {
            const obj = JSON.parse(val);
            if (obj.timestamp && Date.now() - obj.timestamp > THIRTY_DAYS) {
              await redis.del(key);
            }
          }
        }
      } while (cursor !== 0);

    } catch (err) {
      console.warn("⚠️ Failed to save in Redis, saving locally:", err.message);

      let redirects = [];
      try { redirects = JSON.parse(fs.readFileSync(redirectsPath, "utf-8")); } catch {}
      redirects.push({ slug, destination, subdomain, timestamp });
      fs.writeFileSync(redirectsPath, JSON.stringify(redirects, null, 2), "utf-8");
      console.log("✅ Redirect saved locally!");
    }

    await redis.quit();
  } else {
    // Save locally
    let redirects = [];
    try { redirects = JSON.parse(fs.readFileSync(redirectsPath, "utf-8")); } catch {}
    redirects.push({ slug, destination, subdomain, timestamp });
    fs.writeFileSync(redirectsPath, JSON.stringify(redirects, null, 2), "utf-8");
    console.log("✅ Redirect saved locally!");
  }

  console.log("Slug:", slug);
  console.log("Destination:", destination);
  console.log(`Short URL (example): https://${subdomain}.yourdomain.com/${slug}`);
})();
