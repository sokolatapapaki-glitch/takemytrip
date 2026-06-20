// -----------------------------------------------------------------------------
// Destinations — shared TYPES + re-export of the cities/regions list
// -----------------------------------------------------------------------------
// The DESTINATIONS literal (and its A/dest builders) now live in
// data/destinations.data.ts (the project-root `data` folder), which imports
// nothing — it's pure data. This module keeps the shared TYPES and RE-EXPORTS
// DESTINATIONS (typed), so BOTH the /start trip-search input and the main planner
// still import the same single source and never drift. A destination is either a
// CITY (sub-selections are its areas/neighbourhoods) or a REGION (sub-selections
// are its cities). Activities are attached per destination in cities.data.ts (the
// planner side); this file is metadata only.
import type { Coords } from "./activities.functions";
import { DESTINATIONS as RAW_DESTINATIONS } from "../../../../data/destinations.data";

// A selectable sub-destination: a city's neighbourhood, or a region's city.
// Its coords are the route anchor when chosen in the planner.
export type DestArea = { id: string; name: string; coords: Coords };

// --- takemytrip destination metadata shapes (mirrored from the source JSON) ---
// These are null on every destination for now; the types are here so they can be
// populated from takemytrip later without further type changes.
export type CityPass = { name: string; description: string; discountPercent: number; url: string };
export type Pass = { name: string; description: string; prices: Record<string, number>; website: string };
export type InfoBoxLink = { text: string; url: string };
export type InfoBox = { color: string; title: string; body: string; links: InfoBoxLink[] };

export type Destination = {
  id: string;
  name: string;
  country: string;
  kind: "city" | "region";
  subLabel: "Areas" | "Cities"; // flyout heading on /start
  center: Coords; // = areas[0].coords (the default anchor); also the takemytrip `location`
  areas: DestArea[]; // areas[0] is the default (centre / main city)
  // Latin/English spellings so the /start search still matches when the user
  // types the English name of a city whose name/country are in Greek.
  aliases?: string[];
  // Extra fields mirrored from the takemytrip JSON, null until populated. The
  // takemytrip `location` is intentionally omitted (it IS `center`), and
  // `activities` are attached separately in cities.data.ts.
  currency: string | null;
  emoji: string | null;
  pricing_model: string | null;
  description: string | null;
  cityPass: CityPass | null;
  passes: Pass[] | null;
  notes: string | null;
  infoBoxes: InfoBox[] | null;
};

// Re-export the data-folder list, typed as the canonical Destination[].
export const DESTINATIONS: Destination[] = RAW_DESTINATIONS;
