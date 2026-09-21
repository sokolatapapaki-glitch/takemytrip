// -----------------------------------------------------------------------------
// Activity catalogues (DATA ONLY)
// -----------------------------------------------------------------------------
// The hand-authored Paris catalogue (PARIS_ACTIVITIES). Rome now lives alongside
// the other per-city catalogues in data/activities/rome.data.ts (curated, but in
// the activities folder); this file keeps only Paris. Types and the planner's
// functions live in app/components/ActivityCombinations/core. The small builders
// below (at/everyDay/…) only construct these literals, so they stay with the data
// they build. Consumed by core/cities.data.ts, which re-exports PARIS_ACTIVITIES
// under its historical name so every existing import keeps working.
// Self-contained: this file imports NOTHING so it never participates in the
// planner's type/value module graph. The core re-applies the `Activity` type when
// it imports these catalogues (see core/activities.data.ts + core/cities.data.ts).

// An opening window for a single day (matches the planner's DayHours shape).
type Window = { open: number; close: number };

// --- program helpers (construct the catalogue literals below) ----------------
const CLOSED: Window = { open: 0, close: 0 }; // shut that day
const ALL_DAY: Window = { open: 0, close: 24 }; // open round the clock
const at = (open: number, close: number): Window => ({ open, close });
// Same window every day of the week.
const everyDay = (h: Window): Window[] => Array<Window>(7).fill(h);
// Mon–Sat one window, Sunday another (e.g. shorter or closed).
const weekdaysThenSun = (week: Window, sun: Window): Window[] => [
  week, week, week, week, week, week, sun,
];

// Derive a per-age + per-family price table from the single `cost` (treated as
// the adult price): under-6 free, ages 6–17 at 60% of the adult price (rounded),
// 18+ the full price, plus a sample "2 adults + 2 children" family bundle at 85%
// of summing those four (so it's the cheaper option for that party). A free
// activity (cost 0) gets an all-zero table and no family bundle. Used for Paris,
// whose entries carry only a flat `cost`.
const derivePrices = (cost: number) => {
  const adult = cost;
  const child = Math.round(cost * 0.6);
  const ages: Record<string, number> = {};
  for (let a = 0; a <= 5; a++) ages[String(a)] = 0;
  for (let a = 6; a <= 17; a++) ages[String(a)] = child;
  ages.adult = adult;
  const family: Record<string, number> =
    cost > 0 ? { "2_adults_2_children": Math.round((2 * adult + 2 * child) * 0.85) } : {};
  return { ages, family };
};

// Attach the takemytrip-aligned metadata to a hand-authored catalogue entry
// (Paris): `prices` is derived from its `cost` (see derivePrices); the rest stay
// empty/null. Fresh arrays per call so no two entries share the same empty array
// reference. The core re-applies the Activity type on import.
const withMeta = <T extends { cost: number }>(a: T) => ({
  ...a,
  id: null,
  prices: derivePrices(a.cost),
  websites: [],
  googleMapUrl: null,
  notes: [],
  tags: [],
  best_time: null,
  restaurants: [],
  emoji: null,
});

// -----------------------------------------------------------------------------
// Paris — 10 activities (flat `cost`, metadata derived via withMeta). Three
// midday-open foodie spots are flagged is_lunch so the lunch mechanic keeps
// working.
// -----------------------------------------------------------------------------
const PARIS_BASE = [
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

// Public catalogues. Rome ships full JSON metadata above; Paris's hand-authored
// entries carry the empty/derived takemytrip-aligned metadata via withMeta.
export const PARIS_ACTIVITIES = PARIS_BASE.map((a) => withMeta(a));
