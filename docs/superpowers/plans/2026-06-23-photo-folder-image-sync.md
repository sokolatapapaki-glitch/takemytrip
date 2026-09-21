# Photo-Folder Image Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a config + script that copies the hand-picked photo for each activity in the external `Photos/<City>/` repo into the matching `public/destinations/<id>/<folder>/1.jpg`, converting `.avif`→`.jpg` so the Next.js app keeps working with no code change.

**Architecture:** A static config (`photo-sync.config.mjs`) ties each Photos sub-folder to its exact project activity name. Pure, unit-tested helpers (`photo-sync.lib.mjs`) parse the runtime image map and resolve each tie to its real on-disk destination folder. A thin CLI (`sync-photo-images.mjs`) converts each source image with `sharp` and writes `1.jpg` into the resolved folder; it only edits `activityImages.generated.ts` / `_manifest.json` when an activity had no prior entry (or a non-`1.jpg` first path), so the common case is image-bytes-only.

**Tech Stack:** Node 20 ESM (`.mjs`), `sharp` (already installed), Node built-in `node:test` runner (no new dependency), the existing `scripts/list-activities.mjs` as the catalogue source of truth.

## Global Constraints

- **Runtime source of truth:** `app/activities/components/activityImages.generated.ts` exports `GENERATED_ACTIVITY_IMAGES: Record<string, string[]>`, keyed by the activity's exact `name`, values like `["/destinations/<id>/<folder>/1.jpg", …]`. `ActivityCard` renders index `[0]`. The app must keep working **without any source change** — so the default outcome is: overwrite the image file only.
- **Generated-file format is byte-significant:** if the generated TS is rewritten it MUST use the exact header + `  ${JSON.stringify(key)}: ${JSON.stringify(arr)},` line format, keys sorted ascending — identical to `scripts/gen-city-images.mjs` `writeGenerated()`.
- **Resolve folders from the map, never recompute:** on-disk slugs differ from `list-activities` slugs in places (disk `10-laquarium-de-barcelona` vs slug `10-l-aquarium-de-barcelona`). Always take the folder from the existing generated-map path when the activity is present; only fall back to the catalogue slug for activities with no image yet.
- **Credits are left untouched.** `_credits.json` and `doc/*-activity-image-sources.md` are NOT modified by this tool (user decision). No attribution is added, changed, or removed.
- **Only `.avif`→`.jpg` conversion via `sharp`.** Output is always `1.jpg`, quality 82. Never add `.avif` paths to the map.
- **All commands run from `my-nextjs-app/`.** Paths in this plan are relative to that directory.
- **Photos repo location:** `../../Photos` relative to `my-nextjs-app/` (i.e. `WORKING-ON/Photos`). One image file per activity sub-folder.

---

## File Structure

- `scripts/photo-sync.config.mjs` — **data only.** Exports `PHOTO_ROOT` (abs path to the Photos repo) and `TIES` (per-city `{ dir, map }`, where `map` is `photoSubFolderName → exact project activity name`). The single place a human edits to add/fix a tie.
- `scripts/photo-sync.lib.mjs` — **pure helpers, no I/O, no sharp.** `normalizeName`, `parseGeneratedMap`, `folderFromPath`, `pickSourceImage`, `resolveTie`, `emitGeneratedText`. Imported by both the CLI and the tests.
- `scripts/photo-sync.lib.test.mjs` — `node:test` unit tests for every helper.
- `scripts/sync-photo-images.mjs` — **CLI.** Reads config + lib, loads the catalogue via `list-activities --json`, converts + writes images, conditionally re-emits the generated TS / manifest, prints a summary. Flags: `--city=<id>`, `--only=<photoFolder,…>`, `--dry-run`.

---

## Task 1: Tie config (`photo-sync.config.mjs`)

**Files:**
- Create: `scripts/photo-sync.config.mjs`

**Interfaces:**
- Produces: `export const PHOTO_ROOT: string` (absolute path) and
  `export const TIES: Record<cityId, { dir: string, map: Record<photoFolder, projectActivityName> }>`.
  `dir` is the Photos sub-folder for that city; `map` keys are exact directory names under `Photos/<dir>/`; values are the project activity `name` as it appears in the catalogue (a later helper normalizes minor drift such as trailing `.`/spaces).

- [ ] **Step 1: Write the config file**

