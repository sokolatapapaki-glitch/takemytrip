// -----------------------------------------------------------------------------
// Activity data + types
// -----------------------------------------------------------------------------
// Each vibe is an INDEPENDENT 0–10 quality (not opposite ends of one scale), so
// an activity can be high on several at once. See VIBES below — it is the single
// source of truth: add a vibe there + a field here and it flows to the filters
// and the UI automatically.
export type Activity = {
  name: string;
  description: string;
  hours: number; // time needed, in hours
  cost: number; // price in euros
  cultural: number; // 0–10
  foodie: number; // 0–10
  adventurous: number; // 0–10
  relaxing: number; // 0–10
};

// Independent vibe dimensions — one index each.
export type VibeKey = "cultural" | "foodie" | "adventurous" | "relaxing";

export const VIBES: { key: VibeKey; name: string }[] = [
  { key: "cultural", name: "Cultural" },
  { key: "foodie", name: "Foodie" },
  { key: "adventurous", name: "Adventurous" },
  { key: "relaxing", name: "Relaxing" },
];

// Any numeric activity field an index can be built from.
export type NumericKey = "hours" | "cost" | VibeKey;

export const ACTIVITIES: Activity[] = [
  { name: "Colosseum & Roman Forum", description: "Tour the ancient arena and the ruins of the old city centre.", hours: 3, cost: 18, cultural: 9, foodie: 0, adventurous: 4, relaxing: 2 },
  { name: "Vatican Museums & Sistine Chapel", description: "Walk the galleries up to Michelangelo's ceiling.", hours: 4, cost: 20, cultural: 10, foodie: 0, adventurous: 2, relaxing: 1 },
  { name: "St. Peter's Basilica", description: "Visit the basilica and climb the dome for city views.", hours: 2, cost: 0, cultural: 8, foodie: 0, adventurous: 3, relaxing: 3 },
  { name: "Trevi Fountain", description: "See the baroque fountain and toss a coin.", hours: 1, cost: 0, cultural: 5, foodie: 0, adventurous: 1, relaxing: 4 },
  { name: "Pantheon", description: "Step inside the best-preserved Roman temple.", hours: 1, cost: 5, cultural: 8, foodie: 0, adventurous: 1, relaxing: 4 },
  { name: "Trastevere food tour", description: "Guided tasting through the cobbled old quarter.", hours: 3, cost: 55, cultural: 4, foodie: 10, adventurous: 3, relaxing: 5 },
  { name: "Gelato & espresso tasting", description: "Sample classic Roman gelaterie and coffee bars.", hours: 1, cost: 25, cultural: 2, foodie: 9, adventurous: 1, relaxing: 7 },
  { name: "Villa Borghese bike ride", description: "Rent a bike and loop the city's big central park.", hours: 2, cost: 12, cultural: 2, foodie: 1, adventurous: 8, relaxing: 6 },
];

// Per-key maximum across the whole list = the value of "do everything". Used to
// normalize summed indexes onto a 0–10 scale.
export function maxComboValue(key: NumericKey): number {
  return ACTIVITIES.reduce((s, a) => s + a[key], 0);
}
