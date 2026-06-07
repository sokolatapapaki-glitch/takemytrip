// -----------------------------------------------------------------------------
// Cities page data helpers
// -----------------------------------------------------------------------------
// Thin adapters over the planner's destinations (cities.data) for the /cities
// grid: short descriptions, a price proxy (avg activity cost), distance from
// Athens, and the shared search+sort used by the grid.
import {
  CITIES,
  type City,
} from "@/app/components/ActivityCombinations/core/cities.data";
import { distanceKm } from "@/app/components/ActivityCombinations/core/activities.functions";

// Athens — the fixed reference point for the "distance from Athens" sort.
export const ATHENS = { lat: 37.9838, lng: 23.7275 };

// Short blurbs per destination (no description field exists on Destination yet).
const CITY_DESCRIPTIONS: Record<string, string> = {
  rome: "Ancient ruins, Renaissance art and timeless piazzas.",
  paris: "Iconic boulevards, world-class museums and café culture.",
  barcelona: "Gaudí landmarks, golden beaches and buzzing tapas bars.",
  amsterdam: "Canals, bikes and Golden-Age art galleries.",
  london: "Royal landmarks, lively markets and endless museums.",
  sicily: "Volcanoes, baroque towns and Mediterranean flavours.",
  tuscany: "Rolling vineyards, hill towns and Renaissance cities.",
  andalusia: "Moorish palaces, flamenco and sun-baked plazas.",
  "amalfi-coast": "Cliffside villages above a sparkling turquoise sea.",
};

export const cityDescription = (c: City): string =>
  CITY_DESCRIPTIONS[c.id] ?? `Explore ${c.name}, ${c.country}.`;

// Distance from Athens in km (rounded) — the basis for the flight-time estimate
// and the flight-time sort.
export const distanceFromAthens = (c: City): number =>
  Math.round(distanceKm(c.center, ATHENS));

// Rough flight time from Athens: cruise at ~800 km/h plus a ~30 min fixed
// allowance for taxi/takeoff/landing. Returns total minutes + a "2h 15m" label.
export function flightTimeFromAthens(c: City): { minutes: number; label: string } {
  const minutes = Math.round((distanceFromAthens(c) / 800) * 60 + 30);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return { minutes, label: h > 0 ? `${h}h ${m}m` : `${m}m` };
}

// A price index (not a number): the average activity cost bucketed into tiers.
// null when a city has no activities yet (placeholder until destinations carry
// their own pricing).
export type PriceTier = "Low" | "Medium" | "High";
export function cityPriceTier(c: City): PriceTier | null {
  if (c.activities.length === 0) return null;
  const avg = c.activities.reduce((s, a) => s + a.cost, 0) / c.activities.length;
  if (avg <= 12) return "Low";
  if (avg <= 22) return "Medium";
  return "High";
}
const TIER_RANK: Record<PriceTier, number> = { Low: 0, Medium: 1, High: 2 };

export type CitySortKey = "name" | "price" | "flight";
export const CITY_SORT_LABELS: Record<CitySortKey, string> = {
  name: "Name (A–Z)",
  price: "Price",
  flight: "Flight time from Athens",
};

// Search (by name or country) + sort. Cities without a price tier sort to the
// end of the price ordering rather than pretending to be cheap.
export function filterAndSortCities(query: string, sortBy: CitySortKey): City[] {
  const q = query.trim().toLowerCase();
  const list = CITIES.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
  );
  return [...list].sort((a, b) => {
    switch (sortBy) {
      case "price": {
        const ta = cityPriceTier(a);
        const tb = cityPriceTier(b);
        return (ta ? TIER_RANK[ta] : Infinity) - (tb ? TIER_RANK[tb] : Infinity);
      }
      case "flight":
        return flightTimeFromAthens(a).minutes - flightTimeFromAthens(b).minutes;
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });
}
