import fs from "fs";

try {
  fs.writeFileSync("data/redirects.json", JSON.stringify([{ test: "ok" }], null, 2), "utf-8");
  console.log("✅ Write successful!");
} catch (err) {
  console.error("❌ Failed to write:", err);
}
