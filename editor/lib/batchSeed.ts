import type { CityFile } from "./types";

// Plan 1, Part A — curated new activities (important + kid-friendly) that aren't in
// the catalogue yet. { city, name }; the workflow generates everything else. Verified
// not already present as of 2026-08. Editable in the batch console before running.
export const BATCH_SEED: { city: string; name: string }[] = [
  // Barcelona
  { city: "barcelona", name: "Zoo de Barcelona" },
  { city: "barcelona", name: "Poble Espanyol" },
  // Amsterdam
  { city: "amsterdam", name: "Het Scheepvaartmuseum" },
  { city: "amsterdam", name: "Micropia" },
  { city: "amsterdam", name: "TunFun Speelpark" },
  // Rome
  { city: "rome", name: "Time Elevator Roma" },
  { city: "rome", name: "Zoomarine Roma" },
  { city: "rome", name: "Rainbow MagicLand" },
  // London
  { city: "london", name: "London Transport Museum" },
  { city: "london", name: "Kew Gardens" },
  { city: "london", name: "Cutty Sark" },
  // Madrid (Zoo Aquarium / Faunia / Parque Warner already exist)
  { city: "madrid", name: "Palacio Real de Madrid" },
  { city: "madrid", name: "Aquópolis Villanueva de la Cañada" },
  // Berlin (Zoo / Naturkunde / Legoland already exist)
  { city: "berlin", name: "Brandenburger Tor" },
  { city: "berlin", name: "Little BIG City Berlin" },
  // Prague (Zoo Praha already exists)
  { city: "prague", name: "Petřín Lookout Tower" },
  { city: "prague", name: "National Technical Museum Prague" },
];

// The one new city (Eurozone, family-rich). Swappable.
export const NEW_CITY_ID = "munich";
export const NEW_CITY_HEADER: Omit<CityFile, "activities"> = {
  city: "Μόναχο",
  country: "Γερμανία",
  currency: "EUR",
  emoji: "🥨",
  pricing_model: "per_age",
  description: "",
  location: { lat: 48.1351, lng: 11.582 },
};
export const NEW_CITY_NAMES: string[] = [
  "Deutsches Museum",
  "Tierpark Hellabrunn",
  "Englischer Garten",
  "Sea Life München",
  "BMW Welt & Museum",
  "Bavaria Filmstadt",
  "Olympiapark München",
  "Nymphenburg Palace",
  "Marienplatz & Glockenspiel",
  "Botanischer Garten München",
  "Deutsches Museum Verkehrszentrum",
];

// The full default batch: existing-city additions + the new city's activities.
export const DEFAULT_BATCH: { city: string; name: string }[] = [
  ...BATCH_SEED,
  ...NEW_CITY_NAMES.map((name) => ({ city: NEW_CITY_ID, name })),
];
