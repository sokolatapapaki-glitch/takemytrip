// -----------------------------------------------------------------------------
// Auto-download activity photos (Wikimedia Commons) → /public + a generated map.
// -----------------------------------------------------------------------------
// For every activity in the catalogues, fetch priority-weighted photos (higher
// `priority` → more images), save them under
// public/destinations/<city>/<id>-<slug>/, and (re)generate
// app/activities/components/activityImages.generated.ts.
//
// Free, no API key. Resumable: a manifest tracks done activities, so re-runs and
// crashes skip already-fetched ones. Usage:
//   node scripts/gen-activity-images.mjs            # all cities
//   node scripts/gen-activity-images.mjs --city=krakow
//   node scripts/gen-activity-images.mjs --limit=5  # first N activities (test)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public", "destinations");
const MANIFEST = path.join(PUBLIC_DIR, "_manifest.json");
const GEN_TS = path.join(ROOT, "app", "activities", "components", "activityImages.generated.ts");
const DEST_GEN_TS = path.join(ROOT, "app", "cities", "components", "destinationImages.generated.ts");
const CITIES_DATA = path.join(ROOT, "app", "cities", "components", "citiesData.ts");
const UA = "ttk-app image fetcher (educational project; kopotitore@gmail.com)";
const MIN_IMAGES = 2; // every activity ends with at least this many.

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);
const onlyCity = typeof args.city === "string" ? args.city : null;
const limit = args.limit ? Number(args.limit) : Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- read activities (name, priority, id, city) by parsing the data files -----
// Handles both catalogue shapes: the generated/Rome entries (`id: N,` then
// `name: "..."` ... `priority: N`) and the hand-authored Paris entries (single
// line, `name:` first, no numeric `id`). For each quoted `name:` we read the
// `priority:` inside that entry, and an `id:` just before it if present (else a
// per-file index). `name: string;` in the type def has no quote, so it's skipped.
function entriesFrom(text, cityId) {
  const matches = [...text.matchAll(/name:\s*"((?:[^"\\]|\\.)*)"/g)];
  return matches.map((m, k) => {
    const start = m.index;
    const end = k + 1 < matches.length ? matches[k + 1].index : text.length;
    const seg = text.slice(start, end);
    const num = (key) => {
      const mm = seg.match(new RegExp(key + ":\\s*(\\d+)"));
      return mm ? Number(mm[1]) : 0;
    };
    const idm = text.slice(Math.max(0, start - 120), start).match(/id:\s*(\d+)\s*,\s*$/);
    return {
      id: idm ? Number(idm[1]) : k + 1,
      name: m[1],
      cityId,
      priority: num("priority"),
      vibes: {
        cultural: num("cultural"),
        foodie: num("foodie"),
        adventurous: num("adventurous"),
        relaxing: num("relaxing"),
      },
    };
  });
}

function loadActivities() {
  const out = [];
  // 13 generated city catalogues: data/activities/<city>.data.ts
  const genDir = path.join(ROOT, "data", "activities");
  for (const f of fs.readdirSync(genDir)) {
    if (!f.endsWith(".data.ts") || f === "_helpers.ts") continue;
    const cityId = f.replace(/\.data\.ts$/, "");
    out.push(...entriesFrom(fs.readFileSync(path.join(genDir, f), "utf8"), cityId));
  }
  // Curated Rome + Paris live together in data/activities.data.ts.
  const curated = fs.readFileSync(path.join(ROOT, "data", "activities.data.ts"), "utf8");
  // Split on the real Paris array declaration (the bare string "PARIS_ACTIVITIES"
  // also appears in a header comment, which would swallow all of Rome).
  const pIdx = curated.indexOf("const PARIS_BASE");
  out.push(...entriesFrom(curated.slice(0, pIdx), "rome"));
  out.push(...entriesFrom(curated.slice(pIdx), "paris"));
  return out;
}

// --- helpers ------------------------------------------------------------------
const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const cityTerm = (id) => id.charAt(0).toUpperCase() + id.slice(1);

// Greek → Latin transliteration so Greek-named activities get a searchable term
// (e.g. "Πάνθεον" → "Pantheon"). Imperfect, but far better than a generic city
// query. A few famous places whose Greek name doesn't transliterate to the
// English landmark get an explicit override below.
const GREEK = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i",
  κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s",
  ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o", ά: "a", έ: "e",
  ή: "i", ί: "i", ό: "o", ύ: "y", ώ: "o", ϊ: "i", ϋ: "y", ΐ: "i", ΰ: "y",
};
const translit = (s) =>
  s.split("").map((ch) => GREEK[ch.toLowerCase()] ?? ch).join("");

