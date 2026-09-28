// -----------------------------------------------------------------------------
// Activity catalogue generator — pure helpers (no I/O)
// -----------------------------------------------------------------------------
// Everything gen-activities.mjs needs to turn one takemytrip JSON activity into a
// catalogue literal, split out so it can be unit-tested
// (gen-activities.lib.test.mjs) the same way photo-sync.lib.mjs is.
//
// The JSON contract these read is documented in editor/README.md ("Data
// contract"). Engine fields come from the JSON when it sets them — opening_hours,
// vibes, priority — and are otherwise synthesized from the activity's `category`
// via the presets below, exactly as before those fields existed.

// --- category -> synthesized engine fields -----------------------------------
// h: duration hours (used when the JSON's duration_hours is 0/absent). Either
// `allDay:true` (open 24h every day) or an o/c window applied every day. v: the
// four vibe scores [cultural, foodie, adventurous, relaxing] (0-10). p: base
// priority (0-10); top:true raises it to >=9. lunch: flags is_lunch.
export const DEFAULT = { h: 2, o: 9, c: 19, v: [5, 3, 3, 5], p: 5 };
export const PRESET = {
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

export const VIBE_KEYS = ["cultural", "foodie", "adventurous", "relaxing"];

export const normCat = (c) => String(c || "").toLowerCase().replace(/[^a-z0-9]/g, "");
export const presetFor = (category) => PRESET[normCat(category)] || DEFAULT;
export const q = (s) => JSON.stringify(String(s ?? ""));
export const numMap = (o) => {
  const r = {};
  if (o && typeof o === "object") {
    for (const [k, v] of Object.entries(o)) {
      const n = Number(v);
      if (Number.isFinite(n)) r[k] = n;
    }
  }
  return r;
};

const isNum = (n) => typeof n === "number" && Number.isFinite(n);

// --- opening hours -----------------------------------------------------------

// The JSON's `opening_hours` as 7 Monday-first days, each {open, close} or null
// (closed). Accepts the 7-entry array, or the legacy single {open, close} window
// meaning "the same every day". Returns null when unset (use the category
// preset). Pushes a message to `errors` for anything malformed and returns null.
export function normalizeOpeningHours(raw, errors, where) {
  if (raw == null) return null;
  const window = (w, day) => {
    if (w === null) return null;
    if (!w || !isNum(w.open) || !isNum(w.close)) {
      errors.push(`${where}: opening_hours day ${day} must be {open, close} numbers or null (closed)`);
      return undefined;
    }
    if (w.open < 0 || w.close > 24 || w.open >= w.close) {
      errors.push(`${where}: opening_hours day ${day} needs 0 <= open < close <= 24 (got ${w.open}–${w.close}); use null for a closed day`);
      return undefined;
    }
    return { open: w.open, close: w.close };
  };
  if (Array.isArray(raw)) {
    if (raw.length !== 7) {
      errors.push(`${where}: opening_hours must have 7 entries Mon→Sun (got ${raw.length})`);
      return null;
    }
    const days = raw.map((w, i) => window(w, i + 1));
    return days.includes(undefined) ? null : days;
  }
  if (typeof raw === "object") {
    const w = window(raw, "all");
    return w === undefined ? null : Array(7).fill(w);
  }
  errors.push(`${where}: opening_hours must be an array of 7 days, a single {open, close}, or null`);
  return null;
}

const fmt = (n) => String(n);
const isAllDay = (w) => w && w.open === 0 && w.close === 24;
const dayLiteral = (w, use) => {
  if (w === null) {
    use.closed = true;
    return "CLOSED";
  }
  if (isAllDay(w)) {
    use.allDay = true;
    return "ALL_DAY";
  }
  use.at = true;
  return `at(${fmt(w.open)}, ${fmt(w.close)})`;
};

// The `program:` literal for 7 normalized days — everyDay(...) when all equal,
// otherwise the explicit Monday-first array.
export function programLiteral(days, use) {
  const same = days.every(
    (w) => (w === null && days[0] === null) || (w && days[0] && w.open === days[0].open && w.close === days[0].close)
  );
  if (same) {
    use.everyDay = true;
    return `everyDay(${dayLiteral(days[0], use)})`;
  }
  return `[${days.map((w) => dayLiteral(w, use)).join(", ")}]`;
}

// The preset's program, as the generator has always emitted it.
export function presetProgramLiteral(preset, use) {
  use.everyDay = true;
  if (preset.allDay) {
    use.allDay = true;
    return "everyDay(ALL_DAY)";
  }
  use.at = true;
  return `everyDay(at(${preset.o}, ${preset.c}))`;
}

// --- vibes & priority ----------------------------------------------------------

// [cultural, foodie, adventurous, relaxing]: each from the JSON's `vibes` when
// set, otherwise from the preset.
export function resolveVibes(raw, preset, errors, where) {
  const v = [...preset.v];
  if (raw == null) return v;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    errors.push(`${where}: vibes must be an object {cultural, foodie, adventurous, relaxing}`);
    return v;
  }
  VIBE_KEYS.forEach((k, i) => {
    if (raw[k] == null) return;
    if (!isNum(raw[k]) || raw[k] < 0 || raw[k] > 10) {
      errors.push(`${where}: vibes.${k} must be a number 0–10 (got ${JSON.stringify(raw[k])})`);
      return;
    }
    v[i] = raw[k];
  });
  return v;
}

