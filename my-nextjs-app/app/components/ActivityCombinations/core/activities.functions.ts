// -----------------------------------------------------------------------------
// Activity types + functions
// -----------------------------------------------------------------------------
// Each vibe is an INDEPENDENT 0–10 quality (not opposite ends of one scale), so
// an activity can be high on several at once. See VIBES (in activities.data) —
// it is the single source of truth: add a vibe there + a field here and it flows
// to the filters and the UI automatically.
import { ACTIVITIES, CLOSED } from "./activities.data";

// Opening window for a single day, as 24h decimals (8.5 = 08:30). A day is
// CLOSED when close <= open (use {0,0}); OPEN 24H when open<=0 and close>=24.
export type DayHours = { open: number; close: number };

// A point on the map (WGS84 decimal degrees), used to measure distances.
export type Coords = { lat: number; lng: number };

// Rome's civic centre (Piazza Venezia, near the kilometre-zero point) — the
// default start anchor and the fallback for the active city before any city is
// selected. The route directness + circular loop are measured from the ACTIVE
// city's centre (see activeCenter / setActiveCity).
export const ROME_CENTER: Coords = { lat: 41.8925, lng: 12.4853 };

// -----------------------------------------------------------------------------
// Active city (multi-city support)
// -----------------------------------------------------------------------------
// Two engine-wide values depend on the selected city: the catalogue that
// `maxComboValue` normalizes against ("do everything" in THIS city), and the
// route anchor `activeCenter()`. They live here as module state — mirroring how
// the engine already depended on the global ACTIVITIES — and are set by the UI
// via setActiveCity whenever the chosen city changes (and it resets all per-day
// state, so the active city is stable across any one calculation).
let activeCatalogue: Activity[] = ACTIVITIES;
let activeCenterCoords: Coords = ROME_CENTER;
// Cache of per-key catalogue totals (see maxComboValue). The scoring hot path
// asks for these constantly, so we compute each once per active catalogue and
// reuse it; switching city clears the cache.
const maxComboCache = new Map<NumericKey, number>();

// The chosen traveller party (from the /start hand-off) drives every price total:
// each adult pays the "adult" age-price, each child its own age's price, and a
// matching family bundle wins when it's cheaper (see activityPrice). It's engine
// module state — like activeCatalogue — set by the UI via setActiveParty before
// any scoring. `maxPartyCache` is the active catalogue's total at the active party
// (the budget normaliser); both setActiveCity and setActiveParty clear it.
export type Party = { adults: number; childAges: number[] };
let activeParty: Party = { adults: 1, childAges: [] };
let maxPartyCache: number | null = null;

// Point the engine at a city's catalogue + start anchor. `city` is structurally
// a { center, activities } (the City type lives in cities.data to avoid a
// cycle). `anchor` overrides the route start point with the selected AREA's
// coords; when omitted it falls back to the city centre.
export function setActiveCity(
  city: { center: Coords; activities: Activity[] },
  anchor?: Coords
): void {
  activeCatalogue = city.activities;
  activeCenterCoords = anchor ?? city.center;
  maxComboCache.clear();
  maxPartyCache = null; // the party-price total depends on the catalogue
}

// The active city's fixed start point (route anchor + circular-loop home).
export function activeCenter(): Coords {
  return activeCenterCoords;
}

// --- takemytrip-aligned metadata shapes (carried on every activity) ----------
// Per-age and per-family-type prices (euros), keyed as in the takemytrip JSON
// (e.g. ages: { "0": 0, "adult": 21.5 }, family: { "2_adults_2_children": 84 }).
export type PriceTable = {
  ages: Record<string, number>;
  family: Record<string, number>;
};
// An external link for the activity (the site URL + a display name).
export type WebsiteLink = { url: string; name: string };
// A nearby eatery tied to the activity. `type` distinguishes a sit-down spot
// ("food") from a "cafe". `link` is a maps/website URL.
export type Restaurant = {
  type: "food" | "cafe";
  price: number | null;
  name: string;
  description: string;
  link: string | null;
  emoji: string | null;
};

export type Activity = {
  name: string;
  description: string;
  hours: number; // time needed, in hours
  cost: number; // price in euros
  coords: Coords; // map location (lat/lng), for distances between activities
  program: DayHours[]; // open/close per day, length 7, Mon..Sun
  cultural: number; // 0–10
  foodie: number; // 0–10
  adventurous: number; // 0–10
  relaxing: number; // 0–10
  // How important / must-see this activity is for a typical tourist, 0–10 (10 = a
  // bucket-list landmark like the Colosseum, low = a niche or skippable stop). It
  // is NOT a vibe — it's an intrinsic importance the planner uses to favour
  // including the big sights. Scored by the "Tourist priority" filter (see
  // filters.data / PRIORITY_WEIGHT), which is weighted heavily so high-priority
  // activities win the limited slots in a trip.
  priority: number; // 0–10
  // Optional (foodie activities only): if true, this activity can stand in for
  // the midday lunch break when it's open during the 1–4 PM slot.
  is_lunch?: boolean;
  // --- takemytrip-aligned metadata (null/empty on the hand-authored Rome/Paris
  // catalogues for now; the planner doesn't read these — they're display data).
  // Opening hours stay in `program`; there is no openHour/closeHour field.
  id: number | null;
  prices: PriceTable | null;
  websites: WebsiteLink[];
  googleMapUrl: string | null;
  notes: string[];
  tags: string[];
  best_time: string | null;
  restaurants: Restaurant[];
  emoji: string | null;
};