// Curated overrides for landmarks whose Greek/loose name searches badly.
const LANDMARK = {
  "Κολοσσαίο & Ρωμαϊκή Αγορά": "Colosseum Roman Forum Rome",
  Πάνθεον: "Pantheon Rome",
  Βατικανό: "St Peter's Basilica Vatican City",
  "Μουσεία Βατικανού και Καπέλα Σιστίνα": "Vatican Museums Sistine Chapel Rome",
  "Λόφος Gianicolo (Teatrino di Pulcinella)": "Janiculum hill Rome",
  "Η Τρύπα της Κλειδαριάς (Aventine Keyhole)": "Aventine Keyhole Rome",
};

// A search query for ONE activity: its own name (Latin words, else transliterated
// Greek), plus the city. No generic fallbacks — the result must be about THIS
// activity or nothing.
function queryFor(name, cityId) {
  if (LANDMARK[name]) return LANDMARK[name];
  const latin = (name.match(/[A-Za-z][A-Za-z'’.&()-]*/g) || [])
    .join(" ")
    .replace(/[()]/g, " ")
    .trim();
  const term =
    latin.replace(/\s/g, "").length >= 3 ? latin : translit(name).replace(/[()]/g, " ").trim();
  return `${term} ${cityTerm(cityId)}`.trim();
}

// The underlying Commons file for a thumb URL — the key for global de-duplication
// so the SAME photo is never reused across two activities.
function fileKeyFromUrl(url) {
  const m = url.match(/\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\//);
  return (m ? decodeURIComponent(m[1]) : url).toLowerCase();
}

// A category/theme for an activity, used to find RELATED images when its own
// name finds too few. Derived from a type word in the name (museum, castle,
// park…), else from its dominant vibe. Combined with global de-dup, each
// activity still gets DIFFERENT photos — never the city skyline.
const TYPE_WORDS = [
  [/aqua\s?park|water\s?park|swimming|\bpool\b|thermal|\bspa\b|\bbath\b/i, "water park"],
  [/zoo|bioparco|safari|aquarium/i, "zoo"],
  [/salt mine|\bmine\b/i, "salt mine"],
  [/castle|castello|fortress|\bfort\b|citadel|kastro/i, "castle"],
  [/palace|palazzo|\broyal\b/i, "palace"],
  [/cathedral|basilica|duomo|minster|sagrada/i, "cathedral"],
  [/church|chapel|monastery|abbey|sanctuary|panagia/i, "church"],
  [/mosque|synagogue|\btemple\b|pantheon/i, "temple"],
  [/museum|museo|gallery|galleria|exhibition|pinacoteca/i, "museum"],
  [/garden|\bpark\b|gardens|\bvilla\b/i, "park"],
  [/tower|\btorre\b/i, "tower"],
  [/square|piazza|\bplaza\b|rynek/i, "town square"],
  [/fountain|fontana/i, "fountain"],
  [/bridge|\bponte\b/i, "bridge"],
  [/market|bazaar|mercado/i, "market"],
  [/playground/i, "playground"],
  [/stadium|arena/i, "stadium"],
  [/theatre|theater|\bopera\b/i, "theatre"],
  [/amusement|theme park|luna ?park|funfair|fun park|energylandia|cinecitt|gladiator|escape room|pinball|trampoline|go ?jump/i, "amusement park"],
  [/observatory|planetarium/i, "planetarium"],
  [/illusion/i, "optical illusion art"],
  [/cave|grotto|catacomb/i, "cave"],
  [/lake|beach|seaside|river/i, "lake"],
  [/library/i, "library"],
  [/aqueduct|acquedotti|ruins|forum|acropolis/i, "ancient ruins"],
];
const VIBE_KW = {
  foodie: "restaurant food",
  cultural: "museum monument",
  adventurous: "park outdoor activity",
  relaxing: "park garden",
};
function themeFor(name, vibes) {
  const hay = `${name} ${translit(name)}`;
  for (const [re, theme] of TYPE_WORDS) if (re.test(hay)) return theme;
  let dom = "cultural", best = -1;
  for (const k of Object.keys(VIBE_KW)) if ((vibes?.[k] ?? 0) > best) (best = vibes[k]), (dom = k);
  return VIBE_KW[dom];
}

const countFor = (p) => (p >= 8 ? 5 : p >= 5 ? 3 : 2);

async function commonsSearch(query, count) {
  const u =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    "&generator=search&gsrnamespace=6&gsrlimit=50" +
    `&gsrsearch=${encodeURIComponent(query + " filetype:bitmap")}` +
    "&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1024";
  let j;
  try {
    const r = await fetch(u, { headers: { "User-Agent": UA } });
    if (!r.ok) return [];
    j = await r.json();
  } catch {
    return [];
  }
  const pages = j?.query?.pages ? Object.values(j.query.pages) : [];
  pages.sort((a, b) => (a.index || 0) - (b.index || 0));
  const urls = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime || "")) continue;
    if ((ii.thumbwidth || ii.width || 0) < 600) continue;
    if (/map|logo|icon|flag|coat of arms|seal|diagram|locator|panorama_of/i.test(p.title || "")) continue;
    urls.push(ii.thumburl || ii.url);
    if (urls.length >= count) break;
  }
  return urls;
}

async function download(url, dest) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 1500) return false;
    const jpg = buf[0] === 0xff && buf[1] === 0xd8;
    const png = buf[0] === 0x89 && buf[1] === 0x50;
    const webp = buf.slice(0, 4).toString("latin1") === "RIFF";
    if (!jpg && !png && !webp) return false;
    const ext = jpg ? "jpg" : png ? "png" : "webp";
    const final = dest + "." + ext;
    fs.writeFileSync(final, buf);
    return "/" + path.relative(path.join(ROOT, "public"), final).split(path.sep).join("/");
  } catch {
    return false;
  }
}

