// Unit tests for the scoring / combination logic (filters.functions).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  comboScore,
  scoreBreakdown,
  buildCombinations,
  defaultSelection,
  targetIndex,
  usageBreakdown,
  tripUseAllFilter,
  filterApplies,
  isTripLevel,
  type Filter,
} from "../filters.functions";
import { DEFAULT_FILTERS } from "../filters.data";
import { makeActivity, simpleFilters, pickFirst, approx } from "./helpers";

test("comboScore: single symmetric filter scores weight*curve(value,target)", () => {
  const filters = simpleFilters(); // cultural avg toward 10, slope 1, weight 1
  const combo = [makeActivity({ cultural: 8 }), makeActivity({ cultural: 6 })];
  // avg cultural = 7, linear(7,10,slope1) = 10 - 3 = 7, weight 1 => 7
  assert.equal(approx(comboScore(combo, pickFirst, filters)), 7);
});

test("comboScore clamps each option contribution into 0..10", () => {
  const filters = simpleFilters();
  // avg cultural 0 => linear(0,10,1) = 0 (not negative), weight 1 => 0
  const combo = [makeActivity({ cultural: 0 })];
  assert.equal(comboScore(combo, pickFirst, filters), 0);
});

test("comboScore: an empty selection scores 0", () => {
  const filters = simpleFilters();
  const combo = [makeActivity({ cultural: 10 })];
  assert.equal(comboScore(combo, {}, filters), 0);
});

test("comboScore: a filter that does not apply is omitted (route directness <3 stops)", () => {
  // DEFAULT_FILTERS' route-directness filter applies only to 3+ stops.
  const routeFilter = DEFAULT_FILTERS.find((f) => f.name === "Route directness")!;
  assert.ok(!filterApplies(routeFilter, [makeActivity(), makeActivity()]));
  assert.ok(filterApplies(routeFilter, [makeActivity(), makeActivity(), makeActivity()]));
});

test("scoreBreakdown.total equals comboScore", () => {
  const filters = DEFAULT_FILTERS;
  const sel = defaultSelection(filters);
  const combo = [
    makeActivity({ cultural: 9, hours: 3, cost: 18 }),
    makeActivity({ cultural: 4, hours: 2, cost: 10 }),
    makeActivity({ cultural: 6, hours: 1, cost: 5 }),
  ];
  const bd = scoreBreakdown(combo, sel, filters);
  assert.equal(approx(bd.total), approx(comboScore(combo, sel, filters)));
});

test("scoreBreakdown omits trip-level and non-applying filters", () => {
  const filters = DEFAULT_FILTERS;
  const sel = defaultSelection(filters);
  const combo = [makeActivity(), makeActivity()]; // 2 stops -> route directness omitted
  const bd = scoreBreakdown(combo, sel, filters);
  const names = bd.filters.map((f) => f.filterName);
  assert.ok(!names.includes("Use every activity")); // trip-level excluded
  assert.ok(!names.includes("Route directness")); // <3 stops -> not applied
});

test("defaultSelection: single-select picks middle option, multi picks first", () => {
  const filters: Filter[] = [
    { name: "multi", weight: 1, scoreName: "Linear (symmetric)", params: {}, multi: true, options: [{ name: "a", target: 1 }, { name: "b", target: 2 }] },
    { name: "single", weight: 1, scoreName: "Linear (symmetric)", params: {}, options: [{ name: "a", target: 1 }, { name: "b", target: 2 }, { name: "c", target: 3 }] },
  ];
  const sel = defaultSelection(filters);
  assert.deepEqual(sel[0], [0]); // multi -> first
  assert.deepEqual(sel[1], [1]); // single -> middle of 3
});

test("targetIndex converts unit targets to a 0..10 index", () => {
  const hoursFilter = DEFAULT_FILTERS.find((f) => f.name === "Time budget")!;
  // first option target is 3 hours; converted to an index in 0..10.
  const idx = targetIndex(hoursFilter, hoursFilter.options[0]);
  assert.ok(idx >= 0 && idx <= 10);
  // A plain (unitless) filter returns the target unchanged.
  const plain = simpleFilters()[0];
  assert.equal(targetIndex(plain, plain.options[0]), 10);
});

test("buildCombinations: 2^n - 1 non-empty subsets, sorted by score desc", () => {
  const filters = simpleFilters();
  const acts = [
    makeActivity({ cultural: 10 }),
    makeActivity({ cultural: 5 }),
    makeActivity({ cultural: 0 }),
  ];
  const combos = buildCombinations(acts, pickFirst, filters);
  assert.equal(combos.length, (1 << acts.length) - 1); // 7
  // sorted descending by comboScore
  for (let i = 1; i < combos.length; i++) {
    const prev = comboScore(combos[i - 1], pickFirst, filters);
    const cur = comboScore(combos[i], pickFirst, filters);
    assert.ok(prev >= cur - 1e-9, `not sorted at ${i}: ${prev} < ${cur}`);
  }
});

test("buildCombinations on empty activity list yields no combos", () => {
  assert.deepEqual(buildCombinations([], pickFirst, simpleFilters()), []);
});

test("tripUseAllFilter / isTripLevel identify the trip-level filter", () => {
  const found = tripUseAllFilter(DEFAULT_FILTERS);
  assert.ok(found, "default filters should contain a trip-level use-all filter");
  assert.ok(isTripLevel(found!.filter));
  assert.equal(found!.filter.name, "Use every activity");
  // No trip-level filter present -> null.
  assert.equal(tripUseAllFilter(simpleFilters()), null);
});

test("usageBreakdown: contribution = weight * clamp(curve(leftover,target0))", () => {
  // Use-all filter: under:0 over:1, target 0 => raw = 10 - 1*leftover.
  const useAll = tripUseAllFilter(DEFAULT_FILTERS)!.filter;
  const tunedWeight: Filter = { ...useAll, weight: 1 };
  const b0 = usageBreakdown(tunedWeight, 0, 5);
  assert.equal(approx(b0.contribution), 10); // nothing left out -> full
  const b3 = usageBreakdown(tunedWeight, 3, 5);
  assert.equal(approx(b3.contribution), 7); // 10 - 3
  assert.equal(b3.leftoverCount, 3);
  assert.equal(b3.placedCount, 5);
});