```js
// scripts/photo-sync.config.mjs
// -----------------------------------------------------------------------------
// Ties each Photos-repo activity folder to its project activity (by name).
// Edit this file to add/fix a tie. Keys = folder names under Photos/<dir>/,
// values = the catalogue activity name (sync-photo-images.mjs normalizes minor
// trailing-punctuation/whitespace drift, so a trimmed name is fine here).
// -----------------------------------------------------------------------------
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// my-nextjs-app/scripts -> WORKING-ON/Photos
export const PHOTO_ROOT =
  process.env.PHOTO_ROOT || path.resolve(HERE, "..", "..", "..", "Photos");

export const TIES = {
  amsterdam: { dir: "amsterdam", map: {
    "Amstelpark": "Amstelpark",
    "Amsterdamse Bos": "Amsterdamse Bos",
    "Pancake Boat": "Pancake Boat (Pannenkoekenboot)",
    "Rijksmuseum": "Rijksmuseum",
    "Van Gogh Museum": "Van Gogh Museum",
  } },
  barcelona: { dir: "Barcelona", map: {
    "Casa Milà": "Casa Milà (La Pedrera)",
    "Park Güell": "Park Güell",
    "Picasso Museum": "Picasso Museum",
  } },
  berlin: { dir: "Berlin", map: {
    "Extavium Potsdam": "Extavium Potsdam (nano)",
    "FEZ Berlin": "FEZ Berlin",
    "Garten der Welt": "Garten der Welt",
    "Labyrinth Kindermuseum": "Labyrinth Kindermuseum",
    "MACHmit! Museum for Children": "MACHmit! Museum for Children",
    "Tiergarten": "Tiergarten",
    "Zoologischer Garten + Aquarium Berlin": "Zoologischer Garten + Aquarium Berlin",
    "Zoologischer Garten Berlin": "Zoologischer Garten Berlin",
  } },
  budapest: { dir: "Boudapest", map: {
    "Daytime Sightseeing Cruise": "Daytime Sightseeing Cruise",
    "Gellért Hill": "Παιδική Χαρά με τις Τσουλήθρες (Gellért Hill)",
    "Gyermekvasút": "Το Τρένο των Παιδιών (Gyermekvasút)",
    "Margitsziget": "Margaret Island (Margitsziget) - Playgrounds",
    "Nagyjátszótér": "Η Μεγάλη Παιδική Χαρά στο Városliget (Nagyjátszótér)",
    "Sir Lancelot Knights' Restaurant": "Sir Lancelot Knights' Restaurant",
  } },
  bucharest: { dir: "Boukourest", map: {
    "Admiral Vasile Urseanu": "Αστεροσκοπείο Admiral Vasile Urseanu",
    "Carturesti Carusel": "Carturesti Carusel",
    "Children's Town Bucharest – Orășelul Copiilor": "Children's Town Bucharest – Orășelul Copiilor (Parcul Tineretului)",
    "Cișmigiu": "Κήπος Cișmigiu",
    "Destiny Park boukourest": "Destiny Park",
    "Edenland Park": "Edenland Park",
    "Izvor Park": "Izvor Park (παιδική χαρά)",
    "Muzeul Micul Paris": "Muzeul Micul Paris",
    "Pasajul Macca-Vilacrosse": "Pasajul Macca-Vilacrosse",
    "Pasajul Victoriei": "Pasajul Victoriei",
    "Romanian Athenaeum (Ateneul Român)": "Romanian Athenaeum (Ateneul Român)",
    "Therme Bucharest": "Therme Bucharest (4.5 ώρες)",
    "boukourest Lipscani": "Παλιά Πόλη Lipscani",
    "boukourest Piata Unirii": "Σιντριβάνια της Piata Unirii (Symphony of Water)",
    "Παλάτι του Κοινοβουλίου": "Παλάτι του Κοινοβουλίου (Σπίτι του Λαού)",
  } },
  istanbul: { dir: "Constantinople", map: {
    "KidZania Istanbul": "KidZania Istanbul",
    "Αγία Σοφία": "Αγία Σοφία",
    "Αρχαιολογικό Μουσείο Κωνσταντινούπολης": "Αρχαιολογικό Μουσείο Κωνσταντινούπολης",
    "Βασιλική Κινστέρνα": "Βασιλική Κινστέρνα",
    "Κρουαζιέρα στα Πριγκηπονήσια": "Κρουαζιέρα στα Πριγκηπονήσια",
    "Κρουαζιέρα στον Βόσπορο": "Κρουαζιέρα στον Βόσπορο",
    "Μπλε Τζαμί (Σουλταν Αχμέτ)": "Μπλε Τζαμί (Σουλταν Αχμέτ)",
    "Πάρκο Γκιουλχανέ": "Πάρκο Γκιουλχανέ",
    "Πάρκο Μινιατούρων (Miniatürk)": "Πάρκο Μινιατούρων (Miniatürk)",
    "Πατριαρχείο": "Πατριαρχείο",
    "Πύργος του Γαλατά": "Πύργος του Γαλατά",
    "Τοπ Καπί (Αυτοκρατορικό Παλάτι)": "Τοπ Καπί (Αυτοκρατορικό Παλάτι)",
  } },
  krakow: { dir: "Krakow", map: {
    "Aquapark": "Aquapark",
    "Krakow Pinball Museum": "Krakow Pinball Museum",
    "Museum of Illusions": "Museum of Illusions",
    "Underground Rynek Museum": "Underground Rynek Museum",
    "Zakopane": "Zakopane",
  } },
  lisbon: { dir: "Lisbon", map: {
    "Museu da Marioneta": "Museu da Marioneta",
    "Palácio da Pena": "Palácio da Pena",
    "Pavilhão do Conhecimento": "Pavilhão do Conhecimento",
    "Μνημείο των Ανακαλύψεων": "Μνημείο των Ανακαλύψεων",
    "Μοναστήρι των Ιερονομιτών": "Μοναστήρι των Ιερονομιτών",
    "Πύργος του Μπελέμ": "Πύργος του Μπελέμ",
  } },
  madrid: { dir: "Madrid", map: {
    "IKONO (Διαδραστική & Φωτογραφική Εμπειρία)": "IKONO (Διαδραστική & Φωτογραφική Εμπειρία)",
    "MUNCYT Alcobendas (Μουσείο Επιστήμης & Τεχνολογίας)": "MUNCYT Alcobendas (Μουσείο Επιστήμης & Τεχνολογίας)",
    "Micropolix (Παιδική Πόλη Επαγγελμάτων)": "Micropolix (Παιδική Πόλη Επαγγελμάτων)",
    "Museo Naval (Ναυτικό Μουσείο)": "Museo Naval (Ναυτικό Μουσείο)",
    "Planetario de Madrid (Πλανητάριο)": "Planetario de Madrid (Πλανητάριο)",
    "Santiago Bernabéu Tour (Tour Γηπέδου Ρεάλ Μαδρίτης)": "Santiago Bernabéu Tour (Tour Γηπέδου Ρεάλ Μαδρίτης)",
    "Teleférico de Madrid": "Teleférico de Madrid",
    "Urban Planet Las Rejas": "Urban Planet Las Rejas",
  } },
  paris: { dir: "Paris", map: {
    "Latin Quarter food walk": "Latin Quarter food walk",
    "Le Marais café & falafel": "Le Marais café & falafel",
    "Luxembourg Gardens": "Luxembourg Gardens",
    "Macaron & pâtisserie tasting": "Macaron & pâtisserie tasting",
  } },
  prague: { dir: "Prague", map: {
    "Illusion Art Museum Prague": "Illusion Art Museum Prague",
    "Sea World (Mořský svět)": "Sea World (Mořský svět)",
    "Γέφυρα του Καρόλου": "Γέφυρα του Καρόλου",
    "Ζωολογικός Κήπος (Zoo Praha)": "Ζωολογικός Κήπος (Zoo Praha)",
    "Κάστρο της Πράγας": "Κάστρο της Πράγας",
    "Κρουαζιέρα στον Μολδάβα": "Κρουαζιέρα στον Μολδάβα",
    "Μουσείο LEGO": "Μουσείο LEGO",
    "Μουσείο Αισθήσεων (Sense Museum)": "Μουσείο Αισθήσεων (Sense Museum)",
  } },
  rome: { dir: "Rome", map: {
    "Explora": "Explora",
  } },
  vienna: { dir: "Vienna", map: {
    "Classic Pass": "Classic Pass (καλοκαιρινή περίοδος)",
    "Classic Pass Plus (πλήρες πακέτο)": "Classic Pass Plus (πλήρες πακέτο)",
    "Sisi Pass": "Sisi Pass (3 αυτοκρατορικά αξιοθέατα)",
    "Sisi's Amazing Journey (VR Experience)": "Sisi's Amazing Journey (VR Experience)",
    "Winter Pass (χειμερινή περίοδος)": "Winter Pass (χειμερινή περίοδος)",
    "Zoo + Palm House + Desert House Combo Schönbrunn": "Zoo + Palm House + Desert House Combo Schönbrunn",
  } },
  warsaw: { dir: "Warsow", map: {
    "Hangar 646 Goclaw": "Hangar 646 στο Gocław",
    "Majaland Warsaw": "Majaland Warsaw",
    "Museum of Illusions": "Museum of Illusions",
    "Smart Kids Planet": "Smart Kids Planet",
    "Łazienki Park": "Łazienki Park",
  } },
};
```

