// -----------------------------------------------------------------------------
// Cities (the planner's view of the shared destinations + their activities)
// -----------------------------------------------------------------------------
// Joins the shared destination list (./destinations.data → data/destinations.data)
// with each destination's activity catalogue (data/activities.data.ts). Rome and
// Paris ship with full catalogues; every other destination is scaffolded with an
// empty list (it's still selectable, its areas anchor the distance score, and
// combos/trips fill in once activities are added later).
//
// To give a destination activities: build its list in data/activities.data.ts and
// add it to ACTIVITIES_BY_DESTINATION below, keyed by the destination id.
import type { Activity } from "./activities.functions";
import { ROME_ACTIVITIES, PARIS_ACTIVITIES } from "../../../../data/activities.data";
import { DESTINATIONS, type Destination, type DestArea } from "./destinations.data";

// A selectable start anchor (re-exported under the planner's historical name).
export type Area = DestArea;

// A planner destination = the shared metadata + its activity catalogue.
export type City = Destination & { activities: Activity[] };

// Activity catalogues by destination id. Destinations not listed here are
// scaffolded (empty) — selectable, with working area anchors, but no combos yet.
const ACTIVITIES_BY_DESTINATION: Record<string, Activity[]> = {
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
