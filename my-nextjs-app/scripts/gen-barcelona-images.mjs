// -----------------------------------------------------------------------------
// Curated, accurate, fully-legal images for the Barcelona ACTIVITIES.
// -----------------------------------------------------------------------------
// The covers were chosen by hand (Unsplash), but the activity photos were
// auto-fetched from Wikimedia Commons and several were inaccurate. This script
// replaces Barcelona's activity images with ONE hand-picked, accurate photo per
// activity — the same "looked at one by one" approach used for the city covers:
//
//   • 9 famous landmarks  → Unsplash (Unsplash License: free for commercial use,
//                           no attribution required; we still record provenance).
//   • 7 activities Unsplash does NOT cover accurately (museums / branded
//     attractions) → hand-picked Wikimedia Commons photos. Commons images are
//     free but attribution IS required, so the author + licence are fetched from
//     the Commons API and written into the credits file automatically.
//
// What it does, in one run:
//   1. Deletes the current Barcelona activity image folders (keeps cover.jpg).
//   2. Downloads one accurate image per activity → barcelona/<folder>/1.jpg.
//   3. Rewrites the Barcelona entries in activityImages.generated.ts + the manifest.
//   4. Writes credits:  public/destinations/barcelona/_credits.json  and
//      doc/barcelona-activity-image-sources.md  (with real Commons attribution).
//
// Run from my-nextjs-app/ in an environment WITH network access:
//   node scripts/gen-barcelona-images.mjs
// -----------------------------------------------------------------------------
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public", "destinations");
const BCN_DIR = path.join(PUBLIC_DIR, "barcelona");
const MANIFEST = path.join(PUBLIC_DIR, "_manifest.json");
const GEN_TS = path.join(ROOT, "app", "activities", "components", "activityImages.generated.ts");
const CREDITS_JSON = path.join(BCN_DIR, "_credits.json");
const CREDITS_MD = path.join(ROOT, "doc", "barcelona-activity-image-sources.md");
const UA = "ttk-app image fetcher (educational project; kopotitore@gmail.com)";
const WIDTH = 1280;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// -----------------------------------------------------------------------------
// The curated list. `name` MUST match the activity key in the generated map.
// Unsplash entries carry the photo id (the short slug at the end of the photo
// page URL). Commons entries carry a preferred File: title plus a fallback
// search query, so a download still succeeds if a title was renamed on Commons.
// -----------------------------------------------------------------------------
const CURATED = [
  { folder: "1-sagrada-familia", name: "Sagrada Família",
    source: "commons", file: "Sagrada Familia at night 02.jpg",
    query: "Sagrada Familia Barcelona night illuminated full basilica" },
  { folder: "2-park-guell", name: "Park Güell",
    source: "commons", file: "Park Güell 5 - panoramio.jpg",
    query: "Park Güell Barcelona main terrace view from above" },
  { folder: "3-casa-batllo", name: "Casa Batlló",
    source: "commons", file: "Casa Batlló 01.jpg",
    query: "Casa Batlló Barcelona dragon roof from above" },
  { folder: "4-casa-mila-la-pedrera", name: "Casa Milà (La Pedrera)",
    source: "unsplash", id: "EUed6ZoHYfg" },
  { folder: "5-picasso-museum", name: "Picasso Museum",
    source: "commons", file: "Museu Picasso Barcelona- queues.jpg",
    query: "Museu Picasso Barcelona Carrer Montcada queue street" },
  { folder: "6-gaudi-experience", name: "Gaudí Experience",
    source: "commons", file: "Casa Vicens, Barcelona - panoramio.jpg",
    query: "Casa Vicens Barcelona Gaudí house exterior",
    note: "No free photo of the Gaudí Experience attraction (a 4-D cinema) itself exists; Casa Vicens — Gaudí's first house — is used as a representative, family-friendly Gaudí image. Swap if you obtain a licensed photo of the venue." },
  { folder: "7-montjuic-castle-castell-de-montjuic", name: "Montjuïc Castle (Castell de Montjuïc)",
    source: "commons", file: "Κάστρο Μονζουίκ 3231 - 3233.jpg",
    query: "Castell de Montjuïc Barcelona fortress castle moat" },
  { folder: "8-hospital-de-sant-pau", name: "Hospital de Sant Pau",
    source: "commons", file: "2014- Hospital Sant Pau, Barcelona, Spain ( Ank Kumar ) 02.jpg",
    query: "Hospital de Sant Pau Barcelona modernista pavilion Domènech i Montaner" },
  { folder: "9-camp-nou-barca-stadium-tour", name: "Camp Nou (Barça Stadium Tour)",
    source: "commons", file: "Camp Nou aerial (cropped).jpg",
    query: "Camp Nou Barcelona stadium aerial exterior" },
  { folder: "11-cosmocaixa", name: "CosmoCaixa",
    source: "commons", file: "CosmoCaixa building.jpg",
    query: "CosmoCaixa Barcelona science museum building daytime exterior" },
  { folder: "12-tibidabo-amusement-park", name: "Tibidabo Amusement Park",
    source: "unsplash", id: "bV_3QZtlhJo" },
  { folder: "13-portaventura-world", name: "PortAventura World",
    source: "commons", file: "Dragon Khan and Shambhala in 2012.JPG",
    query: "PortAventura Shambhala Dragon Khan roller coaster" },
  { folder: "14-parc-de-la-ciutadella", name: "Parc de la Ciutadella",
    source: "unsplash", id: "PdsutDCgemk" },
  { folder: "15-poblenou-beaches", name: "Poblenou Beaches",
    source: "unsplash", id: "0idz9EY2tMM" },
  { folder: "16-magic-fountain-font-magica", name: "Magic Fountain (Font Màgica)",
    source: "commons", file: "Barcelona 133.JPG",
    query: "Font Màgica Montjuïc Barcelona fountain night Palau Nacional" },
  { folder: "18-museu-blau-natural-history-museum", name: "Museu Blau (Natural History Museum)",
    source: "commons", file: "Barcelona 2006 (2845523526).jpg",
    query: "Edifici Fòrum Barcelona blue triangular building Herzog de Meuron" },
  { folder: "10-laquarium-de-barcelona", name: "L'Aquàrium de Barcelona",
    source: "commons", file: "Tunnelaquarium 14-05-2009 15-54-09.JPG",
    query: "Aquarium Barcelona shark tunnel visitors" },
  { folder: "17-ciutat-vella-barri-gotic", name: "Ciutat Vella / Barri Gòtic Exploration",
    source: "commons", file: "PONT del CARRER del BISBE - panoramio.jpg",
    query: "Pont del Bisbe Barri Gòtic Barcelona gothic street" },
  { folder: "19-la-casa-dels-entremesos", name: "La Casa dels Entremesos - Μουσείο των Γιγάντων",
    source: "commons", file: "Barcelona - Gegants and sardana in El Born 01.jpg",
    query: "Gegants Barcelona giants figures parade Catalan" },
];

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
  const dir = path.join(BCN_DIR, folder);
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

