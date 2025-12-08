import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("./data");
const REDIRECT_FILE = path.join(DATA_DIR, "redirects.json");

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
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
  const token = req.headers["x-admin-token"];
  return Boolean(ADMIN_PASSWORD && token);
}

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  if (!checkAuth(req)) return res.status(401).json({ ok: false, error: "Not authorized" });

  const { slug } = req.body || {};
  if (!slug) return res.status(400).json({ ok: false, error: "Missing slug" });

  const redirects = loadJson(REDIRECT_FILE, {});
  if (!redirects[slug]) return res.status(404).json({ ok: false, error: "Slug not found" });

  delete redirects[slug];
  try {
    saveJson(REDIRECT_FILE, redirects);
  } catch (e) {
    console.error("Failed saving redirects:", e);
    return res.status(500).json({ ok: false, error: "Failed to save" });
  }
  res.json({ ok: true });
}
