/**
 * Usage:
 * node scripts/generate_local.js https://example.com/page
 *
 * Requires env ADMIN_TOKEN (your admin token from Vercel)
 */

import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const destination = process.argv[2];
if (!destination) {
  console.error("Usage: node scripts/generate_local.js <destinationUrl>");
  process.exit(1);
}

// Use your latest working token
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "558d280cbd595086c711cca7789b1be4";

// Path to your local redirects file
const redirectsPath = path.resolve("data/redirects.json");

// Subdomains list for short URLs
const subdomains = ["gd2", "yrn", "8jr"];

// Generate a deterministic subdomain from slug (same as admin)
function pickSubdomain(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return subdomains[Math.abs(hash) % subdomains.length];
}

// Generate a random slug similar to admin panel
function generateSlug(length = 6) {
  return Math.random().toString(36).substring(2, 2 + length);
}

// Ensure folder exists
const redirectsDir = path.dirname(redirectsPath);
if (!fs.existsSync(redirectsDir)) fs.mkdirSync(redirectsDir, { recursive: true });

// Ensure JSON file exists
if (!fs.existsSync(redirectsPath)) fs.writeFileSync(redirectsPath, "[]", "utf-8");

(async () => {
  let slug, subdomain;
  let apiUsed = false;

  try {
    // Attempt API call
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
      slug = json.slug || json.redirectUrl?.split("/").pop() || generateSlug();
      subdomain = pickSubdomain(slug);
      apiUsed = true;
      console.log("✅ Redirect generated via API!");
    } else {
      console.warn("API failed, falling back to local redirect:", json.error);
      slug = generateSlug();
      subdomain = pickSubdomain(slug);
    }
  } catch (err) {
    console.warn("API error, falling back to local redirect:", err.message);
    slug = generateSlug();
    subdomain = pickSubdomain(slug);
  }

  // Read existing redirects.json
  let redirects = [];
  try {
    const data = fs.readFileSync(redirectsPath, "utf-8");
    redirects = JSON.parse(data);
  } catch (err) {
    console.warn("Warning: failed to parse redirects.json, starting fresh");
    redirects = [];
  }

  // Add new redirect
  redirects.push({ slug, destination, subdomain, apiUsed });

  // Save back to redirects.json safely
  try {
    fs.writeFileSync(redirectsPath, JSON.stringify(redirects, null, 2), "utf-8");
    console.log("✅ Redirect saved locally!");
    console.log("Slug:", slug);
    console.log("Destination:", destination);
    console.log(`Short URL (example): https://${subdomain}.yourdomain.com/${slug}`);
  } catch (err) {
    console.error("Failed to save redirect:", err);
    process.exit(1);
  }
})();