// An explicit `priority` wins; otherwise the preset's, raised to >=9 by `top`.
export function resolvePriority(a, preset, errors, where) {
  if (a.priority != null) {
    if (!isNum(a.priority) || a.priority < 0 || a.priority > 10) {
      errors.push(`${where}: priority must be a number 0–10 (got ${JSON.stringify(a.priority)})`);
    } else {
      return a.priority;
    }
  }
  return a.top ? Math.max(preset.p, 9) : preset.p;
}

// --- images --------------------------------------------------------------------

const REQUIRED_CREDIT = ["source", "photoUrl", "author", "license", "licenseUrl"];

// The images the planner may show for one activity, plus the credits the
// /credits page must list. A local /public path needs no credit. A remote image
// is used only with a complete credit — otherwise it is skipped with a warning,
// because showing a CC BY / BY-SA photo without attribution breaks its license.
export function collectImages(a, cityLabel, warnings, where) {
  const urls = [];
  const credits = [];
  const list = Array.isArray(a.images) ? a.images : [];
  for (const im of list) {
    const url = typeof im === "string" ? im : im && typeof im === "object" ? im.url : null;
    if (typeof url !== "string" || !url) {
      warnings.push(`${where}: skipped an image with no url`);
      continue;
    }
    if (url.startsWith("/")) {
      urls.push(url);
      continue;
    }
    const credit = im && typeof im === "object" ? im.credit : null;
    const missing = credit ? REQUIRED_CREDIT.filter((k) => !credit[k]) : REQUIRED_CREDIT;
    if (missing.length) {
      warnings.push(`${where}: skipped remote image without a complete credit (missing ${missing.join(", ")}): ${url}`);
      continue;
    }
    urls.push(url);
    if (credit.attributionRequired !== false) {
      credits.push({
        subject: `${cityLabel} — ${a.name}`,
        author: String(credit.author),
        license: String(credit.license),
        licenseUrl: String(credit.licenseUrl),
        sourceUrl: String(credit.photoUrl),
      });
    }
  }
  return { urls, credits };
}

// --- one activity ----------------------------------------------------------------

export const refFor = (cityId, a) => `${cityId}:${a.id}`;

// One catalogue object literal. Records which helpers it needs in `use`, and
// pushes validation failures to `errors` (the caller refuses to write anything
// if there are any).
export function emitActivity(a, cityId, cityLoc, use, errors) {
  const where = `${cityId} #${a.id ?? "?"} "${a.name}"`;
  const preset = presetFor(a.category);
  const durRaw = Number(a.duration_hours);
  // Minimum activity duration is 1 hour — anything shorter is rounded up to 1h.
  const hours = Math.max(1, Number.isFinite(durRaw) && durRaw > 0 ? durRaw : preset.h);
  const priority = resolvePriority(a, preset, errors, where);
  const loc = a.location && Number.isFinite(Number(a.location.lat)) ? a.location : cityLoc;
  const ages = numMap(a.prices);
  const family = numMap(a.family_prices);
  const adult = a.prices ? Number(a.prices.adult) : NaN;
  const cost = Number.isFinite(adult) ? adult : 0;

  const days = normalizeOpeningHours(a.opening_hours, errors, where);
  const program = days ? programLiteral(days, use) : presetProgramLiteral(preset, use);

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

  const v = resolveVibes(a.vibes, preset, errors, where);
  const lunch = preset.lunch ? " is_lunch: true," : "";
  const best = a.best_time ? q(a.best_time) : "null";
  const emoji = a.emoji ? q(a.emoji) : "null";

  return [
    `  {`,
    `    id: ${a.id ?? "null"},`,
    `    ref: ${q(refFor(cityId, a))},`,
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

// --- generated shared files ------------------------------------------------------

export const HELPERS = `/* eslint-disable */
// -----------------------------------------------------------------------------
// AUTO-GENERATED by scripts/gen-activities.mjs — shared builders + element type
// for the per-city activity catalogues in this folder. Do not edit by hand.
// -----------------------------------------------------------------------------
// Self-contained: imports nothing, so core re-applies the Activity type on import.
export type Window = { open: number; close: number };
export const ALL_DAY: Window = { open: 0, close: 24 };
// Shut that day.
export const CLOSED: Window = { open: 0, close: 0 };
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
  // Stable key "<cityId>:<id>" — ids repeat across cities, so the city is part of
  // it. Editor images are looked up by this (see _images.ts / activityImages.ts).
  ref: string;
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

// The editor-images module: ref -> image paths/URLs, plus the credits to list on
// the /credits page. Keys and credits sorted so re-runs are byte-stable.
export function imagesModule(imagesByRef, credits) {
  const keys = Object.keys(imagesByRef).sort();
  const entries = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(imagesByRef[k])},`).join("\n");
  const sorted = [...credits].sort((x, y) =>
    `${x.subject}\u0000${x.sourceUrl}`.localeCompare(`${y.subject}\u0000${y.sourceUrl}`)
  );
  const creditLines = sorted.map((c) => `  ${JSON.stringify(c)},`).join("\n");
  return `/* eslint-disable */
// -----------------------------------------------------------------------------
// AUTO-GENERATED by scripts/gen-activities.mjs from the \`images\` of each
// takemytrip/data/<city>.json activity. Do not edit by hand — re-run the generator.
// -----------------------------------------------------------------------------
// EDITOR_ACTIVITY_IMAGES: activity ref ("<cityId>:<id>") -> images set in the
// editor. Remote images appear only with a complete credit.
// EDITOR_IMAGE_CREDITS: the credits the /credits page must list for them.
export type EditorImageCredit = {
  subject: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

export const EDITOR_ACTIVITY_IMAGES: Record<string, string[]> = {
${entries}
};

export const EDITOR_IMAGE_CREDITS: EditorImageCredit[] = [
${creditLines}
];
`;
}
