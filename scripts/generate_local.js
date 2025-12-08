/**
 * Usage:
 * node scripts/generate_local.js https://google.com
 *
 * Requires env ADMIN_TOKEN or you can paste token after running login endpoint once.
 */
import fetch from "node-fetch";

const destination = process.argv[2];
if (!destination) {
  console.error("Usage: node scripts/generate_local.js <destinationUrl>");
  process.exit(1);
}

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

(async () => {
  const res = await fetch("https://YOUR_DEPLOYED_URL.vercel.app/api/admin/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": ADMIN_TOKEN
    },
    body: JSON.stringify({ destination })
  });
  const json = await res.json();
  console.log(json);
})();
