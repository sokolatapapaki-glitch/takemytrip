// -----------------------------------------------------------------------------
// List a city's activities + their canonical image folder slug.
// -----------------------------------------------------------------------------
// Reads the same catalogue files the app uses and prints, for each activity:
//   <folder>\t<name>
// where <folder> is "<id>-<slug>" — exactly what gen-city-images.mjs expects as
// the `folder` field (and what --only=<folder> matches). This is the source of
// truth for the curated lists, so activity names/folders never drift from the app.
//
//   node scripts/list-activities.mjs --city=rome           # human table
//   node scripts/list-activities.mjs --city=rome --json    # JSON array
//   node scripts/list-activities.mjs                        # all cities
// -----------------------------------------------------------------------------
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);
const onlyCity = typeof args.city === "string" ? args.city.toLowerCase() : null;

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

// Parse `name: "..."` entries, reading the numeric `id:` just before each (else a
// per-file index). Mirrors gen-activity-images.mjs so folders match the app.
function entriesFrom(text, cityId) {
  const matches = [...text.matchAll(/name:\s*"((?:[^"\\]|\\.)*)"/g)];
  return matches.map((m, k) => {
    const start = m.index;
    const idm = text.slice(Math.max(0, start - 120), start).match(/id:\s*(\d+)\s*,\s*$/);
    const id = idm ? Number(idm[1]) : k + 1;
    const name = m[1];
    return { id, name, cityId, folder: `${id}-${slugify(name) || "act"}` };
  });
}

function loadActivities() {
  const out = [];
  const genDir = path.join(ROOT, "data", "activities");
  for (const f of fs.readdirSync(genDir)) {
    if (!f.endsWith(".data.ts") || f === "_helpers.ts") continue;
    const cityId = f.replace(/\.data\.ts$/, "");
    out.push(...entriesFrom(fs.readFileSync(path.join(genDir, f), "utf8"), cityId));
  }
  // Curated Rome + Paris live together in data/activities.data.ts.
  const curatedPath = path.join(ROOT, "data", "activities.data.ts");
  if (fs.existsSync(curatedPath)) {
    const curated = fs.readFileSync(curatedPath, "utf8");
    const pIdx = curated.indexOf("const PARIS_BASE");
    if (pIdx >= 0) {
      out.push(...entriesFrom(curated.slice(0, pIdx), "rome"));
      out.push(...entriesFrom(curated.slice(pIdx), "paris"));
    } else {
      out.push(...entriesFrom(curated, "rome"));
    }
  }
  return out;
}

let activities = loadActivities();
if (onlyCity) activities = activities.filter((a) => a.cityId === onlyCity);

if (!activities.length) {
  const cities = [...new Set(loadActivities().map((a) => a.cityId))].sort();
  console.error(onlyCity ? `No activities for city "${onlyCity}".` : "No activities found.");
  console.error(`Known cities: ${cities.join(", ")}`);
  process.exit(1);
}

if (args.json) {
  console.log(JSON.stringify(activities, null, 2));
} else {
  for (const a of activities) console.log(`${a.folder}\t${a.name}`);
  console.log(`\n${activities.length} activities` + (onlyCity ? ` in ${onlyCity}` : ""));
}
