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

function checkAuth(req) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
  const token = req.headers["x-admin-token"];
  return Boolean(ADMIN_PASSWORD && token);
}

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");
  if (!checkAuth(req)) return res.status(401).json({ ok: false, error: "Not authorized" });

  const redirects = loadJson(REDIRECT_FILE, {});
  // return as array for UI
  const entries = Object.keys(redirects).map((slug) => ({
    slug,
    destination: redirects[slug]
  }));
  res.json({ ok: true, entries });
}
