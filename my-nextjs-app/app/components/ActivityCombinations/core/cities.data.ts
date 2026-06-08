// -----------------------------------------------------------------------------
// Cities (the planner's view of the shared destinations + their activities)
// -----------------------------------------------------------------------------
// Joins the shared destination list (./destinations.data → data/destinations.data)
// with each destination's activity catalogue. Rome and Paris use the hand-curated
// catalogues in data/activities.data.ts; the other 13 cities use the catalogues
// generated from takemytrip JSON in data/activities/<city>.data.ts (aggregated by
// data/activities/index.ts — see scripts/gen-activities.mjs). Any destination not
// found in either is scaffolded with an empty list.
//
// To regenerate the JSON-derived catalogues: `node scripts/gen-activities.mjs`.
// Curated Rome/Paris are listed explicitly below so they win over any generated
// entry of the same id.
import type { Activity } from "./activities.functions";
import { ROME_ACTIVITIES, PARIS_ACTIVITIES } from "../../../../data/activities.data";
import { GENERATED_ACTIVITIES_BY_DESTINATION } from "../../../../data/activities/index";
import { DESTINATIONS, type Destination, type DestArea } from "./destinations.data";

// A selectable start anchor (re-exported under the planner's historical name).
export type Area = DestArea;

// A planner destination = the shared metadata + its activity catalogue.
export type City = Destination & { activities: Activity[] };

// Activity catalogues by destination id: the generated catalogues for the 13
// JSON-derived cities, with curated Rome/Paris layered on top. Destinations not
// present in either are scaffolded (empty) — selectable, with working area
// anchors, but no combos yet.
const ACTIVITIES_BY_DESTINATION: Record<string, Activity[]> = {
  ...GENERATED_ACTIVITIES_BY_DESTINATION,
  rome: ROME_ACTIVITIES,
  paris: PARIS_ACTIVITIES,
};

// The planner's destinations: the shared list, each with its activity catalogue.
export const CITIES: City[] = DESTINATIONS.map((d) => ({
  ...d,
  activities: ACTIVITIES_BY_DESTINATION[d.id] ?? [],
}));

export const ROME: City = CITIES.find((c) => c.id === "rome")!;
export const PARIS: City = CITIES.find((c) => c.id === "paris")!;
export const DEFAULT_CITY: City = ROME;

// Every activity across all destinations — for name→coords / name→activity
// lookups (names are unique, so a single flat map is city-agnostic).
export const ALL_ACTIVITIES: Activity[] = CITIES.flatMap((c) => c.activities);