function writeCreditsMd(rows) {
  const u = rows.filter((r) => r.credit.source === "Unsplash");
  const c = rows.filter((r) => r.credit.source === "Wikimedia Commons");
  const uRows = u.map((r) =>
    `| ${r.name} | ${r.credit.author ? r.credit.author : "—"} | [photo](${r.credit.photoUrl}) |`).join("\n");
  const cRows = c.map((r) =>
    `| ${r.name} | ${r.credit.author} | ${r.credit.license} | [file](${r.credit.photoUrl}) |`).join("\n");
  fs.writeFileSync(
    CREDITS_MD,
    `# Image sources — Barcelona activities\n\n` +
      `Generated by \`scripts/gen-barcelona-images.mjs\`. One hand-picked image per\n` +
      `activity, chosen for accuracy (the previous auto-fetched set was not).\n\n` +
      `## Unsplash (${u.length}) — no attribution legally required\n\n` +
      `Unsplash License: free for commercial use, no credit needed. Recorded for provenance.\n\n` +
      `| Activity | Photographer | Source |\n|---|---|---|\n${uRows}\n\n` +
      `## Wikimedia Commons (${c.length}) — attribution REQUIRED\n\n` +
      `Each image is credited below as required by its licence. The same credit is in\n` +
      `\`public/destinations/barcelona/_credits.json\` for in-app display.\n\n` +
      `| Activity | Author | Licence | Source |\n|---|---|---|---|\n${cRows}\n`
  );
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
(async () => {
  if (!fs.existsSync(MANIFEST)) throw new Error(`manifest not found: ${MANIFEST}`);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));

  // 1) Delete current Barcelona activity image folders (keep cover.jpg).
  for (const sub of fs.existsSync(BCN_DIR) ? fs.readdirSync(BCN_DIR) : []) {
    const p = path.join(BCN_DIR, sub);
    if (fs.statSync(p).isDirectory()) fs.rmSync(p, { recursive: true, force: true });
  }
  // Drop every old Barcelona activity entry from the manifest.
  for (const k of Object.keys(manifest)) {
    if ((manifest[k] || []).every((u) => u.includes("/destinations/barcelona/"))) delete manifest[k];
  }

  // 2) Download one accurate image per activity.
  const credits = [];
  let ok = 0;
  for (const entry of CURATED) {
    try {
      const got = entry.source === "unsplash" ? await getUnsplash(entry.id) : await getCommons(entry);
      const rel = writeImage(entry.folder, got.buf, got.ext);
      manifest[entry.name] = [rel];
      credits.push({ name: entry.name, path: rel, note: entry.note || undefined, credit: got.credit });
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
  fs.writeFileSync(CREDITS_JSON, JSON.stringify(credits, null, 2));
  writeCreditsMd(credits);

  console.log(`\nDone. ${ok}/${CURATED.length} Barcelona activity images installed.`);
  if (ok < CURATED.length) console.log("Some failed — re-run to retry just the network hiccups.");
})();