// The empty defaults for the metadata fields above — so hand-authored and test
// activities can stay valid without repeating the nine null/empty values.
export const EMPTY_ACTIVITY_META: Pick<
  Activity,
  | "id"
  | "prices"
  | "websites"
  | "googleMapUrl"
  | "notes"
  | "tags"
  | "best_time"
  | "restaurants"
  | "emoji"
> = {
  id: null,
  prices: null,
  websites: [],
  googleMapUrl: null,
  notes: [],
  tags: [],
  best_time: null,
  restaurants: [],
  emoji: null,
};

// Independent vibe dimensions — one index each.
export type VibeKey = "cultural" | "foodie" | "adventurous" | "relaxing";

// Any numeric activity field an index can be built from.
export type NumericKey = "hours" | "cost" | "priority" | VibeKey;

// The window for a given day index (0=Mon..6=Sun); closed if out of range.
export function dayHours(a: Activity, day: number): DayHours {
  return a.program[day] ?? CLOSED;
}
export const isClosedDay = (h: DayHours): boolean => h.close <= h.open;
export const isAllDay = (h: DayHours): boolean => h.open <= 0 && h.close >= 24;

// Format a 24h-decimal time as "HH:MM" for display.
export function formatTime(t: number): string {
  const h = Math.floor(t);
  const m = Math.round((t - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Straight-line ("as the crow flies") distance between two points, in km,
// via the haversine formula. Not road/transit distance — see notes when wiring
// real travel time.
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371; // Earth radius in km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Format a distance in km for display, e.g. "0.4 χλμ" or "1.2 χλμ".
export function formatDistance(km: number): string {
  return `${km.toFixed(1)} χλμ`;
}

// Route LINEARITY (Option A — detour ratio): how directly a route progresses
// versus zig-zagging back and forth, as a 0–10 index. It is the straight-line
// first→last distance over the total path length, ×10:
//   10  = perfectly direct (collinear, visited in order, no backtracking)
//   low = lots of doubling back (e.g. go far, then return near the start)
// `path` is the stops in visiting order. Fewer than two points, or a zero-length
// path, is trivially direct → 10.
export function routeLinearity(path: Coords[]): number {
  if (path.length < 2) return 10;
  let pathLength = 0;
  for (let i = 0; i < path.length - 1; i++) {
    pathLength += distanceKm(path[i], path[i + 1]);
  }
  if (pathLength === 0) return 10;
  const endToEnd = distanceKm(path[0], path[path.length - 1]);
  return Math.max(0, Math.min(10, (endToEnd / pathLength) * 10));
}

// Perimeter (km) of the convex hull of a set of points, via Andrew's monotone
// chain on the flat, aspect-correct plane (lng compressed by cos(lat)). The
// shortest CLOSED tour through any point set is never shorter than its convex
// hull, so the hull perimeter is the natural "ideal" a loop is measured against.
function convexHullPerimeter(points: Coords[]): number {
  const n = points.length;
  if (n < 2) return 0;
  if (n === 2) return 2 * distanceKm(points[0], points[1]);

  const meanLat = points.reduce((s, p) => s + p.lat, 0) / n;
  const kx = Math.cos((meanLat * Math.PI) / 180);
  // Carry the original Coords so the perimeter is summed in real km.
  const pts = points
    .map((c) => ({ x: c.lng * kx, y: c.lat, c }))
    .sort((a, b) => a.x - b.x || a.y - b.y);

  type P = (typeof pts)[number];
  const cross = (o: P, a: P, b: P) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const half = (src: P[]): P[] => {
    const h: P[] = [];
    for (const p of src) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop();
      h.push(p);
    }
    return h;
  };

  const lower = half(pts);
  const upper = half(pts.slice().reverse());
  // Drop each half's last point (shared with the other half's first).
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  if (hull.length < 2) return 0;

  let per = 0;
  for (let i = 0; i < hull.length; i++) {
    per += distanceKm(hull[i].c, hull[(i + 1) % hull.length].c);
  }
  return per;
}

// LOOP TIGHTNESS (0–10): for a CLOSED, circular route that starts at `start`
// (the centre of Rome), visits `stops` in order, and returns to `start`, how
// close the loop is to the tightest possible loop around the same points.
//   10  = the order traces the convex hull (no crossings or backtracking — the
//         shortest sensible loop)
//   low = a wandering / self-crossing loop that doubles back
// It is the ideal (hull perimeter) over the actual loop length, ×10 — the
// circular analogue of routeLinearity's directness ratio. Among orderings of the
// SAME stops, maximising it minimises the round-trip distance. Trivially 10 for
// 0–1 stops (the loop is a degenerate out-and-back).
export function loopTightness(start: Coords, stops: Coords[]): number {
  if (stops.length < 2) return 10;
  const pts = [start, ...stops];
  let loop = 0;
  for (let i = 0; i < pts.length - 1; i++) loop += distanceKm(pts[i], pts[i + 1]);
  loop += distanceKm(pts[pts.length - 1], start); // the return-to-start leg
  if (loop === 0) return 10;
  const ideal = convexHullPerimeter(pts);
  return Math.max(0, Math.min(10, (ideal / loop) * 10));
}

// The BEST route linearity achievable for a SET of activities: the highest
// `routeLinearity` over every ordering of its stops (the straightest possible
// path through them). Unlike a single itinerary's linearity, this is a property
// of the SET (order-independent), so it can be used as a scoring index like the
// other filters. Trivially 10 for fewer than 3 stops.
//
// Memoised by the set's identity — the result depends only on the activities'
// fixed coordinates, never on the day/selection, so it's safe to cache forever.
const bestLinearityMemo = new Map<string, number>();
export function bestRouteLinearity(combo: Activity[]): number {
  if (combo.length < 2) return 10;
  const key = combo.map((a) => a.name).slice().sort().join("|");
  const cached = bestLinearityMemo.get(key);
  if (cached !== undefined) return cached;

  const coords = combo.map((a) => a.coords);
  const n = coords.length;
  const used = new Array<boolean>(n).fill(false);
  const path: Coords[] = [];
  let best = 0;
  const visit = () => {
    if (path.length === n) {
      const lin = routeLinearity(path);
      if (lin > best) best = lin;
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(coords[i]);
      visit();
      path.pop();
      used[i] = false;
    }
  };
  visit();

  bestLinearityMemo.set(key, best);
  return best;
}

// Human-readable opening window for a day, e.g. "09:00–19:00", "Open 24h",
// or "Closed".
export function openingHoursFor(a: Activity, day: number): string {
  const h = dayHours(a, day);
  if (isClosedDay(h)) return "Closed";
  if (isAllDay(h)) return "Open 24h";
  return `${formatTime(h.open)}–${formatTime(h.close)}`;
}

// Per-key total across the ACTIVE city's catalogue = the value of "do
// everything" there. Used to normalize summed indexes onto a 0–10 scale, so each
// city is judged against its own catalogue. Cached per active catalogue (the
// scoring loop calls this very frequently); setActiveCity clears the cache.
export function maxComboValue(key: NumericKey): number {
  const cached = maxComboCache.get(key);
  if (cached !== undefined) return cached;
  const total = activeCatalogue.reduce((s, a) => s + a[key], 0);
  maxComboCache.set(key, total);
  return total;
}

// -----------------------------------------------------------------------------
// Traveller-party pricing
// -----------------------------------------------------------------------------
// Point the engine at the chosen party (set from the /start hand-off before any
// scoring). Clears the cached party-price total — it depends on the party.
export function setActiveParty(party: Party): void {
  activeParty = party;
  maxPartyCache = null;
}

export function getActiveParty(): Party {
  return activeParty;
}

// The price one traveller of a given age key pays, falling back to the adult
// price (then 0) when that exact age isn't listed in the table.
function agePrice(table: PriceTable, ageKey: string): number {
  const exact = table.ages[ageKey];
  if (typeof exact === "number") return exact;
  const adult = table.ages.adult;
  return typeof adult === "number" ? adult : 0;
}

// The canonical family-bundle key for a party, e.g. "2_adults_2_children".
function familyKey(party: Party): string {
  return `${party.adults}_adults_${party.childAges.length}_children`;
}

// The 1-adult price of an activity — what the activity cards display. Falls back
// to the flat `cost` when the activity has no price table.
export function adultPrice(a: Activity): number {
  return a.prices ? agePrice(a.prices, "adult") : a.cost;
}

// What `party` pays for ONE activity: the cheaper of (a) summing each member's
// age-price and (b) the matching family bundle, when one exists. An activity with
// no price table falls back to its flat `cost` (party-independent).
export function activityPrice(a: Activity, party: Party = activeParty): number {
  if (!a.prices) return a.cost;
  let sum = party.adults * agePrice(a.prices, "adult");
  for (const age of party.childAges) sum += agePrice(a.prices, String(age));
  const bundle = a.prices.family[familyKey(party)];
  return typeof bundle === "number" && bundle > 0 ? Math.min(sum, bundle) : sum;
}

// Total the active party pays across the ACTIVE city's catalogue — the cost-budget
// analogue of maxComboValue, used to normalise the budget index onto 0–10. Cached
// per (active catalogue × active party); setActiveCity / setActiveParty clear it.
export function maxPartyPrice(): number {
  if (maxPartyCache !== null) return maxPartyCache;
  maxPartyCache = activeCatalogue.reduce((s, a) => s + activityPrice(a, activeParty), 0);
  return maxPartyCache;
}
