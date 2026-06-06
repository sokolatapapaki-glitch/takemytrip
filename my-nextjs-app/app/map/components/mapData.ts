// -----------------------------------------------------------------------------
// Map page data helpers
// -----------------------------------------------------------------------------
// Thin adapters over the planner's existing data (cities.data / activities.
// functions) for the /map experience: the four vibe dimensions as buttons, an
// activity → city lookup, display helpers (stars, price, "best for"), and the
// shared filter/sort used by BOTH the sidebar results and the map markers.
import {
  CITIES,
  ALL_ACTIVITIES,
  type City,
} from "@/app/components/ActivityCombinations/core/cities.data";
import {
  distanceKm,
  type Activity,
  type VibeKey,
} from "@/app/components/ActivityCombinations/core/activities.functions";

// The 4 "Vibe" buttons on the map = the 4 activity vibe dimensions.
export const VIBES: { key: VibeKey; label: string; emoji: string }[] = [
  { key: "cultural", label: "Cultural", emoji: "🏛️" },
  { key: "foodie", label: "Foodie", emoji: "🍽️" },
  { key: "adventurous", label: "Adventurous", emoji: "🧭" },
  { key: "relaxing", label: "Relaxing", emoji: "🌿" },
];

// Activity → its city. Activity names are unique across the app, so a flat map is
// safe (same assumption ALL_ACTIVITIES relies on).
const CITY_OF = new Map<string, City>();
for (const c of CITIES) for (const a of c.activities) CITY_OF.set(a.name, c);
export const cityOf = (a: Activity): City | null => CITY_OF.get(a.name) ?? null;

// All cities (shown as map markers when zoomed out — "show all cities").
export const ALL_CITIES = CITIES;

// Price slider bound: the dearest activity (fallback 100 if none have a cost).
export const PRICE_MAX = ALL_ACTIVITIES.reduce((m, a) => Math.max(m, a.cost), 0) || 100;

// Stars/5 — no rating field exists, so derive a placeholder from `priority`
// (0–10 → 0–5). Replace once a real rating is added to the Activity model.
export const starsOf = (a: Activity): number => Math.round((a.priority / 2) * 10) / 10;

// The activity's strongest vibe dimension ("Best for:" + marker glyph).
export const bestVibe = (a: Activity) =>
  VIBES.reduce((best, v) => (a[v.key] > a[best.key] ? v : best), VIBES[0]);
export const emojiOf = (a: Activity): string => bestVibe(a).emoji;

export type SortKey = "priority" | "price" | "vibe" | "distance";
export const SORT_LABELS: Record<SortKey, string> = {
  priority: "Top picks",
  price: "Price",
  vibe: "Vibe match",
  distance: "Distance",
};

export type ActivityFilters = {
  query: string;
  vibe: VibeKey | null;
  priceMax: number | null; // null = no cap
  maxDistanceKm: number | null; // distance from the activity's city centre
  sortBy: SortKey;
};

export const DEFAULT_FILTERS: ActivityFilters = {
  query: "",
  vibe: null,
  priceMax: null,
  maxDistanceKm: null,
  sortBy: "priority",
};

// Distance of an activity from its own city's centre (0 if city unknown).
export function distanceFromCenter(a: Activity): number {
  const c = cityOf(a);
  return c ? distanceKm(a.coords, c.center) : 0;
}

// The single filter+sort used by the results list AND the map markers, so the
// two always agree. A selected vibe keeps activities that lean that way
// (dimension ≥ 4) — "show mostly that vibe".
export function filterAndSort(f: ActivityFilters): Activity[] {
  const q = f.query.trim().toLowerCase();
  let list = ALL_ACTIVITIES.filter((a) => {
    if (q && !a.name.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q))
      return false;
    if (f.priceMax != null && a.cost > f.priceMax) return false;
    if (f.vibe && a[f.vibe] < 4) return false;
    if (f.maxDistanceKm != null && distanceFromCenter(a) > f.maxDistanceKm) return false;
    return true;
  });

  list = [...list].sort((a, b) => {
    switch (f.sortBy) {
      case "price":
        return a.cost - b.cost;
      case "distance":
        return distanceFromCenter(a) - distanceFromCenter(b);
      case "vibe":
        return f.vibe ? b[f.vibe] - a[f.vibe] : b.priority - a.priority;
      case "priority":
      default:
        return b.priority - a.priority;
    }
  });
  return list;
}
