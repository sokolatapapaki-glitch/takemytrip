// scripts/sync-photo-images.mjs
// -----------------------------------------------------------------------------
// Copy each tied Photos-repo image into public/destinations/<id>/<folder>/1.jpg
// (avif -> jpg via sharp). Leaves the generated map/manifest byte-identical
// unless an activity had no prior entry (or a non-1.jpg first path). Credits are
// never touched.
//
//   node scripts/sync-photo-images.mjs --city=barcelona --dry-run
//   node scripts/sync-photo-images.mjs --city=barcelona
//   node scripts/sync-photo-images.mjs                       # every configured city
//   node scripts/sync-photo-images.mjs --city=barcelona --only="Park Güell,Picasso Museum"
// -----------------------------------------------------------------------------
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { PHOTO_ROOT, TIES } from "./photo-sync.config.mjs";
import {
  parseGeneratedMap, pickSourceImage, resolveTie, emitGeneratedText,
} from "./photo-sync.lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const DEST = path.join(PUBLIC, "destinations");
const GEN_TS = path.join(ROOT, "app", "activities", "components", "activityImages.generated.ts");
const MANIFEST = path.join(DEST, "_manifest.json");

function parseArgs(argv) {
  const a = { city: null, only: null, dryRun: false };
  for (const arg of argv) {
    const m = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    if (m[1] === "city") a.city = (m[2] || "").toLowerCase();
    else if (m[1] === "only") a.only = new Set((m[2] || "").split(",").map((s) => s.trim()).filter(Boolean));
    else if (m[1] === "dry-run") a.dryRun = true;
  }
  return a;
}

function loadCatalogue() {
  const out = execFileSync(process.execPath, ["scripts/list-activities.mjs", "--json"],
    { cwd: ROOT, encoding: "utf8" });
  return JSON.parse(out);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const catalogue = loadCatalogue();
  const genMap = parseGeneratedMap(fs.readFileSync(GEN_TS, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));

  const cities = args.city ? [args.city] : Object.keys(TIES);
  let genChanged = false, manChanged = false;
  const rows = [];

  for (const city of cities) {
    const cfg = TIES[city];
    if (!cfg) { rows.push(["NO-CONFIG", city, "", ""]); continue; }
    const cityCat = catalogue.filter((x) => x.cityId === city);
    for (const [photoFolder, projName] of Object.entries(cfg.map)) {
      if (args.only && !args.only.has(photoFolder)) continue;
      const srcDir = path.join(PHOTO_ROOT, cfg.dir, photoFolder);
      if (!fs.existsSync(srcDir)) { rows.push(["MISS-SRC", city, photoFolder, srcDir]); continue; }
      const file = pickSourceImage(fs.readdirSync(srcDir));
      if (!file) { rows.push(["NO-IMG", city, photoFolder, srcDir]); continue; }
      const r = resolveTie(projName, genMap, cityCat, city);
      if (!r) { rows.push(["UNMATCHED", city, photoFolder, projName]); continue; }

      const outRel = `/destinations/${r.id}/${r.folder}/1.jpg`;
      const outAbs = path.join(DEST, r.id, r.folder, "1.jpg");
      rows.push([args.dryRun ? "DRY" : "WRITE", city, `${photoFolder} → ${r.name}`, outRel]);
      if (args.dryRun) continue;

      fs.mkdirSync(path.dirname(outAbs), { recursive: true });
      await sharp(path.join(srcDir, file)).jpeg({ quality: 82 }).toFile(outAbs);

      if (r.inMap) {
        const cur = genMap.get(r.name);
        if (cur[0] !== outRel) { genMap.set(r.name, [outRel, ...cur.slice(1)]); genChanged = true; }
        const mc = manifest[r.name];
        if (!mc || mc[0] !== outRel) { manifest[r.name] = [outRel, ...(mc ? mc.slice(1) : [])]; manChanged = true; }
      } else {
        genMap.set(r.name, [outRel]); manifest[r.name] = [outRel];
        genChanged = true; manChanged = true;
      }
    }
  }

  if (!args.dryRun) {
    if (genChanged) fs.writeFileSync(GEN_TS, emitGeneratedText(genMap));
    if (manChanged) fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  }

  for (const [status, city, what, target] of rows) {
    console.log(`${status.padEnd(9)} ${city.padEnd(10)} ${what}  ${target}`);
  }
  const wrote = rows.filter((x) => x[0] === "WRITE").length;
  const dry = rows.filter((x) => x[0] === "DRY").length;
  const bad = rows.filter((x) => ["MISS-SRC", "NO-IMG", "UNMATCHED", "NO-CONFIG"].includes(x[0]));
  console.log(`\n${args.dryRun ? `${dry} would update` : `${wrote} image(s) written`}` +
    `${genChanged ? ", generated map updated" : ""}${manChanged ? ", manifest updated" : ""}` +
    `${bad.length ? `, ${bad.length} issue(s)` : ""}.`);
  if (bad.length) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
