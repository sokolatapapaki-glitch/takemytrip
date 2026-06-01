// -----------------------------------------------------------------------------
// Activity data (the catalogue, vibe list, day labels)
// -----------------------------------------------------------------------------
// The object/array literals for activities. Types and helper functions live in
// activities.functions. The small private builders below (at/everyDay/…) only
// construct the ACTIVITIES literal, so they stay with the data they build.
import type { Activity, DayHours, VibeKey } from "./activities.functions";

// Days of the week, Monday-first. A `program` holds one entry per day IN THIS
// ORDER (index 0 = Mon … 6 = Sun).
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// --- program helpers ---------------------------------------------------------
export const CLOSED: DayHours = { open: 0, close: 0 }; // shut that day
const ALL_DAY: DayHours = { open: 0, close: 24 }; // open round the clock
const at = (open: number, close: number): DayHours => ({ open, close });
// Same window every day of the week.
const everyDay = (h: DayHours): DayHours[] => Array<DayHours>(7).fill(h);
// Mon–Sat one window, Sunday another (e.g. shorter or closed).
const weekdaysThenSun = (week: DayHours, sun: DayHours): DayHours[] => [
  week, week, week, week, week, week, sun,
];

export const VIBES: { key: VibeKey; name: string }[] = [
  { key: "cultural", name: "Cultural" },
  { key: "foodie", name: "Foodie" },
  { key: "adventurous", name: "Adventurous" },
  { key: "relaxing", name: "Relaxing" },
];

export const ACTIVITIES: Activity[] = [
  // Open daily 08:30–19:00 year-round.
  { name: "Colosseum & Roman Forum", description: "Tour the ancient arena and the ruins of the old city centre.", hours: 3, cost: 18, coords: { lat: 41.8902, lng: 12.4922 }, program: everyDay(at(8.5, 19)), cultural: 9, foodie: 0, adventurous: 4, relaxing: 2 },
  // Mon–Sat 09:00–18:00; CLOSED on Sundays (and most religious holidays).
  { name: "Vatican Museums & Sistine Chapel", description: "Walk the galleries up to Michelangelo's ceiling.", hours: 4, cost: 20, coords: { lat: 41.9065, lng: 12.4536 }, program: weekdaysThenSun(at(9, 18), CLOSED), cultural: 10, foodie: 0, adventurous: 2, relaxing: 1 },
  // Open every day 07:00–19:00.
  { name: "St. Peter's Basilica", description: "Visit the basilica and climb the dome for city views.", hours: 2, cost: 0, coords: { lat: 41.9022, lng: 12.4539 }, program: everyDay(at(7, 19)), cultural: 8, foodie: 0, adventurous: 3, relaxing: 3 },
  // A public square fountain — open 24 hours, every day.
  { name: "Trevi Fountain", description: "See the baroque fountain and toss a coin.", hours: 1, cost: 0, coords: { lat: 41.9009, lng: 12.4833 }, program: everyDay(ALL_DAY), cultural: 5, foodie: 0, adventurous: 1, relaxing: 4 },
  // Mon–Sat 09:00–19:00, shorter on Sunday (09:00–18:00).
  { name: "Pantheon", description: "Step inside the best-preserved Roman temple.", hours: 1, cost: 5, coords: { lat: 41.8986, lng: 12.4769 }, program: weekdaysThenSun(at(9, 19), at(9, 18)), cultural: 8, foodie: 0, adventurous: 1, relaxing: 4 },
  // Evening tour 17:00–21:00; CLOSED on Mondays. Flagged as a lunch option, but
  // it only opens in the evening so it won't qualify for the midday slot.
  { name: "Trastevere food tour", description: "Guided tasting through the cobbled old quarter.", hours: 3, cost: 55, coords: { lat: 41.8893, lng: 12.4699 }, program: [CLOSED, at(17, 21), at(17, 21), at(17, 21), at(17, 21), at(17, 21), at(17, 21)], cultural: 4, foodie: 10, adventurous: 3, relaxing: 5, is_lunch: true },
  // Gelaterie and coffee bars: open daily 11:00–23:30 — open over midday, so it
  // can serve as the lunch slot.
  { name: "Gelato & espresso tasting", description: "Sample classic Roman gelaterie and coffee bars.", hours: 1, cost: 25, coords: { lat: 41.9003, lng: 12.4759 }, program: everyDay(at(11, 23.5)), cultural: 2, foodie: 9, adventurous: 1, relaxing: 7, is_lunch: true },
  // Park + bike rental 09:00–19:00 daily; rental CLOSED on Mondays.
  { name: "Villa Borghese bike ride", description: "Rent a bike and loop the city's big central park.", hours: 2, cost: 12, coords: { lat: 41.9142, lng: 12.4923 }, program: [CLOSED, at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19), at(9, 19)], cultural: 2, foodie: 1, adventurous: 8, relaxing: 6 },
];
