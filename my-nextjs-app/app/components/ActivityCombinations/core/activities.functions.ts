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

// Format a distance in km for display, e.g. "0.4 km" or "1.2 km".
export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
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

// Per-key maximum across the whole list = the value of "do everything". Used to
// normalize summed indexes onto a 0–10 scale.
export function maxComboValue(key: NumericKey): number {
  return ACTIVITIES.reduce((s, a) => s + a[key], 0);
}
