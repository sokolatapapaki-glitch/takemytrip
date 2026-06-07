// -----------------------------------------------------------------------------
// Activities Enlist page data helpers
// -----------------------------------------------------------------------------
// Adapters over the planner's data (cities.data / activities.functions) for the
// /activities list: city lookup by id, a reference point for the "distance from
// center" sort (a chosen area, default the city centre), the price-slider bound,
// and the shared filter+sort used by the grid. Vibe display helpers (stars,
// emoji) are reused from the map page so the two pages stay consistent.
import {
  CITIES,
  type City,
} from "@/app/components/ActivityCombinations/core/cities.data";
import {
  distanceKm,
  type Activity,
  type Coords,
  type VibeKey,
} from "@/app/components/ActivityCombinations/core/activities.functions";
import { starsOf } from "@/app/map/components/mapData";

export const getCityById = (id: string | null): City | undefined =>
  id ? CITIES.find((c) => c.id === id) : undefined;

// The point the "distance from center" sort measures from: the selected area, or
// the city centre by default (areas[0] === center).
export function referenceCoords(city: City, areaId: string | null): Coords {
  if (areaId) {
    const area = city.areas.find((a) => a.id === areaId);
    if (area) return area.coords;
  }
  return city.center;
}

// Price-slider upper bound: the dearest activity in this city (fallback 100).
export const priceMaxFor = (city: City): number =>
  city.activities.reduce((m, a) => Math.max(m, a.cost), 0) || 100;

export type ActSortKey = "stars" | "price" | "distance";
export const ACT_SORT_LABELS: Record<ActSortKey, string> = {
  stars: "Stars",
  price: "Price",
  distance: "Distance from center",
};

export type ActivityListFilters = {
  query: string;
  vibes: VibeKey[]; // multi-select; empty = all vibes
  priceMax: number | null; // null = no cap
  areaId: string | null; // distance reference area; null = city centre
  sortBy: ActSortKey;
};

export const DEFAULT_ACT_FILTERS: ActivityListFilters = {
  query: "",
  vibes: [],
  priceMax: null,
  areaId: null,
  sortBy: "stars",
};

// One filter+sort for the grid. A vibe selection keeps activities that lean
// (dimension ≥ 4) into AT LEAST ONE selected vibe ("show any of these vibes").
export function filterAndSortActivities(
  city: City,
  f: ActivityListFilters
): Activity[] {
  const q = f.query.trim().toLowerCase();
  const ref = referenceCoords(city, f.areaId);

  const list = city.activities.filter((a) => {
    if (
      q &&
      !a.name.toLowerCase().includes(q) &&
      !a.description.toLowerCase().includes(q)
    )
      return false;
    if (f.priceMax != null && a.cost > f.priceMax) return false;
    if (f.vibes.length > 0 && !f.vibes.some((v) => a[v] >= 4)) return false;
    return true;
  });

  return [...list].sort((a, b) => {
    switch (f.sortBy) {
      case "price":
        return a.cost - b.cost;
      case "distance":
        return distanceKm(a.coords, ref) - distanceKm(b.coords, ref);
      case "stars":
      default:
        return starsOf(b) - starsOf(a);
    }
  });
}
