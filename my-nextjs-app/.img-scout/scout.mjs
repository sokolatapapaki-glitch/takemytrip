// Image scout: search Wikimedia Commons, download candidates, and build ONE
// contact-sheet montage so a reviewer can compare them at a glance and pick
// the best full-building, family-friendly shot. Captures author + licence for
// legal attribution.
//   node .img-scout/scout.mjs "<slug>" "<commons search query>"
// Output: .img-scout/<slug>/sheet.jpg (labelled grid) + candidates.json
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const UA = "ttk-app image scout (educational project; kopotitore@gmail.com)";
const [, , slug, query] = process.argv;
if (!slug || !query) { console.error('usage: node scout.mjs "<slug>" "<query>"'); process.exit(1); }

const OUT = path.join(".img-scout", slug);
fs.mkdirSync(OUT, { recursive: true });
const strip = (s) => (s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function getJson(u) {
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}
async function dl(u) {
  const r = await fetch(u, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return Buffer.from(await r.arrayBuffer());
}

const url =
  "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
  "&generator=search&gsrnamespace=6&gsrlimit=40" +
  `&gsrsearch=${encodeURIComponent(query + " filetype:bitmap")}` +
  `&prop=imageinfo&iiprop=url|mime|size|extmetadata&iiurlwidth=640`;

const data = await getJson(url);
const pages = Object.values(data?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));

// Grid geometry
const CELL_W = 360, CELL_H = 240, COLS = 3, LABEL_H = 22, GAP = 6;

const candidates = [];
const tiles = [];
let i = 0;
for (const p of pages) {
  const ii = p.imageinfo?.[0];
  if (!ii || !/^image\/(jpeg|png)$/.test(ii.mime || "")) continue;
  if (/logo|icon|flag|coat of arms|seal|diagram|locator|\bmap\b|\bplan\b|drawing|engraving|stamp|graph/i.test(p.title || "")) continue;
  const w = ii.thumbwidth || 0, h = ii.thumbheight || 0;
  const MINRATIO = Number(process.env.MINRATIO || 1.15);
  const MINW = Number(process.env.MINW || 1600);
  if (h && w / h < MINRATIO) continue;     // skip portrait/square (usually close-ups/interiors)
  if ((ii.width || 0) < MINW) continue;    // skip tiny originals
  i++;
  try {
    const raw = await dl(ii.thumburl);
    const m = ii.extmetadata || {};
    candidates.push({
      n: i, title: p.title, orient: `${w}x${h}`, srcSize: `${ii.width}x${ii.height}`,
      author: strip(m.Artist?.value) || "Unknown",
      license: strip(m.LicenseShortName?.value) || "see file page",
      licenseUrl: m.LicenseUrl?.value || null, pageUrl: ii.descriptionurl,
    });
    // tile = number label bar + fitted image
    const img = await sharp(raw).resize(CELL_W, CELL_H, { fit: "cover" }).toBuffer();
    const label = Buffer.from(
      `<svg width="${CELL_W}" height="${LABEL_H}"><rect width="100%" height="100%" fill="#111"/>` +
      `<text x="6" y="16" font-family="sans-serif" font-size="14" fill="#fff">c${i}  ${w}x${h}</text></svg>`
    );
    const tile = await sharp({ create: { width: CELL_W, height: CELL_H + LABEL_H, channels: 3, background: "#000" } })
      .composite([{ input: label, top: 0, left: 0 }, { input: img, top: LABEL_H, left: 0 }])
      .jpeg().toBuffer();
    tiles.push(tile);
    console.log(`c${i}  ${w}x${h}  ${strip(m.LicenseShortName?.value)}  ${p.title}`);
  } catch (e) { console.error(`skip ${p.title}: ${e.message}`); i--; }
  if (i >= 9) break;
}

if (tiles.length) {
  const rows = Math.ceil(tiles.length / COLS);
  const tileH = CELL_H + LABEL_H;
  const sheetW = COLS * CELL_W + (COLS + 1) * GAP;
  const sheetH = rows * tileH + (rows + 1) * GAP;
  const comp = tiles.map((t, idx) => ({
    input: t,
    top: GAP + Math.floor(idx / COLS) * (tileH + GAP),
    left: GAP + (idx % COLS) * (CELL_W + GAP),
  }));
  await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: "#222" } })
    .composite(comp).jpeg({ quality: 80 }).toFile(path.join(OUT, "sheet.jpg"));
}
fs.writeFileSync(path.join(OUT, "candidates.json"), JSON.stringify(candidates, null, 2));
console.log(`\n${candidates.length} candidates → ${OUT}/sheet.jpg`);
