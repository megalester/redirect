import fs from "fs";
import path from "path";

const destination = process.argv[2];
if (!destination) {
  console.error("Usage: node scripts/generate_local.js <destinationUrl>");
  process.exit(1);
}

const redirectsFile = path.join(process.cwd(), "data", "redirects.json");

let redirects = [];
try {
  const data = fs.readFileSync(redirectsFile, "utf-8");
  redirects = JSON.parse(data);
  if (!Array.isArray(redirects)) redirects = [];
} catch (err) {
  console.warn("redirects.json missing or invalid, creating new one...");
  redirects = [];
}

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

console.log("✅ Redirect generated successfully!");
console.log(`Slug: ${slug}`);
console.log(`Destination: ${destination}`);
console.log(`Short URL (example): https://gd2.yourdomain.com/${slug}`);
