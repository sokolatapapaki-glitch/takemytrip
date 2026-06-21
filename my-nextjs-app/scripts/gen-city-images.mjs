// -----------------------------------------------------------------------------
// Reusable curated activity-image installer — works for ANY city.
// -----------------------------------------------------------------------------
// Same "one hand-picked, accurate, fully-legal photo per activity" approach as
// the original gen-barcelona-images.mjs, but the per-city CURATED list is no
// longer baked into the script. Instead each city has its own tiny data file:
//
//     scripts/curated/<city>.mjs   (export `activities` + optional `cityName`)
//
// To do a new city: copy scripts/curated/_template.mjs to
// scripts/curated/<city>.mjs, fill in the activities, then run this once.
//
// What it does for the chosen city, in one run:
//   1. Deletes the city's current activity image folders (keeps cover.*).
//   2. Downloads one accurate image per activity → <city>/<folder>/1.jpg.
//   3. Rewrites that city's entries in activityImages.generated.ts + the manifest.
//   4. Writes credits:  public/destinations/<city>/_credits.json  and
//      doc/<city>-activity-image-sources.md  (with real Commons attribution).
//
// Run from my-nextjs-app/ in an environment WITH network access:
//   node scripts/gen-city-images.mjs --city=barcelona
//   node scripts/gen-city-images.mjs --city=rome
// -----------------------------------------------------------------------------
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public", "destinations");
const MANIFEST = path.join(PUBLIC_DIR, "_manifest.json");
const GEN_TS = path.join(ROOT, "app", "activities", "components", "activityImages.generated.ts");
const CURATED_DIR = path.join(ROOT, "scripts", "curated");
const UA = "ttk-app image fetcher (educational project; kopotitore@gmail.com)";
const WIDTH = 1280;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- CLI: --city=<id> (required) ---------------------------------------------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);
const CITY = typeof args.city === "string" ? args.city.toLowerCase() : null;

// Partial mode: regenerate only the named activity folders, leaving every other
// activity in the city untouched (images, manifest, AND credits). `--only` takes
// the ASCII `folder` slug(s) — robust on the command line even when activity
// names contain accents/Greek. `--merge` re-runs the whole curated list but still
// without wiping the city first. Either flag means "don't touch what I didn't ask
// for", which is what you want when fixing or adding a few activities.
const ONLY =
  typeof args.only === "string"
    ? new Set(args.only.split(",").map((s) => s.trim()).filter(Boolean))
    : null;
const PARTIAL = !!ONLY || !!args.merge;

if (!CITY) {
  const have = fs.existsSync(CURATED_DIR)
    ? fs.readdirSync(CURATED_DIR).filter((f) => f.endsWith(".mjs") && !f.startsWith("_")).map((f) => f.replace(/\.mjs$/, ""))
    : [];
  console.error("Usage: node scripts/gen-city-images.mjs --city=<id> [--only=<folder1>,<folder2>] [--merge]");
  console.error(have.length ? `Curated cities available: ${have.join(", ")}` : "No curated city files yet — copy scripts/curated/_template.mjs to scripts/curated/<city>.mjs first.");
  process.exit(1);
}

const CITY_DIR = path.join(PUBLIC_DIR, CITY);
const CREDITS_JSON = path.join(CITY_DIR, "_credits.json");
const CREDITS_MD = path.join(ROOT, "doc", `${CITY}-activity-image-sources.md`);

// --- load the curated list for this city -------------------------------------
async function loadCurated() {
  const file = path.join(CURATED_DIR, `${CITY}.mjs`);
  if (!fs.existsSync(file)) {
    throw new Error(
      `no curated list: scripts/curated/${CITY}.mjs\n` +
        `Copy scripts/curated/_template.mjs to scripts/curated/${CITY}.mjs and fill it in.`
    );
  }
  const mod = await import(pathToFileURL(file).href);
  const activities = mod.activities || mod.default;
  if (!Array.isArray(activities) || activities.length === 0) {
    throw new Error(`scripts/curated/${CITY}.mjs must export a non-empty \`activities\` array.`);
  }
  const cityName = mod.cityName || CITY.charAt(0).toUpperCase() + CITY.slice(1);
  return { activities, cityName };
}

// -----------------------------------------------------------------------------
// Download helpers
// -----------------------------------------------------------------------------
async function fetchBuf(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 1500) throw new Error(`too small (${buf.length}B) for ${url}`);
  const jpg = buf[0] === 0xff && buf[1] === 0xd8;
  const png = buf[0] === 0x89 && buf[1] === 0x50;
  const webp = buf.slice(0, 4).toString("latin1") === "RIFF";
  if (!jpg && !png && !webp) throw new Error(`not an image for ${url}`);
  return { buf, ext: jpg ? "jpg" : png ? "png" : "webp" };
}

