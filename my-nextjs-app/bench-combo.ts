import { ACTIVITIES } from "./app/components/ActivityCombinations/core/activities.data";
import { DEFAULT_FILTERS } from "./app/components/ActivityCombinations/core/filters.data";
import { buildCombinations, defaultSelection } from "./app/components/ActivityCombinations/core/filters.functions";
import { scheduleCombo, scheduleEndHour } from "./app/components/ActivityCombinations/core/schedule.functions";
import { planTrip } from "./app/components/ActivityCombinations/core/trip.functions";

const filters = DEFAULT_FILTERS;
const sel = defaultSelection(filters);
const start = 9;
const end = scheduleEndHour(filters, sel, start);
const day = 0;
console.log("ACTIVITIES:", ACTIVITIES.length, "subsets:", 2 ** ACTIVITIES.length);

// 1) buildCombinations only (enumerate + score-sort, no scheduling)
let t0 = performance.now();
const scored = buildCombinations(ACTIVITIES, sel, filters);
let t1 = performance.now();
console.log(`buildCombinations (enumerate + comboScore sort): ${(t1 - t0).toFixed(1)}ms (${scored.length} subsets)`);

// 2) feasibility filter — the scheduleCombo sweep over every subset (1 day)
t0 = performance.now();
const open = scored.filter((c) => scheduleCombo(c, day, start, end).withinHours);
t1 = performance.now();
console.log(`feasibility filter (scheduleCombo over all subsets): ${(t1 - t0).toFixed(1)}ms (kept ${open.length})`);

// 3) whole combos "Calculate" (build + filter), averaged
const N = 5;
t0 = performance.now();
for (let k = 0; k < N; k++) {
  const s = buildCombinations(ACTIVITIES, sel, filters);
  s.filter((c) => scheduleCombo(c, day, start, end).withinHours);
}
t1 = performance.now();
console.log(`>> combos Calculate (1 day) total: ${((t1 - t0) / N).toFixed(1)}ms avg`);

// 4) trip, 3 days, for comparison
const tripDays = [0, 1, 2];
const sels = tripDays.map(() => defaultSelection(filters));
const starts = tripDays.map(() => start);
const ends = tripDays.map((_, i) => scheduleEndHour(filters, sels[i], starts[i]));
planTrip(ACTIVITIES, tripDays, starts, ends, sels, filters); // warm
t0 = performance.now();
const trip = planTrip(ACTIVITIES, tripDays, starts, ends, sels, filters);
t1 = performance.now();
console.log(`>> planTrip (3 days): ${(t1 - t0).toFixed(1)}ms (exact=${trip.exact})`);
