import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.resolve("./data");
const REDIRECT_FILE = path.join(DATA_DIR, "redirects.json");
const ANALYTICS_FILE = path.join(DATA_DIR, "analytics.json");

// Helper to load JSON safely
function loadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw || JSON.stringify(fallback));
  } catch (e) {
    console.error("loadJson error", e);
    return fallback;
  }
}

// Helper to save JSON (atomic-ish)
function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

export default function handler(req, res) {
  const { slug } = req.query || {};

  if (!slug) {
    res.status(400).send("Missing slug");
    return;
  }

  // load redirects
  const redirects = loadJson(REDIRECT_FILE, {});

  const target = redirects[slug];
  if (!target) {
    res.status(404).send("Invalid redirect");
    return;
  }

  // Build analytics record
  const analytics = loadJson(ANALYTICS_FILE, []);
  // Get IP (try headers then connection)
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
  // Hash IP for privacy
  const hash = crypto.createHash("sha256").update(ip || "unknown").digest("hex");
  const country = req.headers["x-vercel-ip-country"] || req.headers["cf-ipcountry"] || "XX";
  const ua = req.headers["user-agent"] || "";
  const ts = new Date().toISOString();

  const record = {
    slug,
    timestamp: ts,
    country,
    ua,
    ip_hash: hash,
    referer: req.headers["referer"] || null
  };

  analytics.push(record);

  // Save analytics (best-effort)
  try {
    saveJson(ANALYTICS_FILE, analytics);
  } catch (e) {
    console.error("Failed saving analytics:", e);
  }

  // Redirect
  res.writeHead(302, { Location: target });
  res.end();
}