- [ ] **Step 2: Sanity-check the config loads and PHOTO_ROOT resolves to the Photos repo**

Run: `node -e "import('./scripts/photo-sync.config.mjs').then(m=>{console.log(m.PHOTO_ROOT);console.log('cities',Object.keys(m.TIES).length);})"`
Expected: prints an absolute path ending in `Photos`, then `cities 14`.

- [ ] **Step 3: Verify every configured Photos source folder actually exists on disk**

Run:
```bash
node -e "import('./scripts/photo-sync.config.mjs').then(async m=>{const fs=await import('node:fs');const path=await import('node:path');let miss=0;for(const[city,cfg]of Object.entries(m.TIES)){for(const pf of Object.keys(cfg.map)){const p=path.join(m.PHOTO_ROOT,cfg.dir,pf);if(!fs.existsSync(p)){console.log('MISSING',city,JSON.stringify(pf));miss++;}}}console.log(miss?('missing '+miss):'all source folders exist');})"
```
Expected: `all source folders exist` (and no `MISSING` lines). If any line prints, fix that key in `TIES` to match the real folder name before continuing.

- [ ] **Step 4: Commit**

```bash
git add scripts/photo-sync.config.mjs
git commit -m "feat(scripts): add photo-folder → activity tie config"
```

---

