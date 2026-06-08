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

// Representative city photos — each city's Wikipedia lead image, served as an
// 800px-wide thumbnail from Wikimedia Commons (free-licensed, hotlinkable via a
// normal browser <img>). Keyed by destination id; a missing id falls back to the
// card's gradient + pin.
const CITY_IMAGES: Record<string, string> = {
  amsterdam:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png/800px-Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png",
  barcelona:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Aerial_view_of_Barcelona%2C_Spain_%2851227309370%29_edited.jpg/800px-Aerial_view_of_Barcelona%2C_Spain_%2851227309370%29_edited.jpg",
  berlin:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Museumsinsel_Berlin_Juli_2021_1_%28cropped%29_b.jpg/800px-Museumsinsel_Berlin_Juli_2021_1_%28cropped%29_b.jpg",
  bucharest:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bucharest_University_Square_%28cropped%29.jpg/800px-Bucharest_University_Square_%28cropped%29.jpg",
  budapest:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/View_from_Gell%C3%A9rt_Hill_to_the_Danube%2C_Hungary_-_Budapest_%2828493220635%29.jpg/800px-View_from_Gell%C3%A9rt_Hill_to_the_Danube%2C_Hungary_-_Budapest_%2828493220635%29.jpg",
  istanbul:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Historical_peninsula_and_modern_skyline_of_Istanbul.jpg/800px-Historical_peninsula_and_modern_skyline_of_Istanbul.jpg",
  krakow:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Krakow_Rynek_Glowny_panorama_2.jpg/800px-Krakow_Rynek_Glowny_panorama_2.jpg",
  lisbon:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Lisboa_-_Portugal_%2852597836992%29.jpg/800px-Lisboa_-_Portugal_%2852597836992%29.jpg",
  london:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/London_Skyline_%28125508655%29.jpeg/800px-London_Skyline_%28125508655%29.jpeg",
  madrid:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Plaza_Mayor_De_Madrid_%28215862629%29_edited.jpeg/800px-Plaza_Mayor_De_Madrid_%28215862629%29_edited.jpeg",
  paris:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/800px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg",
  prague:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Prague_%286365119737%29.jpg/800px-Prague_%286365119737%29.jpg",
  rome:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg/800px-Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg",
  vienna:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Schoenbrunn_philharmoniker_2012.jpg/800px-Schoenbrunn_philharmoniker_2012.jpg",
  warsaw:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Aleja_Niepdleglosci_Warsaw_2022_aerial_%28cropped%29.jpg/800px-Aleja_Niepdleglosci_Warsaw_2022_aerial_%28cropped%29.jpg",
};

export const cityImage = (c: City): string | null => CITY_IMAGES[c.id] ?? null;

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
