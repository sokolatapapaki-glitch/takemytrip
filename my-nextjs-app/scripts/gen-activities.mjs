// -----------------------------------------------------------------------------
// Activity catalogue generator (takemytrip JSON  ->  per-city TS data leaves)
// -----------------------------------------------------------------------------
// Reads every takemytrip/data/<city>.json and writes one self-contained data file
// per city to data/activities/<city>.data.ts, plus a shared _helpers.ts and an
// index.ts. Each activity copies the JSON metadata VERBATIM (prices, family
// prices, restaurant/cafe, website, notes, tags, id, description, best_time,
// emoji) — so it matches the JSON exactly, the way the curated Rome catalogue
// does. The engine fields the JSON has no data for (program/opening hours, hours,
// the four vibe scores, priority) are SYNTHESIZED from each activity's `category`
// via the CATEGORY presets below (top:true bumps priority). Tune the presets here
// and re-run; nothing else is needed.
//
// NON-DESTRUCTIVE: this script only WRITES the three kinds of file above. It never
// deletes anything and never touches the hand-curated data/activities.data.ts
// (Rome + Paris), which stay the source of truth for those two cities (see CURATED).
//
// Run from my-nextjs-app:   node scripts/gen-activities.mjs

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_DIR = resolve(__dirname, "../../takemytrip/data");
const OUT_DIR = resolve(__dirname, "../data/activities");

// Cities with a hand-curated catalogue in data/activities.data.ts — left alone so
// their tuned engine fields aren't replaced by synthesized ones. Remove an id here
// to (re)generate it from JSON instead.
const CURATED = new Set(["rome", "paris"]);

// --- category -> synthesized engine fields -----------------------------------
// h: duration hours (used when the JSON's duration_hours is 0/absent). Either
// `allDay:true` (open 24h every day) or an o/c window applied every day. v: the
// four vibe scores [cultural, foodie, adventurous, relaxing] (0-10). p: base
// priority (0-10); top:true raises it to >=9. lunch: flags is_lunch.
const DEFAULT = { h: 2, o: 9, c: 19, v: [5, 3, 3, 5], p: 5 };
const PRESET = {
  museum: { h: 2, o: 9, c: 18, v: [8, 0, 2, 3], p: 6 },
  gallery: { h: 2, o: 10, c: 18, v: [9, 0, 1, 3], p: 6 },
  castle: { h: 2, o: 9, c: 18, v: [8, 0, 4, 3], p: 6 },
  palace: { h: 2, o: 9, c: 18, v: [9, 0, 2, 3], p: 7 },
  church: { h: 1, o: 9, c: 18, v: [8, 0, 1, 4], p: 6 },
  cathedral: { h: 1, o: 9, c: 18, v: [8, 0, 1, 4], p: 7 },
  monument: { h: 1, allDay: true, v: [8, 0, 2, 4], p: 7 },
  landmark: { h: 1, allDay: true, v: [7, 0, 3, 4], p: 7 },
  ruins: { h: 1.5, o: 9, c: 18, v: [8, 0, 3, 3], p: 6 },
  tower: { h: 1.5, o: 9, c: 19, v: [6, 0, 5, 3], p: 7 },
  fountain: { h: 1, allDay: true, v: [5, 0, 1, 5], p: 6 },
  bridge: { h: 1, allDay: true, v: [5, 0, 2, 5], p: 5 },
  square: { h: 1, allDay: true, v: [6, 1, 1, 6], p: 6 },
  piazza: { h: 1, allDay: true, v: [6, 1, 1, 6], p: 6 },
  park: { h: 2, allDay: true, v: [3, 0, 4, 8], p: 4 },
  garden: { h: 2, allDay: true, v: [3, 0, 3, 8], p: 4 },
  viewpoint: { h: 1, allDay: true, v: [4, 0, 3, 7], p: 5 },
  views: { h: 1, allDay: true, v: [4, 0, 3, 7], p: 5 },
  neighborhood: { h: 1, allDay: true, v: [6, 1, 3, 6], p: 4 },
  neighbourhood: { h: 1, allDay: true, v: [6, 1, 3, 6], p: 4 },
  beach: { h: 2, allDay: true, v: [1, 0, 5, 9], p: 4 },
  zoo: { h: 3, o: 9, c: 18, v: [3, 1, 6, 5], p: 5 },
  aquarium: { h: 2, o: 10, c: 18, v: [3, 1, 6, 5], p: 5 },
  themepark: { h: 5, o: 10, c: 19, v: [1, 1, 9, 4], p: 5 },
  amusementpark: { h: 4, o: 10, c: 19, v: [1, 1, 8, 5], p: 5 },
  attraction: { h: 1.5, o: 9, c: 18, v: [5, 0, 4, 4], p: 5 },
  market: { h: 1, o: 8, c: 15, v: [3, 8, 2, 5], p: 5, lunch: true },
  restaurant: { h: 1.5, o: 12, c: 15, v: [2, 9, 1, 6], p: 4, lunch: true },
  food: { h: 1.5, o: 12, c: 15, v: [2, 9, 1, 6], p: 4, lunch: true },
  cafe: { h: 1, o: 9, c: 19, v: [2, 8, 1, 6], p: 3, lunch: true },
  nightlife: { h: 2, o: 19, c: 24, v: [1, 6, 3, 7], p: 3 },
  bar: { h: 2, o: 18, c: 24, v: [1, 6, 3, 7], p: 3 },
  theater: { h: 2.5, o: 19, c: 22, v: [7, 1, 2, 5], p: 5 },
  theatre: { h: 2.5, o: 19, c: 22, v: [7, 1, 2, 5], p: 5 },
  show: { h: 2, o: 19, c: 22, v: [6, 1, 3, 5], p: 5 },
  tour: { h: 2, o: 9, c: 18, v: [5, 3, 4, 5], p: 5 },
  walk: { h: 2, o: 9, c: 18, v: [5, 2, 4, 6], p: 5 },
  cruise: { h: 1.5, o: 10, c: 18, v: [3, 1, 5, 7], p: 5 },
  boat: { h: 1.5, o: 10, c: 18, v: [2, 0, 5, 8], p: 4 },
  shopping: { h: 2, o: 10, c: 20, v: [2, 3, 2, 5], p: 3 },
};