function writeImage(folder, buf, ext) {
  const dir = path.join(CITY_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  const abs = path.join(dir, `1.${ext}`);
  fs.writeFileSync(abs, buf);
  return "/" + path.relative(path.join(ROOT, "public"), abs).split(path.sep).join("/");
}

// Unsplash: the hotlink-free /download endpoint redirects to the CDN; oEmbed
// gives us the photographer for the (optional) credit, no API key needed.
async function getUnsplash(id) {
  const photoUrl = `https://unsplash.com/photos/${id}`;
  const { buf, ext } = await fetchBuf(`${photoUrl}/download?force=true&w=${WIDTH}`);
  let author = null, authorUrl = null;
  try {
    const r = await fetch(`https://unsplash.com/oembed?url=${encodeURIComponent(photoUrl)}`,
      { headers: { "User-Agent": UA } });
    if (r.ok) { const j = await r.json(); author = j.author_name || null; authorUrl = j.author_url || null; }
  } catch { /* credit is best-effort; Unsplash needs none legally */ }
  return {
    buf, ext,
    credit: { source: "Unsplash", license: "Unsplash License", licenseUrl: "https://unsplash.com/license",
      attributionRequired: false, author, authorUrl, photoUrl },
  };
}

// Commons: imageinfo gives the thumb URL + extmetadata (author + licence). Try
// the preferred File: first, then fall back to a targeted search.
async function commonsByTitle(title) {
  const u = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo" +
    `&iiprop=url|extmetadata&iiurlwidth=${WIDTH}&titles=${encodeURIComponent("File:" + title)}`;
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const p = Object.values((await r.json())?.query?.pages || {})[0];
  const ii = p?.imageinfo?.[0];
  return ii?.thumburl ? { title: p.title, ii } : null;
}

async function commonsBySearch(query) {
  const u = "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    "&generator=search&gsrnamespace=6&gsrlimit=20" +
    `&gsrsearch=${encodeURIComponent(query + " filetype:bitmap")}` +
    `&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=${WIDTH}`;
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const pages = Object.values((await r.json())?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime || "")) continue;
    if (/logo|icon|flag|coat of arms|seal|diagram|locator|map/i.test(p.title || "")) continue;
    if (ii.thumburl) return { title: p.title, ii };
  }
  return null;
}

