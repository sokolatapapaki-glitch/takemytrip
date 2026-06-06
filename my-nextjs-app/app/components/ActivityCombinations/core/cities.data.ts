// -----------------------------------------------------------------------------
// Cities (the planner's view of the shared destinations + their activities)
// -----------------------------------------------------------------------------
// The list of selectable destinations (cities + regions) and their start areas
// lives in destinations.data.ts — the single source shared with the /start
// input. THIS file is the planner side: it attaches each destination's activity
// catalogue. Rome and Paris ship with full catalogues; every other destination
// is scaffolded with an empty list (it's still selectable, its areas anchor the
// distance score, and combos/trips fill in once activities are added later).
//
// To give a destination activities: build its list like PARIS_ACTIVITIES below
// and add it to ACTIVITIES_BY_DESTINATION, keyed by the destination id.
import type { Activity } from "./activities.functions";
import { ACTIVITIES, CLOSED } from "./activities.data";
import { DESTINATIONS, type Destination, type DestArea } from "./destinations.data";

// A selectable start anchor (re-exported under the planner's historical name).
export type Area = DestArea;

// A planner destination = the shared metadata + its activity catalogue.
export type City = Destination & { activities: Activity[] };

// --- program helpers (local — same shape as activities.data's private ones) --
const ALL_DAY = { open: 0, close: 24 };
const at = (open: number, close: number) => ({ open, close });
const everyDay = (h: { open: number; close: number }) => Array(7).fill(h);
const weekdaysThenSun = (
  week: { open: number; close: number },
  sun: { open: number; close: number }
) => [week, week, week, week, week, week, sun];

// -----------------------------------------------------------------------------
// Paris — 10 activities (same object shape as Rome's). Three midday-open foodie
// spots are flagged is_lunch so the lunch mechanic keeps working.
// -----------------------------------------------------------------------------
const PARIS_ACTIVITIES: Activity[] = [
  { name: "Eiffel Tower", description: "Ride to the top of Paris's iron icon for sweeping city views.", hours: 2.5, cost: 28, coords: { lat: 48.8584, lng: 2.2945 }, program: everyDay(at(9.5, 23)), cultural: 7, foodie: 0, adventurous: 6, relaxing: 3, priority: 10 },
  { name: "Louvre Museum", description: "The world's largest art museum, from the Mona Lisa to antiquities.", hours: 4, cost: 17, coords: { lat: 48.8606, lng: 2.3376 }, program: [at(9, 18), CLOSED, at(9, 18), at(9, 18), at(9, 18), at(9, 18), at(9, 18)], cultural: 10, foodie: 0, adventurous: 1, relaxing: 2, priority: 10 },
  { name: "Notre-Dame & Île de la Cité", description: "Walk the medieval island around the great cathedral.", hours: 1.5, cost: 0, coords: { lat: 48.8530, lng: 2.3499 }, program: everyDay(ALL_DAY), cultural: 9, foodie: 0, adventurous: 2, relaxing: 4, priority: 9 },
  { name: "Musée d'Orsay", description: "Impressionist masterpieces in a grand former railway station.", hours: 3, cost: 16, coords: { lat: 48.8600, lng: 2.3266 }, program: [CLOSED, at(9.5, 18), at(9.5, 18), at(9.5, 18), at(9.5, 18), at(9.5, 18), at(9.5, 18)], cultural: 10, foodie: 0, adventurous: 1, relaxing: 3, priority: 8 },
  { name: "Montmartre & Sacré-Cœur", description: "Climb the artists' hill to the white basilica and its views.", hours: 2, cost: 0, coords: { lat: 48.8867, lng: 2.3431 }, program: everyDay(ALL_DAY), cultural: 7, foodie: 2, adventurous: 4, relaxing: 6, priority: 9 },
  { name: "Sainte-Chapelle", description: "A jewel-box chapel wrapped in towering stained glass.", hours: 1, cost: 11, coords: { lat: 48.8554, lng: 2.3450 }, program: everyDay(at(9, 17)), cultural: 8, foodie: 0, adventurous: 1, relaxing: 4, priority: 7 },
  { name: "Latin Quarter food walk", description: "Taste crêpes, cheese and wine through the old student quarter.", hours: 2, cost: 38, coords: { lat: 48.8499, lng: 2.3470 }, program: weekdaysThenSun(at(11, 15), CLOSED), cultural: 4, foodie: 9, adventurous: 3, relaxing: 5, priority: 5, is_lunch: true },
  { name: "Le Marais café & falafel", description: "Famous falafel and cosy cafés in the historic Marais.", hours: 2, cost: 25, coords: { lat: 48.8571, lng: 2.3590 }, program: everyDay(at(11, 16)), cultural: 3, foodie: 9, adventurous: 2, relaxing: 5, priority: 5, is_lunch: true },
  { name: "Luxembourg Gardens", description: "Relax by the fountains in Paris's most elegant park.", hours: 1.5, cost: 0, coords: { lat: 48.8462, lng: 2.3372 }, program: everyDay(at(8, 18)), cultural: 3, foodie: 0, adventurous: 2, relaxing: 9, priority: 6 },
  { name: "Macaron & pâtisserie tasting", description: "Sample macarons and pastries at storied Paris patisseries.", hours: 1, cost: 22, coords: { lat: 48.8540, lng: 2.3340 }, program: everyDay(at(10, 19)), cultural: 2, foodie: 9, adventurous: 1, relaxing: 7, priority: 5, is_lunch: true },
];

// Activity catalogues by destination id. Destinations not listed here are
// scaffolded (empty) — selectable, with working area anchors, but no combos yet.
const ACTIVITIES_BY_DESTINATION: Record<string, Activity[]> = {
  rome: ACTIVITIES,
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