const normCat = (c) => String(c || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const q = (s) => JSON.stringify(String(s ?? ""));
const numMap = (o) => {
  const r = {};
  if (o && typeof o === "object") {
    for (const [k, v] of Object.entries(o)) {
      const n = Number(v);
      if (Number.isFinite(n)) r[k] = n;
    }
  }
  return r;
};

// Build one activity object literal + record which helpers it uses.
function emitActivity(a, cityLoc, use) {
  const preset = PRESET[normCat(a.category)] || DEFAULT;
  const durRaw = Number(a.duration_hours);
  const hours = Number.isFinite(durRaw) && durRaw > 0 ? durRaw : preset.h;
  const priority = a.top ? Math.max(preset.p, 9) : preset.p;
  const loc = a.location && Number.isFinite(Number(a.location.lat)) ? a.location : cityLoc;
  const ages = numMap(a.prices);
  const family = numMap(a.family_prices);
  const adult = a.prices ? Number(a.prices.adult) : NaN;
  const cost = Number.isFinite(adult) ? adult : 0;

  let program;
  if (preset.allDay) {
    program = "everyDay(ALL_DAY)";
    use.allDay = true;
  } else {
    program = `everyDay(at(${preset.o}, ${preset.c}))`;
    use.at = true;
  }
  use.everyDay = true;

  const rests = [];
  if (a.restaurant && a.restaurant.name) {
    use.food = true;
    const link = a.restaurant.map_url ? q(a.restaurant.map_url) : "null";
    rests.push(`food(${q(a.restaurant.name)}, ${q(a.restaurant.description)}, ${link})`);
  }
  if (a.cafe && a.cafe.name) {
    use.cafe = true;
    const link = a.cafe.map_url ? q(a.cafe.map_url) : "null";
    rests.push(`cafe(${q(a.cafe.name)}, ${q(a.cafe.description)}, ${link})`);
  }
  let websites = "[]";
  if (a.website) {
    use.site = true;
    websites = `[site(${q(a.website)})]`;
  }

  const v = preset.v;
  const lunch = preset.lunch ? " is_lunch: true," : "";
  const best = a.best_time ? q(a.best_time) : "null";
  const emoji = a.emoji ? q(a.emoji) : "null";

  return [
    `  {`,
    `    id: ${a.id ?? "null"},`,
    `    name: ${q(a.name)},`,
    `    description: ${q(a.description)},`,
    `    hours: ${hours}, cost: ${cost}, coords: { lat: ${loc.lat}, lng: ${loc.lng} },`,
    `    program: ${program},`,
    `    cultural: ${v[0]}, foodie: ${v[1]}, adventurous: ${v[2]}, relaxing: ${v[3]}, priority: ${priority},${lunch}`,
    `    prices: { ages: ${JSON.stringify(ages)}, family: ${JSON.stringify(family)} },`,
    `    websites: ${websites},`,
    `    googleMapUrl: null,`,
    `    notes: ${JSON.stringify(a.notes ?? [])},`,
    `    tags: ${JSON.stringify(a.tags ?? [])},`,
    `    best_time: ${best},`,
    `    restaurants: [${rests.join(", ")}],`,
    `    emoji: ${emoji},`,
    `  },`,
  ].join("\n");
}

const HELPERS = `/* eslint-disable */
// -----------------------------------------------------------------------------
// AUTO-GENERATED by scripts/gen-activities.mjs — shared builders + element type
// for the per-city activity catalogues in this folder. Do not edit by hand.
// -----------------------------------------------------------------------------
// Self-contained: imports nothing, mirrors the shape the hand-authored
// data/activities.data.ts uses, so core re-applies the Activity type on import.
export type Window = { open: number; close: number };
export const ALL_DAY: Window = { open: 0, close: 24 };
export const at = (open: number, close: number): Window => ({ open, close });
export const everyDay = (h: Window): Window[] => Array<Window>(7).fill(h);

export type CatalogueRestaurant = {
  type: "food" | "cafe";
  price: number | null;
  name: string;
  description: string;
  link: string | null;
  emoji: string | null;
};
export type CatalogueActivity = {
  id: number | null;
  name: string;
  description: string;
  hours: number;
  cost: number;
  coords: { lat: number; lng: number };
  program: Window[];
  cultural: number;
  foodie: number;
  adventurous: number;
  relaxing: number;
  priority: number;
  is_lunch?: boolean;
  prices: { ages: Record<string, number>; family: Record<string, number> } | null;
  websites: { url: string; name: string }[];
  googleMapUrl: string | null;
  notes: string[];
  tags: string[];
  best_time: string | null;
  restaurants: CatalogueRestaurant[];
  emoji: string | null;
};

export const food = (name: string, description: string, link: string | null): CatalogueRestaurant =>
  ({ type: "food", price: null, name, description, link, emoji: null });
export const cafe = (name: string, description: string, link: string | null): CatalogueRestaurant =>
  ({ type: "cafe", price: null, name, description, link, emoji: null });
export const site = (url: string, name = "Official site") => ({ url, name });
`;

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "_helpers.ts"), HELPERS);

  const files = readdirSync(JSON_DIR).filter((f) => f.endsWith(".json"));
  const generated = [];

  for (const file of files) {
    const cityId = file.replace(/\.json$/, "");
    if (CURATED.has(cityId)) {
      console.log(`skip   ${cityId} (curated)`);
      continue;
    }
    let city;
    try {
      city = JSON.parse(readFileSync(join(JSON_DIR, file), "utf8"));
    } catch (e) {
      console.warn(`ERROR  ${cityId}: bad JSON — ${e.message}`);
      continue;
    }
    const acts = Array.isArray(city.activities) ? city.activities : [];
    const cityLoc =
      city.location && Number.isFinite(Number(city.location.lat))
        ? city.location
        : { lat: 0, lng: 0 };

    const use = {};
    const body = acts.map((a) => emitActivity(a, cityLoc, use)).join("\n");

    const named = [];
    if (use.everyDay) named.push("everyDay");
    if (use.at) named.push("at");
    if (use.allDay) named.push("ALL_DAY");
    if (use.food) named.push("food");
    if (use.cafe) named.push("cafe");
    if (use.site) named.push("site");
    const importLine = named.length
      ? `import { ${named.join(", ")}, type CatalogueActivity } from "./_helpers";`
      : `import type { CatalogueActivity } from "./_helpers";`;

    const constName = `${cityId.toUpperCase()}_ACTIVITIES`;
    const out = `/* eslint-disable */
// -----------------------------------------------------------------------------
// AUTO-GENERATED from takemytrip/data/${file} by scripts/gen-activities.mjs.
// Do not edit by hand — re-run the generator. Metadata (prices, family prices,
// restaurant/cafe, website, notes, tags, id, description, best_time, emoji) is
// copied verbatim from the JSON; the engine fields (program/hours/vibes/priority)
// are synthesized from each activity's \`category\`.
// -----------------------------------------------------------------------------
${importLine}

export const ${constName}: CatalogueActivity[] = [
${body}
];
`;
    writeFileSync(join(OUT_DIR, `${cityId}.data.ts`), out);
    generated.push({ cityId, constName, count: acts.length });
    console.log(`write  ${cityId}.data.ts (${acts.length} activities)`);
  }

  // Aggregator: destination id -> generated catalogue (for one-line wiring).
  const imports = generated
    .map((g) => `import { ${g.constName} } from "./${g.cityId}.data";`)
    .join("\n");
  const entries = generated.map((g) => `  ${g.cityId}: ${g.constName},`).join("\n");
  const index = `/* eslint-disable */
// -----------------------------------------------------------------------------
// AUTO-GENERATED by scripts/gen-activities.mjs — destination id -> its generated
// activity catalogue. Spread this into ACTIVITIES_BY_DESTINATION in cities.data.ts
// (curated Rome/Paris stay listed explicitly and win over any entry here).
// -----------------------------------------------------------------------------
import type { CatalogueActivity } from "./_helpers";
${imports}

export const GENERATED_ACTIVITIES_BY_DESTINATION: Record<string, CatalogueActivity[]> = {
${entries}
};
`;
  writeFileSync(join(OUT_DIR, "index.ts"), index);

  const total = generated.reduce((s, g) => s + g.count, 0);
  console.log(`\nDone: ${generated.length} cities, ${total} activities -> ${OUT_DIR}`);
}

main();
