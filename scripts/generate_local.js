import fs from "fs";
import path from "path";

// Define your subdomains
const subdomains = ["gd2", "yrn", "8jr", "hge4"];

// Destination URL from command line
const destination = process.argv[2];
if (!destination) {
  console.error("Usage: node scripts/generate_local.js <destinationUrl>");
  process.exit(1);
}

// Path to redirects.json
const redirectsFile = path.join(process.cwd(), "data", "redirects.json");

// Load existing redirects
let redirects = [];
try {
  const data = fs.readFileSync(redirectsFile, "utf-8");
  redirects = JSON.parse(data);
  if (!Array.isArray(redirects)) redirects = [];
} catch (err) {
  console.warn("redirects.json missing or invalid, creating new one...");
  redirects = [];
}

// Generate a unique slug (6 chars)
function generateSlug() {
  let slug;
  do {
    slug = Math.random().toString(36).substring(2, 8);
  } while (redirects.find(r => r.slug === slug));
  return slug;
}

const slug = generateSlug();

// Add new redirect
redirects.push({ slug, destination });

// Save back
fs.writeFileSync(redirectsFile, JSON.stringify(redirects, null, 2), "utf-8");

// Pick a random subdomain
const rndSub = subdomains[Math.floor(Math.random() * subdomains.length)];
const shortUrl = `https://${rndSub}.example.com/${slug}`;

console.log("✅ Redirect generated successfully!");
console.log(`Slug: ${slug}`);
console.log(`Destination: ${destination}`);
console.log(`Short URL: ${shortUrl}`);