const stripHtml = (s) => (s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function getCommons(entry) {
  const hit = (entry.file && (await commonsByTitle(entry.file))) || (await commonsBySearch(entry.query));
  if (!hit) throw new Error(`no Commons image for ${entry.name}`);
  const { buf, ext } = await fetchBuf(hit.ii.thumburl);
  const meta = hit.ii.extmetadata || {};
  return {
    buf, ext,
    credit: {
      source: "Wikimedia Commons",
      file: hit.title,
      photoUrl: hit.ii.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(hit.title)}`,
      author: stripHtml(meta.Artist?.value) || "Unknown",
      license: stripHtml(meta.LicenseShortName?.value) || "see file page",
      licenseUrl: meta.LicenseUrl?.value || null,
      attributionRequired: true,
    },
  };
}

// -----------------------------------------------------------------------------
// Generated map writer — byte-identical format to gen-activity-images.mjs.
// -----------------------------------------------------------------------------
function writeGenerated(manifest) {
  const keys = Object.keys(manifest).sort();
  const body = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(manifest[k])},`).join("\n");
  fs.writeFileSync(
    GEN_TS,
    `/* eslint-disable */\n` +
      `// -----------------------------------------------------------------------------\n` +
      `// AUTO-GENERATED by scripts/gen-activity-images.mjs — do not edit by hand.\n` +
      `// Maps activity name -> public-folder image paths (priority-weighted count).\n` +
      `// Re-run: \`node scripts/gen-activity-images.mjs\` (optionally \`--city=<id>\`).\n` +
      `// -----------------------------------------------------------------------------\n` +
      `export const GENERATED_ACTIVITY_IMAGES: Record<string, string[]> = {\n${body}\n};\n`
  );
}

function writeCreditsMd(rows, cityName) {
  const u = rows.filter((r) => r.credit.source === "Unsplash");
  const c = rows.filter((r) => r.credit.source === "Wikimedia Commons");
  const uRows = u.map((r) =>
    `| ${r.name} | ${r.credit.author ? r.credit.author : "—"} | [photo](${r.credit.photoUrl}) |`).join("\n");
  const cRows = c.map((r) =>
    `| ${r.name} | ${r.credit.author} | ${r.credit.license} | [file](${r.credit.photoUrl}) |`).join("\n");
  fs.writeFileSync(
    CREDITS_MD,
    `# Image sources — ${cityName} activities\n\n` +
      `Generated by \`scripts/gen-city-images.mjs --city=${CITY}\`. One hand-picked image\n` +
      `per activity, chosen for accuracy (the previous auto-fetched set was not).\n\n` +
      `## Unsplash (${u.length}) — no attribution legally required\n\n` +
      `Unsplash License: free for commercial use, no credit needed. Recorded for provenance.\n\n` +
      `| Activity | Photographer | Source |\n|---|---|---|\n${uRows}\n\n` +
      `## Wikimedia Commons (${c.length}) — attribution REQUIRED\n\n` +
      `Each image is credited below as required by its licence. The same credit is in\n` +
      `\`public/destinations/${CITY}/_credits.json\` for in-app display.\n\n` +
      `| Activity | Author | Licence | Source |\n|---|---|---|---|\n${cRows}\n`
  );
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
(async () => {
  if (!fs.existsSync(MANIFEST)) throw new Error(`manifest not found: ${MANIFEST}`);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const { activities: CURATED, cityName } = await loadCurated();

  // Which entries to (re)generate. Full run = all of them; `--only` = just the
  // named folders (everything else in the city is left exactly as-is).
  const toProcess = ONLY ? CURATED.filter((e) => ONLY.has(e.folder)) : CURATED;
  if (ONLY) {
    const missing = [...ONLY].filter((f) => !CURATED.some((e) => e.folder === f));
    if (missing.length) console.warn(`! --only folders not in curated/${CITY}.mjs: ${missing.join(", ")}`);
    if (!toProcess.length) throw new Error(`--only matched no curated activities for ${CITY}.`);
  }
  console.log(
    `City: ${cityName} (${CITY}) — ${PARTIAL ? `partial: ${toProcess.length}/${CURATED.length}` : `full: ${CURATED.length}`} activities.\n`
  );

  // 1) Clear the folders we're about to (re)generate (keeping cover.* and, in
  //    partial mode, every activity we were NOT asked to touch).
  if (PARTIAL) {
    for (const e of toProcess) {
      const p = path.join(CITY_DIR, e.folder);
      if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
    }
  } else {
    for (const sub of fs.existsSync(CITY_DIR) ? fs.readdirSync(CITY_DIR) : []) {
      const p = path.join(CITY_DIR, sub);
      if (fs.statSync(p).isDirectory()) fs.rmSync(p, { recursive: true, force: true });
    }
    // Full run only: drop every old activity entry for this city from the manifest
    // so activities removed from the curated list don't linger.
    for (const k of Object.keys(manifest)) {
      if ((manifest[k] || []).every((u) => u.includes(`/destinations/${CITY}/`))) delete manifest[k];
    }
  }

  // 2) Download one accurate image per activity we're processing.
  //    In partial mode, start credits from the existing file and update by name,
  //    so credits for untouched activities are preserved.
  const credits =
    PARTIAL && fs.existsSync(CREDITS_JSON)
      ? JSON.parse(fs.readFileSync(CREDITS_JSON, "utf8"))
      : [];
  const upsertCredit = (row) => {
    const i = credits.findIndex((c) => c.name === row.name);
    if (i >= 0) credits[i] = row;
    else credits.push(row);
  };
  let ok = 0;
  for (const entry of toProcess) {
    try {
      const got = entry.source === "unsplash" ? await getUnsplash(entry.id) : await getCommons(entry);
      const rel = writeImage(entry.folder, got.buf, got.ext);
      manifest[entry.name] = [rel];
      upsertCredit({ name: entry.name, path: rel, note: entry.note || undefined, credit: got.credit });
      ok++;
      console.log(`✓ ${entry.name}  [${got.credit.source}]  → ${rel}`);
    } catch (e) {
      console.error(`✗ ${entry.name}: ${e.message}`);
    }
    await sleep(150);
  }

  // 3) Rewrite manifest + generated map.
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  writeGenerated(manifest);

  // 4) Write credits (machine-readable + human-readable).
  fs.mkdirSync(CITY_DIR, { recursive: true });
  fs.writeFileSync(CREDITS_JSON, JSON.stringify(credits, null, 2));
  fs.mkdirSync(path.dirname(CREDITS_MD), { recursive: true });
  writeCreditsMd(credits, cityName);

  console.log(`\nDone. ${ok}/${toProcess.length} ${cityName} activity images installed.`);
  if (ok < toProcess.length) console.log("Some failed — re-run to retry just the network hiccups.");
})();