## Task 2: Pure helpers + unit tests (`photo-sync.lib.mjs`)

**Files:**
- Create: `scripts/photo-sync.lib.mjs`
- Test: `scripts/photo-sync.lib.test.mjs`

**Interfaces:**
- Consumes: nothing (no I/O, no sharp).
- Produces:
  - `normalizeName(s: string): string` — NFC, collapse whitespace, trim, strip trailing `.`/spaces.
  - `parseGeneratedMap(tsText: string): Map<string, string[]>` — parses `GENERATED_ACTIVITY_IMAGES` lines.
  - `folderFromPath(p: string): { id: string, folder: string } | null` — from `/destinations/<id>/<folder>/<file>`.
  - `pickSourceImage(entries: string[]): string | null` — first `.avif/.jpg/.jpeg/.png/.webp`, sorted.
  - `resolveTie(projName: string, generatedMap: Map<string,string[]>, catalogue: {name:string,cityId:string,folder:string}[]): { name: string, id: string, folder: string, inMap: boolean } | null`.
  - `emitGeneratedText(map: Map<string,string[]>): string` — byte-identical generated-TS content, keys sorted.

- [ ] **Step 1: Write the failing tests**

```js
// scripts/photo-sync.lib.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeName, parseGeneratedMap, folderFromPath,
  pickSourceImage, resolveTie, emitGeneratedText,
} from "./photo-sync.lib.mjs";

test("normalizeName trims, collapses whitespace, strips trailing dot", () => {
  assert.equal(normalizeName("Zoologischer Garten + Aquarium Berlin. "),
    "Zoologischer Garten + Aquarium Berlin");
  assert.equal(normalizeName("Daytime Sightseeing Cruise "), "Daytime Sightseeing Cruise");
  assert.equal(normalizeName("Urban Planet Las Rejas"), "Urban Planet Las Rejas");
});

test("parseGeneratedMap reads name -> string[] entries", () => {
  const ts = `export const GENERATED_ACTIVITY_IMAGES: Record<string, string[]> = {\n` +
    `  "Park Güell": ["/destinations/barcelona/2-park-guell/1.jpg"],\n` +
    `  "British Museum": ["/destinations/london/10-british-museum/1.jpg","/destinations/london/10-british-museum/2.jpg"],\n` +
    `};\n`;
  const m = parseGeneratedMap(ts);
  assert.deepEqual(m.get("Park Güell"), ["/destinations/barcelona/2-park-guell/1.jpg"]);
  assert.equal(m.get("British Museum").length, 2);
});

test("folderFromPath extracts id + folder", () => {
  assert.deepEqual(folderFromPath("/destinations/barcelona/4-casa-mila-la-pedrera/1.jpg"),
    { id: "barcelona", folder: "4-casa-mila-la-pedrera" });
  assert.equal(folderFromPath("not-a-path"), null);
});

test("pickSourceImage returns the lone image regardless of extension", () => {
  assert.equal(pickSourceImage(["photo-123.avif"]), "photo-123.avif");
  assert.equal(pickSourceImage(["readme.txt"]), null);
});

test("resolveTie prefers the generated map and reads its real folder", () => {
  const gen = new Map([
    ["Casa Milà (La Pedrera)", ["/destinations/barcelona/4-casa-mila-la-pedrera/1.jpg"]],
  ]);
  const r = resolveTie("Casa Milà (La Pedrera)", gen, []);
  assert.deepEqual(r, { name: "Casa Milà (La Pedrera)", id: "barcelona", folder: "4-casa-mila-la-pedrera", inMap: true });
});

test("resolveTie matches across trailing-dot drift via normalization", () => {
  const gen = new Map([
    ["Zoologischer Garten + Aquarium Berlin. ", ["/destinations/berlin/11-zoologischer-garten-aquarium-berlin/1.jpg"]],
  ]);
  const r = resolveTie("Zoologischer Garten + Aquarium Berlin", gen, []);
  assert.equal(r.name, "Zoologischer Garten + Aquarium Berlin. ");
  assert.equal(r.folder, "11-zoologischer-garten-aquarium-berlin");
  assert.equal(r.inMap, true);
});

test("resolveTie falls back to the catalogue when not in the map", () => {
  const cat = [{ name: "Explora", cityId: "rome", folder: "9-explora" }];
  const r = resolveTie("Explora", new Map(), cat);
  assert.deepEqual(r, { name: "Explora", id: "rome", folder: "9-explora", inMap: false });
});

test("resolveTie returns null when nothing matches", () => {
  assert.equal(resolveTie("Nope", new Map(), []), null);
});

test("emitGeneratedText sorts keys and keeps the canonical header", () => {
  const m = new Map([
    ["Zebra", ["/destinations/x/1-z/1.jpg"]],
    ["Apple", ["/destinations/x/2-a/1.jpg"]],
  ]);
  const out = emitGeneratedText(m);
  assert.ok(out.startsWith("/* eslint-disable */\n"));
  assert.ok(out.includes("export const GENERATED_ACTIVITY_IMAGES: Record<string, string[]> = {"));
  assert.ok(out.indexOf('"Apple"') < out.indexOf('"Zebra"'));
  assert.ok(out.includes(`  "Apple": ["/destinations/x/2-a/1.jpg"],`));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/photo-sync.lib.test.mjs`
