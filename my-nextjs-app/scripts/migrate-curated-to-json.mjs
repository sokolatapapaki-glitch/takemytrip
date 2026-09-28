// -----------------------------------------------------------------------------
// One-off: move the hand-curated Rome + Paris engine values into the JSON
// -----------------------------------------------------------------------------
// docs/plans/01-editor-planner-sync.md §6 step 2. Reads scripts/curated-snapshot.json
// (taken by snapshot-curated.mts from the curated catalogues) and writes the tuned
// values into takemytrip/data/rome.json and paris.json as the optional contract
// fields — opening_hours, vibes, priority (and duration_hours for Rome) — ONLY
// where they differ from what the generator would synthesize anyway. Uses the
// generator's own helpers, so "differs" means exactly that.
//
// Rome: every activity, matched by id (all 26 ids + names match the JSON).
// Paris: the planner's 10 entries and the JSON's 22 are different lists; only the
// overlaps in PARIS_MAP carry over (decisions E1/E2 in the plan).
//
// Never changes prices: a tuned `cost` that differs from prices.adult is only
// REPORTED. Same for is_lunch, which the JSON contract doesn't carry.
//
// Run from my-nextjs-app:   node scripts/migrate-curated-to-json.mjs [--dry-run]

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PRESET, DEFAULT, normCat, resolvePriority } from "./gen-activities.lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_DIR = resolve(__dirname, "../../takemytrip/data");
const DRY = process.argv.includes("--dry-run");
const snapshot = JSON.parse(readFileSync(join(__dirname, "curated-snapshot.json"), "utf8"));

// Planner Paris name -> paris.json name, and what carries over (plan E1/E2).
const PARIS_MAP = {
  "Eiffel Tower": { to: "Πύργος του Άιφελ", hours: true },
  "Louvre Museum": { to: "Μουσείο του Λούβρου", hours: true },
  "Musée d'Orsay": { to: "Μουσείο Orsay", hours: true },
  "Sainte-Chapelle": { to: "Sainte-Chapelle", hours: true },
  "Luxembourg Gardens": { to: "Κήποι του Λουξεμβούργου", hours: true },
  // The planner entry was the whole Montmartre walk (open all day); the JSON entry
  // is the Dome, which has real hours — so only vibes + priority carry over.
  "Montmartre & Sacré-Cœur": { to: "Sacré-Cœur (Θόλος)", hours: false },
};

const presetOf = (a) => PRESET[normCat(a.category)] || DEFAULT;
const presetDays = (p) => Array(7).fill(p.allDay ? { open: 0, close: 24 } : { open: p.o, close: p.c });
// The snapshot's program uses {0,0} for a closed day; the JSON contract uses null.
const toJsonDays = (program) => program.map((w) => (w.open === 0 && w.close === 0 ? null : { open: w.open, close: w.close }));
const sameDays = (x, y) =>
  x.every((w, i) => (w === null ? y[i] === null : y[i] && w.open === y[i].open && w.close === y[i].close));

// What to write into one JSON activity so the generator reproduces `row`.
function patchFor(a, row, { hours: carryHours = true, duration = false } = {}) {
  const p = presetOf(a);
  const patch = {};
  const report = [];

  if (carryHours) {
    const days = toJsonDays(row.program);
    if (!sameDays(days, presetDays(p))) patch.opening_hours = days;
  }
  const vibes = [row.cultural, row.foodie, row.adventurous, row.relaxing];
  if (vibes.some((v, i) => v !== p.v[i])) {
    patch.vibes = { cultural: row.cultural, foodie: row.foodie, adventurous: row.adventurous, relaxing: row.relaxing };
  }
  if (row.priority !== resolvePriority({ top: a.top }, p, [], "")) patch.priority = row.priority;

  if (duration) {
    const dur = Number(a.duration_hours);
    const genHours = Math.max(1, Number.isFinite(dur) && dur > 0 ? dur : p.h);
    if (row.hours !== genHours) patch.duration_hours = row.hours;
  }
  const adult = a.prices ? Number(a.prices.adult) : NaN;
  const genCost = Number.isFinite(adult) ? adult : 0;
  if (duration && row.cost !== genCost) report.push(`cost: curated ${row.cost} vs JSON prices.adult ${genCost} (not changed)`);
  if (row.is_lunch !== Boolean(p.lunch)) report.push(`is_lunch: curated ${row.is_lunch} vs category "${a.category}" ${Boolean(p.lunch)} (not changed)`);
  return { patch, report };
}

function migrate(cityId, pairs) {
  const file = join(JSON_DIR, `${cityId}.json`);
  const data = JSON.parse(readFileSync(file, "utf8"));
  let changed = 0;
  console.log(`\n== ${cityId} ==`);
  for (const { row, match, opts } of pairs) {
    const a = data.activities.find(match);
    if (!a) throw new Error(`${cityId}: no JSON activity for "${row.name}"`);
    const { patch, report } = patchFor(a, row, opts);
    const keys = Object.keys(patch);
    if (keys.length) {
      Object.assign(a, patch);
      changed++;
    }
    const label = `#${a.id} ${a.name}`;
    console.log(`${keys.length ? "write " : "same  "} ${label}${keys.length ? `  [${keys.join(", ")}]` : ""}`);
    for (const r of report) console.log(`       ! ${r}`);
  }
  if (!DRY) writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`${changed} activit${changed === 1 ? "y" : "ies"} updated${DRY ? " (dry run, not written)" : ""}`);
}

// Rome: all 26, by id; duration + cost checks on (Rome's JSON is its own source).
migrate(
  "rome",
  snapshot.rome.map((row) => ({ row, match: (a) => a.id === row.id, opts: { duration: true } }))
);

// Paris: only the overlaps.
migrate(
  "paris",
  snapshot.paris
    .filter((row) => PARIS_MAP[row.name])
    .map((row) => ({
      row,
      match: (a) => a.name === PARIS_MAP[row.name].to,
      opts: { hours: PARIS_MAP[row.name].hours },
    }))
);
