// -----------------------------------------------------------------------------
// Sync app/data/activities (+ destinations) -> the n8n "context" JSON folder.
// -----------------------------------------------------------------------------
// The catalogues live as TypeScript that calls builder helpers, so n8n (plain JS
// in Docker) can't read them directly. This bundles the data with esbuild,
// evaluates it, and writes plain JSON into:
//   C:/Users/kopot/OneDrive/Desktop/Dimitris/n8n_data/tmt_marketing/context/
// which is visible to the n8n container via the Desktop bind-mount (=> /files).
//
// It NEVER changes the `alreadyUsed` flag: any existing value in the current
// context files is read first and re-applied, so re-syncing after editing
// activities keeps your "used" marks intact. New items default alreadyUsed:false.
//
// Run from the my-nextjs-app folder:  node scripts/sync-context.mjs
import { build } from "esbuild";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";

const root = process.cwd();
const p = (rel) => path.join(root, rel);
const OUT_DIR = "C:/Users/kopot/OneDrive/Desktop/Dimitris/n8n_data/tmt_marketing/context";

const slug = (s) =>
  String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// --- bundle + evaluate the TS data ------------------------------------------
const entry = `
import { GENERATED_ACTIVITIES_BY_DESTINATION } from ${JSON.stringify(p("data/activities/index.ts"))};
import { ROME_ACTIVITIES } from ${JSON.stringify(p("data/activities/rome.data.ts"))};
import { PARIS_ACTIVITIES } from ${JSON.stringify(p("data/activities.data.ts"))};
import { DESTINATIONS } from ${JSON.stringify(p("data/destinations.data.ts"))};
export const MAP = { ...GENERATED_ACTIVITIES_BY_DESTINATION, rome: ROME_ACTIVITIES, paris: PARIS_ACTIVITIES };
export const DESTS = DESTINATIONS;
`;
const bundlePath = p("scripts/.sync-context.bundle.mjs");
await build({ stdin: { contents: entry, resolveDir: root, loader: "ts" }, bundle: true, format: "esm", platform: "node", outfile: bundlePath, logLevel: "silent" });
const { MAP, DESTS } = await import(pathToFileURL(bundlePath).href);
import("fs").then((fs) => fs.rmSync(bundlePath, { force: true }));

mkdirSync(OUT_DIR, { recursive: true });

// Read a previously-written file so we can preserve `alreadyUsed`.
const readPrev = (file) => {
  const fp = path.join(OUT_DIR, file);
  if (!existsSync(fp)) return null;
  try { return JSON.parse(readFileSync(fp, "utf8")); } catch { return null; }
};

// --- activities: one JSON per city ------------------------------------------
const cities = [];
let total = 0;
for (const [cityId, list] of Object.entries(MAP)) {
  const acts = (list || []).filter((a) => a && a.name);
  if (acts.length === 0) continue;

  // Preserve alreadyUsed from the current file, keyed by the stable `key`.
  const prev = readPrev(`${cityId}.json`) || [];
  const prevUsed = new Map(prev.map((x) => [x.key, !!x.alreadyUsed]));

  const out = acts.map((a, i) => {
    // Globally-unique, stable id: city + name-slug + index (index keeps it unique
    // even when two names slug to the same thing, e.g. Greek-only names).
    const key = `${cityId}-${slug(a.name) || "act"}-${a.id ?? i}`;
    return {
      key,
      id: a.id ?? null,
      destination: cityId,       // which city/destination this activity belongs to
      name: a.name,
      description: a.description || "",
      tags: Array.isArray(a.tags) ? a.tags : [],
      alreadyUsed: prevUsed.get(key) ?? false,
    };
  });
  writeFileSync(path.join(OUT_DIR, `${cityId}.json`), JSON.stringify(out, null, 2), "utf8");
  cities.push({ id: cityId, count: out.length });
  total += out.length;
}

// --- destinations.json -------------------------------------------------------
const prevDest = readPrev("destinations.json") || [];
const prevDestUsed = new Map(prevDest.map((d) => [d.id, !!d.alreadyUsed]));
const destinations = (DESTS || []).map((d) => ({
  id: d.id,
  name: d.name,
  country: d.country ?? null,
  emoji: d.emoji ?? null,
  hasActivities: !!MAP[d.id],
  alreadyUsed: prevDestUsed.get(d.id) ?? false,
}));
writeFileSync(path.join(OUT_DIR, "destinations.json"), JSON.stringify(destinations, null, 2), "utf8");

// --- manifest ----------------------------------------------------------------
writeFileSync(
  path.join(OUT_DIR, "_index.json"),
  JSON.stringify({ cities: cities.map((c) => c.id), counts: cities, destinations: destinations.length, generatedAt: new Date().toISOString() }, null, 2),
  "utf8"
);

console.log(`Synced ${cities.length} city files (${total} activities) + ${destinations.length} destinations -> ${OUT_DIR}`);