Expected: FAIL — `Cannot find module './photo-sync.lib.mjs'` (file not created yet).

- [ ] **Step 3: Write the helper implementations**

```js
// scripts/photo-sync.lib.mjs
// -----------------------------------------------------------------------------
// Pure helpers for sync-photo-images.mjs. No filesystem, no sharp — unit-tested.
// -----------------------------------------------------------------------------
export const IMAGE_RE = /\.(avif|jpe?g|png|webp)$/i;

export function normalizeName(s) {
  return String(s)
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.\s]+$/g, "");
}

export function parseGeneratedMap(tsText) {
  const map = new Map();
  const re = /^\s*("(?:[^"\\]|\\.)*")\s*:\s*(\[[^\]]*\])\s*,?\s*$/gm;
  let m;
  while ((m = re.exec(tsText))) {
    map.set(JSON.parse(m[1]), JSON.parse(m[2]));
  }
  return map;
}

export function folderFromPath(p) {
  const m = String(p).match(/\/destinations\/([^/]+)\/([^/]+)\//);
  return m ? { id: m[1], folder: m[2] } : null;
}

export function pickSourceImage(entries) {
  return entries.filter((e) => IMAGE_RE.test(e)).sort()[0] || null;
}

export function resolveTie(projName, generatedMap, catalogue) {
  const target = normalizeName(projName);
  for (const [name, paths] of generatedMap) {
    if (normalizeName(name) === target && paths[0]) {
      const fp = folderFromPath(paths[0]);
      if (fp) return { name, id: fp.id, folder: fp.folder, inMap: true };
    }
  }
  for (const a of catalogue) {
    if (normalizeName(a.name) === target) {
      return { name: a.name, id: a.cityId, folder: a.folder, inMap: false };
    }
  }
  return null;
}

export function emitGeneratedText(map) {
  const keys = [...map.keys()].sort();
  const body = keys
    .map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(map.get(k))},`)
    .join("\n");
  return (
    `/* eslint-disable */\n` +
    `// -----------------------------------------------------------------------------\n` +
    `// AUTO-GENERATED by scripts/gen-activity-images.mjs — do not edit by hand.\n` +
    `// Maps activity name -> public-folder image paths (priority-weighted count).\n` +
    `// Re-run: \`node scripts/gen-activity-images.mjs\` (optionally \`--city=<id>\`).\n` +
    `// -----------------------------------------------------------------------------\n` +
    `export const GENERATED_ACTIVITY_IMAGES: Record<string, string[]> = {\n${body}\n};\n`
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/photo-sync.lib.test.mjs`
Expected: PASS — `# pass 8`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add scripts/photo-sync.lib.mjs scripts/photo-sync.lib.test.mjs
git commit -m "feat(scripts): pure helpers for photo sync (tie resolution, map parse/emit)"
```

---

## Task 3: The sync CLI (`sync-photo-images.mjs`)

**Files:**
- Create: `scripts/sync-photo-images.mjs`
- Modify: `package.json` (add a `sync:photos` npm script)

**Interfaces:**
- Consumes: `PHOTO_ROOT`, `TIES` from `./photo-sync.config.mjs`; all helpers from `./photo-sync.lib.mjs`; `scripts/list-activities.mjs --json` for the catalogue; `sharp` for conversion.
- Produces: a CLI with flags `--city=<id>`, `--only=<photoFolder,…>`, `--dry-run`. Default outcome per tie: convert the Photos image → write `public/destinations/<id>/<folder>/1.jpg`. Only when the activity is missing from the generated map (or its first path is not that `1.jpg`) does it update `activityImages.generated.ts` + `public/destinations/_manifest.json`.

- [ ] **Step 1: Write the CLI**

```js
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
      const r = resolveTie(projName, genMap, cityCat);
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
```

- [ ] **Step 2: Add the npm convenience script**

In `package.json`, inside the `"scripts"` object, add this line (keep existing entries; mind the trailing comma on the line above it):

```json
    "sync:photos": "node scripts/sync-photo-images.mjs",
```

- [ ] **Step 3: Dry-run Barcelona and verify the 3 ties resolve to real folders (no writes)**

Run: `node scripts/sync-photo-images.mjs --city=barcelona --dry-run`
Expected: three `DRY` lines and a summary `3 would update`, e.g.:
```
DRY       barcelona  Casa Milà → Casa Milà (La Pedrera)  /destinations/barcelona/4-casa-mila-la-pedrera/1.jpg
DRY       barcelona  Park Güell → Park Güell  /destinations/barcelona/2-park-guell/1.jpg
DRY       barcelona  Picasso Museum → Picasso Museum  /destinations/barcelona/5-picasso-museum/1.jpg

3 would update.
```
Confirm no `UNMATCHED`/`MISS-SRC` lines and that no files changed: `git status --short` shows nothing.

- [ ] **Step 4: Full dry-run across every city to catch any unmatched tie**

Run: `node scripts/sync-photo-images.mjs --dry-run`
Expected: 92 `DRY` lines, summary `92 would update.`, exit code 0 (no `issue(s)`). If any `UNMATCHED`/`MISS-SRC` line appears, fix the offending key/value in `scripts/photo-sync.config.mjs` and re-run until clean.

- [ ] **Step 5: Commit**

```bash
git add scripts/sync-photo-images.mjs package.json
git commit -m "feat(scripts): sync-photo-images CLI (avif->jpg, map-safe writes)"
```

---

## Task 4: Run the Barcelona example for real and verify the app is unchanged

**Files:**
- Modify (data, not source): `public/destinations/barcelona/{2-park-guell,4-casa-mila-la-pedrera,5-picasso-museum}/1.jpg`

**Interfaces:**
- Consumes: the CLI from Task 3.
- Produces: three real `.jpg` files swapped in; `activityImages.generated.ts` and `_manifest.json` unchanged (these three activities already map to their `1.jpg`).

- [ ] **Step 1: Record the pre-state of the three target files**

Run: `git status --short public/destinations/barcelona; ls -la public/destinations/barcelona/4-casa-mila-la-pedrera/`
Expected: clean working tree for that path; one `1.jpg` present.

- [ ] **Step 2: Run the sync for Barcelona (the user's "update 3 images" example)**

Run: `node scripts/sync-photo-images.mjs --city=barcelona`
Expected:
```
WRITE     barcelona  Casa Milà → Casa Milà (La Pedrera)  /destinations/barcelona/4-casa-mila-la-pedrera/1.jpg
WRITE     barcelona  Park Güell → Park Güell  /destinations/barcelona/2-park-guell/1.jpg
WRITE     barcelona  Picasso Museum → Picasso Museum  /destinations/barcelona/5-picasso-museum/1.jpg

3 image(s) written.
```
(No "generated map updated" / "manifest updated" — those three already pointed at `1.jpg`.)

- [ ] **Step 3: Verify only the 3 image files changed — no source/map/manifest churn**

Run: `git status --short`
Expected: exactly three modified files, all `public/destinations/barcelona/*/1.jpg`. `activityImages.generated.ts`, `_manifest.json`, and any `_credits.json` must NOT appear.

- [ ] **Step 4: Verify the written files are valid JPEGs of real size**

Run:
```bash
for f in public/destinations/barcelona/4-casa-mila-la-pedrera/1.jpg public/destinations/barcelona/2-park-guell/1.jpg public/destinations/barcelona/5-picasso-museum/1.jpg; do node -e "const s=require('sharp');s('$f').metadata().then(m=>console.log('$f',m.format,m.width+'x'+m.height)).catch(e=>{console.error('BAD','$f',e.message);process.exit(1)})"; done
```
Expected: three lines each printing `jpeg` and sensible dimensions (e.g. `jpeg 1200x800`); no `BAD` line.

- [ ] **Step 5: Type-check the app to confirm nothing broke**

Run: `npx tsc --noEmit`
Expected: exits 0 with no errors (the generated map is unchanged, so this only confirms the repo still type-checks).

- [ ] **Step 6: Commit**

```bash
git add public/destinations/barcelona
git commit -m "chore(images): sync Barcelona activity photos from Photos repo"
```

---

## Self-Review

**1. Spec coverage**
- "automated way to match the activity of photo folder with the relative activity" → Task 1 config + Task 2 `resolveTie` (normalized name matching) + Task 3 catalogue load. ✓
- "make a config that ties the activities by name" → Task 1 `photo-sync.config.mjs` (all 92 ties). ✓
- "script that updates my public/destinations photos with the activities of the photo folder in the activities they are tied only" → Task 3 CLI iterates only `TIES`; `--city`/`--only` narrow further; "update 3 images for barcelona" demonstrated in Task 4. ✓
- "update the name of the files so the project keeps working without needing any change" → converts to `1.jpg` (the exact path the app already references); map/manifest only touched when an activity was previously imageless, so the wired example needs zero source change. ✓

**2. Placeholder scan** — every code step contains complete, runnable code; every run step has an exact command + expected output. No TBD/TODO/"handle errors". ✓

**3. Type/name consistency** — `resolveTie` returns `{ name, id, folder, inMap }`, used verbatim in the CLI; `emitGeneratedText`/`parseGeneratedMap` round-trip the same format; `pickSourceImage`/`normalizeName`/`folderFromPath` signatures match their call sites and tests. ✓

**Known follow-ups (out of scope, by user decision):** credits are intentionally not updated — after syncing real photos, `_credits.json` attribution may not match the displayed image. Backfill later if needed.
