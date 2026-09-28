// -----------------------------------------------------------------------------
// Activity catalogue generator (takemytrip JSON  ->  per-city TS data leaves)
// -----------------------------------------------------------------------------
// Reads every takemytrip/data/<city>.json and writes one self-contained data file
// per city to data/activities/<city>.data.ts, plus a shared _helpers.ts, an
// index.ts and _images.ts (editor images + their credits). Each activity copies
// the JSON metadata VERBATIM (prices, family prices, restaurant/cafe, website,
// notes, tags, id, description, best_time, emoji). The engine fields come from
// the JSON when it sets them (opening_hours, vibes, priority) and are otherwise
// SYNTHESIZED from the activity's `category` via the presets in
// gen-activities.lib.mjs (top:true bumps priority). Activities with
// `archived: true` are left out. The JSON contract is documented in
// editor/README.md ("Data contract").
//
// All-or-nothing: every city is built in memory first. If any activity is
// invalid (bad opening_hours, vibes or priority) the errors are printed, NOTHING
// is written and the exit code is 1 — the editor reports that as a failed
// regenerate. Warnings (skipped uncredited images, duplicate names) don't stop it.
//
// Run from my-nextjs-app:   node scripts/gen-activities.mjs

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { HELPERS, collectImages, emitActivity, imagesModule, refFor } from "./gen-activities.lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_DIR = resolve(__dirname, "../../takemytrip/data");
const OUT_DIR = resolve(__dirname, "../data/activities");

function main() {
  const files = readdirSync(JSON_DIR).filter((f) => f.endsWith(".json")).sort();
  const errors = [];
  const warnings = [];
  const outputs = []; // { path, text }
  const generated = [];
  const imagesByRef = {};
  const credits = [];
  const namesSeen = new Map(); // name -> "city #id", to warn on duplicates

  for (const file of files) {
    const cityId = file.replace(/\.json$/, "");
    let city;
    try {
      city = JSON.parse(readFileSync(join(JSON_DIR, file), "utf8"));
    } catch (e) {
      errors.push(`${cityId}: bad JSON — ${e.message}`);
      continue;
    }
    const all = Array.isArray(city.activities) ? city.activities : [];
    const acts = all.filter((a) => a.archived !== true);
    const archived = all.length - acts.length;
    const cityLoc =
      city.location && Number.isFinite(Number(city.location.lat))
        ? city.location
        : { lat: 0, lng: 0 };

    const use = {};
    const body = acts.map((a) => emitActivity(a, cityId, cityLoc, use, errors)).join("\n");

    for (const a of acts) {
      const here = `${cityId} #${a.id}`;
      const prev = namesSeen.get(a.name);
      if (prev) warnings.push(`duplicate name "${a.name}" (${prev} and ${here}) — magic combos and name-keyed images assume names are unique`);
      else namesSeen.set(a.name, here);

      const { urls, credits: cs } = collectImages(a, city.city || cityId, warnings, `${here} "${a.name}"`);
      if (urls.length) imagesByRef[refFor(cityId, a)] = urls;
      credits.push(...cs);
    }

    const named = [];
    if (use.everyDay) named.push("everyDay");
    if (use.at) named.push("at");
    if (use.allDay) named.push("ALL_DAY");
    if (use.closed) named.push("CLOSED");
    if (use.food) named.push("food");
    if (use.cafe) named.push("cafe");
    if (use.site) named.push("site");
    const importLine = named.length
      ? `import { ${named.join(", ")}, type CatalogueActivity } from "./_helpers";`
      : `import type { CatalogueActivity } from "./_helpers";`;

    const constName = `${cityId.toUpperCase()}_ACTIVITIES`;
    outputs.push({
      path: join(OUT_DIR, `${cityId}.data.ts`),
      text: `/* eslint-disable */
// -----------------------------------------------------------------------------
// AUTO-GENERATED from takemytrip/data/${file} by scripts/gen-activities.mjs.
// Do not edit by hand — edit the JSON (or use the editor) and re-run the
// generator. Metadata is copied verbatim from the JSON; the engine fields
// (program/vibes/priority) come from the JSON's opening_hours/vibes/priority when
// set, otherwise they are synthesized from each activity's \`category\`.
// -----------------------------------------------------------------------------
${importLine}

export const ${constName}: CatalogueActivity[] = [
${body}
];
`,
    });
    generated.push({ cityId, constName, count: acts.length, archived });
  }

  for (const w of warnings) console.warn(`warn   ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`ERROR  ${e}`);
    console.error(`\n${errors.length} error(s) — nothing was written.`);
    process.exitCode = 1;
    return;
  }

  // Aggregator: destination id -> generated catalogue (for one-line wiring).
  const imports = generated
    .map((g) => `import { ${g.constName} } from "./${g.cityId}.data";`)
    .join("\n");
  const entries = generated.map((g) => `  ${g.cityId}: ${g.constName},`).join("\n");
  const index = `/* eslint-disable */
// -----------------------------------------------------------------------------
// AUTO-GENERATED by scripts/gen-activities.mjs — destination id -> its generated
// activity catalogue. Spread into ACTIVITIES_BY_DESTINATION in cities.data.ts.
// -----------------------------------------------------------------------------
import type { CatalogueActivity } from "./_helpers";
${imports}

export const GENERATED_ACTIVITIES_BY_DESTINATION: Record<string, CatalogueActivity[]> = {
${entries}
};
`;

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "_helpers.ts"), HELPERS);
  for (const o of outputs) writeFileSync(o.path, o.text);
  writeFileSync(join(OUT_DIR, "index.ts"), index);
  writeFileSync(join(OUT_DIR, "_images.ts"), imagesModule(imagesByRef, credits));

  for (const g of generated) {
    const extra = g.archived ? `, ${g.archived} archived left out` : "";
    console.log(`write  ${g.cityId}.data.ts (${g.count} activities${extra})`);
  }
  const total = generated.reduce((s, g) => s + g.count, 0);
  console.log(
    `\nDone: ${generated.length} cities, ${total} activities, ` +
      `${Object.keys(imagesByRef).length} with editor images -> ${OUT_DIR}`
  );
}

main();
