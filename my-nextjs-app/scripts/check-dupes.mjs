import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const PUBLIC = path.join(process.cwd(), "public");
const MANIFEST = path.join(PUBLIC, "destinations", "_manifest.json");
const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));

const sha1 = (p) => crypto.createHash("sha1").update(fs.readFileSync(p)).digest("hex");

// hash -> Set of activity names that use a file with that content
const byHash = new Map();
let totalFiles = 0, missing = 0;
const activitiesWithImages = Object.keys(manifest).filter((n) => manifest[n]?.length).length;

for (const [name, paths] of Object.entries(manifest)) {
  for (const rel of paths || []) {
    const abs = path.join(PUBLIC, rel.replace(/^\//, ""));
    if (!fs.existsSync(abs)) { missing++; continue; }
    totalFiles++;
    const h = sha1(abs);
    if (!byHash.has(h)) byHash.set(h, new Set());
    byHash.get(h).add(name);
  }
}

let sharedContents = 0;
const examples = [];
for (const [h, names] of byHash) {
  if (names.size > 1) {
    sharedContents++;
    if (examples.length < 15) examples.push([...names]);
  }
}

console.log(`activities with images: ${activitiesWithImages}`);
console.log(`manifest image files referenced: ${totalFiles} (missing on disk: ${missing})`);
console.log(`distinct image contents: ${byHash.size}`);
console.log(`contents shared by >1 activity: ${sharedContents}`);
if (examples.length) {
  console.log(`\nshared-content groups (sample):`);
  for (const g of examples) console.log("  - " + g.join("  |  "));
}