// Like download(), but returns the raw bytes + ext WITHOUT writing — so a caller
// can content-hash a candidate before committing it to disk (used by --dedupe to
// guarantee replacements are byte-unique, not just URL-unique).
async function downloadBuf(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 1500) return null;
    const jpg = buf[0] === 0xff && buf[1] === 0xd8;
    const png = buf[0] === 0x89 && buf[1] === 0x50;
    const webp = buf.slice(0, 4).toString("latin1") === "RIFF";
    if (!jpg && !png && !webp) return null;
    return { buf, ext: jpg ? "jpg" : png ? "png" : "webp" };
  } catch {
    return null;
  }
}

const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex");

// --dedupe: hash every image already in the manifest; wherever two activities
// ended up with byte-identical photos (Commons duplicate uploads that slipped
// past the URL-key de-dup), keep the first and re-fetch a content-unique
// replacement for the rest — searching the same tiers, hashing each candidate's
// bytes, and only accepting one whose content is not used anywhere yet.
async function runDedupe(manifest) {
  const meta = new Map(loadActivities().map((a) => [a.name, a]));
  const used = new Set(); // every content hash currently in use
  const fileHash = new Map(); // relPath -> hash
  const seen = new Set();
  const victims = []; // { name, idx, relPath } whose content duplicates an earlier file

  for (const [name, paths] of Object.entries(manifest)) {
    (paths || []).forEach((rel, idx) => {
      const abs = path.join(ROOT, "public", rel.replace(/^\//, ""));
      if (!fs.existsSync(abs)) return;
      const h = sha1(fs.readFileSync(abs));
      fileHash.set(rel, h);
      used.add(h);
      if (seen.has(h)) victims.push({ name, idx, relPath: rel });
      else seen.add(h);
    });
  }

  console.log(`Dedupe: ${victims.length} duplicate-content file(s) to replace.`);
  let fixed = 0;

  for (const v of victims) {
    const a = meta.get(v.name);
    if (!a) {
      console.log(`  ! no metadata for "${v.name}" — skipping`);
      continue;
    }
    const theme = themeFor(a.name, a.vibes);
    const queries = [
      queryFor(a.name, a.cityId),
      `${theme} ${cityTerm(a.cityId)}`,
      theme,
    ];
    const oldHash = fileHash.get(v.relPath);
    let replaced = false;

    for (const q of queries) {
      if (replaced) break;
      const urls = await commonsSearch(q, 40);
      for (const url of urls) {
        const got = await downloadBuf(url);
        if (!got) continue;
        const h = sha1(got.buf);
        if (used.has(h)) continue; // already used somewhere — keep looking
        // Commit: replace the old file in place (drop old ext, write new).
        const absOld = path.join(ROOT, "public", v.relPath.replace(/^\//, ""));
        try { fs.rmSync(absOld, { force: true }); } catch {}
        const base = absOld.replace(/\.\w+$/, "");
        const absNew = `${base}.${got.ext}`;
        fs.writeFileSync(absNew, got.buf);
        const relNew = "/" + path.relative(path.join(ROOT, "public"), absNew).split(path.sep).join("/");
        manifest[v.name][v.idx] = relNew;
        used.delete(oldHash);
        used.add(h);
        replaced = true;
        fixed++;
        break;
      }
      await sleep(40);
    }
    if (!replaced) console.log(`  ! no unique replacement found for "${v.name}" (${v.relPath})`);
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  writeGenerated(manifest);
  console.log(`Dedupe finished. replaced=${fixed}/${victims.length}`);
}

// The curated remote covers (CITY_IMAGES) parsed straight from citiesData.ts:
// `<id>:` on one line, the "https://…" URL on the next. CITY_DESCRIPTIONS values
// aren't URLs, so the https-only pattern skips them.
function parseCityImages() {
  const text = fs.readFileSync(CITIES_DATA, "utf8");
  const map = {};
  for (const m of text.matchAll(/([a-z][a-z-]*):\s*\n?\s*"(https:\/\/[^"]+)"/g)) {
    map[m[1]] = m[2];
  }
  return map;
}

function writeDestGenerated(map) {
  const keys = Object.keys(map).sort();
  const body = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(map[k])},`).join("\n");
  fs.writeFileSync(
    DEST_GEN_TS,
    `/* eslint-disable */\n` +
      `// -----------------------------------------------------------------------------\n` +
      `// AUTO-GENERATED by scripts/gen-activity-images.mjs — do not edit by hand.\n` +
      `// One local cover image per destination id (downloaded from CITY_IMAGES).\n` +
      `// -----------------------------------------------------------------------------\n` +
      `export const DESTINATION_IMAGES: Record<string, string> = {\n${body}\n};\n`
  );
}

// The hand-written CITY_IMAGES thumb URLs use a fixed 800px width that Wikimedia
// doesn't serve for every file (→ 400). Re-resolve the underlying File via the
// API to get a width it WILL serve, the same way the activity search does.
async function resolveCommonsThumb(thumbUrl) {
  const m = thumbUrl.match(/\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\//);
  if (!m) return null;
  const title = "File:" + decodeURIComponent(m[1]);
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    "&prop=imageinfo&iiprop=url|mime&iiurlwidth=1024" +
    `&titles=${encodeURIComponent(title)}`;
  try {
    const r = await fetch(api, { headers: { "User-Agent": UA } });
    if (!r.ok) return null;
    const j = await r.json();
    const p = Object.values(j?.query?.pages || {})[0];
    return p?.imageinfo?.[0]?.thumburl || null;
  } catch {
    return null;
  }
}

// Download (or reuse) one cover image per destination → public/destinations/<id>/
// cover.<ext>. Returns { id: "/destinations/<id>/cover.jpg" } for every success.
async function buildDestinationCovers() {
  const cover = {};
  for (const [id, url] of Object.entries(parseCityImages())) {
    const dir = path.join(PUBLIC_DIR, id);
    const existing =
      fs.existsSync(dir) && fs.readdirSync(dir).find((f) => /^cover\.\w+$/.test(f));
    if (existing) {
      cover[id] = `/destinations/${id}/${existing}`;
      continue;
    }
    fs.mkdirSync(dir, { recursive: true });
    const thumb = await resolveCommonsThumb(url);
    const rel = thumb ? await download(thumb, path.join(dir, "cover")) : false;
    if (rel) cover[id] = rel;
    await sleep(40);
  }
  writeDestGenerated(cover);
  return cover;
}

function writeGenerated(manifest) {
  const keys = Object.keys(manifest).sort();
  const body = keys
    .map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(manifest[k])},`)
    .join("\n");
  const ts =
    `/* eslint-disable */\n` +
    `// -----------------------------------------------------------------------------\n` +
    `// AUTO-GENERATED by scripts/gen-activity-images.mjs — do not edit by hand.\n` +
    `// Maps activity name -> public-folder image paths (priority-weighted count).\n` +
    `// Re-run: \`node scripts/gen-activity-images.mjs\` (optionally \`--city=<id>\`).\n` +
    `// -----------------------------------------------------------------------------\n` +
    `export const GENERATED_ACTIVITY_IMAGES: Record<string, string[]> = {\n${body}\n};\n`;
  fs.writeFileSync(GEN_TS, ts);
}

// --- main ---------------------------------------------------------------------
(async () => {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  let manifest = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : {};

  // --dedupe: repair byte-identical photos shared across activities, then exit
  // (doesn't touch covers or re-fetch everything).
  if (args.dedupe) {
    await runDedupe(manifest);
    return;
  }

  // --clean: wipe activity image folders + their manifest entries (KEEPING the
  // destination cover.* files) for a fresh, de-duplicated rebuild. Scoped to
  // --city when given, else the whole catalogue.
  if (args.clean) {
    const cities = (onlyCity
      ? [onlyCity]
      : fs.readdirSync(PUBLIC_DIR)
    ).filter((c) => fs.existsSync(path.join(PUBLIC_DIR, c)) && fs.statSync(path.join(PUBLIC_DIR, c)).isDirectory());
    for (const city of cities) {
      const cdir = path.join(PUBLIC_DIR, city);
      for (const sub of fs.readdirSync(cdir)) {
        const p = path.join(cdir, sub);
        if (fs.statSync(p).isDirectory()) fs.rmSync(p, { recursive: true, force: true });
      }
    }
    for (const k of Object.keys(manifest)) {
      if (manifest[k].some((u) => cities.some((c) => u.includes(`/destinations/${c}/`)))) {
        delete manifest[k];
      }
    }
    if (!onlyCity && fs.existsSync(MANIFEST)) fs.rmSync(MANIFEST);
    console.log(`Cleaned ${cities.length} cit(y/ies) — activity images + manifest entries (covers kept).`);
  }

  // 1) One cover image per destination (15 curated covers; cheap + idempotent).
  const destCover = await buildDestinationCovers();
  console.log(`Destination covers ready: ${Object.keys(destCover).length}`);

  // 2) Activities — priority-weighted real photos, then guaranteed >= MIN_IMAGES.
  let activities = loadActivities();
  if (onlyCity) activities = activities.filter((a) => a.cityId === onlyCity);
  // Higher priority first, so a partial/timed-out run still covers the big sights.
  activities.sort((a, b) => b.priority - a.priority);
  activities = activities.slice(0, limit);

  console.log(`Activities to process: ${activities.length}` + (onlyCity ? ` (city=${onlyCity})` : ""));
  let done = 0,
    fetched = 0,
    skipped = 0;

  // Every accepted image's Commons file, so the SAME photo is never reused by two
  // activities. A single pass dedupes the whole catalogue at once; --fresh
  // reprocesses EVERY activity (overwriting its old images) so uniqueness holds
  // across the entire catalogue, while keeping the live map intact meanwhile.
  const usedFiles = new Set();

  for (const a of activities) {
    if (manifest[a.name]?.length && !args.fresh) {
      skipped++;
      continue;
    }

    const target = countFor(a.priority); // 5 / 3 / 2 by priority
    const dir = path.join(PUBLIC_DIR, a.cityId, `${a.id}-${slugify(a.name) || "act"}`);
    fs.mkdirSync(dir, { recursive: true });
    const saved = [];
    let i = 0;

    // Pull from a list of candidate URLs into `saved`, skipping any image already
    // used by another activity (global uniqueness), until we hit `cap`.
    const pull = async (urls, cap) => {
      for (const url of urls) {
        if (saved.length >= cap) break;
        const key = fileKeyFromUrl(url);
        if (usedFiles.has(key)) continue;
        const rel = await download(url, path.join(dir, String(i + 1)));
        if (rel) {
          saved.push(rel);
          usedFiles.add(key);
          i++;
          fetched++;
        }
        await sleep(40);
      }
    };

    // Tier 1 — the activity's own name (specific, most relevant).
    await pull(await commonsSearch(queryFor(a.name, a.cityId), target + 12), target);

    // Tier 2 — RELATED by category (museum / castle / park…) IN THIS CITY when
    // still short. Global de-dup keeps them unique.
    const theme = themeFor(a.name, a.vibes);
    if (saved.length < target) {
      await pull(await commonsSearch(`${theme} ${cityTerm(a.cityId)}`, target + 20), target);
    }

    // Tier 3 — same category WITHOUT the city (generic but on-theme + still
    // unique), so even very niche activities reach their priority count.
    if (saved.length < target) {
      await pull(await commonsSearch(theme, target + 25), target);
    }

    if (saved.length) manifest[a.name] = saved;
    else try { fs.rmdirSync(dir); } catch {} // drop the empty folder

    done++;
    if (done % 10 === 0) {
      fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
      writeGenerated(manifest);
      console.log(`  …${done}/${activities.length} done, ${fetched} downloaded so far`);
    }
    await sleep(40);
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  writeGenerated(manifest);
  console.log(
    `Finished. processed=${done} skipped(>=${MIN_IMAGES})=${skipped} images_downloaded=${fetched} activities_with_images=${Object.keys(manifest).length}`
  );
})();
