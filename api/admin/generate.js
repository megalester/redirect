import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.resolve("./data");
const REDIRECT_FILE = path.join(DATA_DIR, "redirects.json");

// helpers
function loadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8") || JSON.stringify(fallback));
  } catch (e) {
    console.error("loadJson", e);
    return fallback;
  }
}
function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function checkAuth(req) {
  // Must supply token and password is set
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
  const token = req.headers["x-admin-token"];
  return Boolean(ADMIN_PASSWORD && token);
}

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  if (!checkAuth(req)) return res.status(401).json({ ok: false, error: "Not authorized" });

  const { destination } = req.body || {};
  if (!destination) return res.status(400).json({ ok: false, error: "Missing destination URL" });

  // ensure data dir exists
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(REDIRECT_FILE)) fs.writeFileSync(REDIRECT_FILE, "{}");

  const redirects = loadJson(REDIRECT_FILE, {});

  // create slug: 2-char prefix + 64 hex hash
  const prefix = crypto.randomBytes(1).toString("hex");
  const hash = crypto.randomBytes(32).toString("hex");
  const slug = prefix + hash;

  const subdomains = ["gd2", "yrn", "8jr"];
  const sub = subdomains[Math.floor(Math.random() * subdomains.length)];
  const domain = process.env.BASE_DOMAIN || "mdght.com";

  redirects[slug] = destination;
  try {
    saveJson(REDIRECT_FILE, redirects);
  } catch (e) {
    console.error("Failed saving redirects:", e);
    return res.status(500).json({ ok: false, error: "Failed to save redirect" });
  }

  const redirectUrl = `https://${sub}.${domain}/${slug}`;
  res.json({ ok: true, slug, redirectUrl });
}
