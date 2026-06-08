// Unit tests for multi-city support: the Paris catalogue plans like Rome, and
// the active-city engine globals (catalogue + centre) switch correctly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ROME, PARIS, CITIES, ALL_ACTIVITIES } from "../cities.data";
import { setActiveCity, activeCenter, maxComboValue } from "../activities.functions";
import { scheduleCombo, scheduleEndHour } from "../schedule.functions";
import { DEFAULT_FILTERS } from "../filters.data";
import { buildCombinations, defaultSelection } from "../filters.functions";

// Every test file shares the module-level active city, and the suite runs
// sequentially — so always leave it back on the default (Rome) when done.
function withCity<T>(city: typeof ROME, fn: () => T): T {
  setActiveCity(city);
  try {
    return fn();
  } finally {
    setActiveCity(ROME);
  }
}

test("Paris has 10 activities and a centre distinct from Rome", () => {
  assert.equal(PARIS.activities.length, 10);
  assert.notDeepEqual(PARIS.center, ROME.center);
  assert.ok(CITIES.includes(PARIS) && CITIES.includes(ROME));
  // ALL_ACTIVITIES is the flat union of every city's catalogue.
  assert.equal(
    ALL_ACTIVITIES.length,
    CITIES.reduce((s, c) => s + c.activities.length, 0)
  );
});

test("maxComboValue follows the active city's catalogue", () => {
  const romeCost = maxComboValue("cost"); // active default is Rome
  const parisCost = withCity(PARIS, () => maxComboValue("cost"));
  assert.ok(romeCost > 0 && parisCost > 0);
  assert.notEqual(romeCost, parisCost);
  // Back on the default afterwards.
  assert.equal(maxComboValue("cost"), romeCost);
});

test("every destination's centre equals its first area, with at least one area", () => {
  for (const c of CITIES) {
    // center is the default anchor = the first area's coords.
    assert.deepEqual(c.areas[0].coords, c.center, `${c.name} centre`);
    assert.ok(c.areas.length >= 1, `${c.name} should have a selectable area`);
    // Cities anchor on "Centre" by default.
    if (c.kind === "city") assert.equal(c.areas[0].id, "centre");
  }
});

test("every destination carries a non-empty activity catalogue", () => {
  // Rome/Paris are curated; the other cities come from the generated catalogues
  // in data/activities/ — so every selectable destination now has activities.
  for (const c of CITIES) {
    assert.ok(c.activities.length > 0, `${c.name} should have activities`);
  }
});

test("setActiveCity's area anchor overrides the city centre", () => {
  const vatican = ROME.areas.find((a) => a.id === "vatican")!;
  setActiveCity(ROME, vatican.coords);
  assert.deepEqual(activeCenter(), vatican.coords);
  // Default (no anchor) falls back to the centre.
  setActiveCity(ROME);
  assert.deepEqual(activeCenter(), ROME.center);
});

test("Paris builds a non-empty, schedulable combo list", () => {
  withCity(PARIS, () => {
    const filters = DEFAULT_FILTERS;
    const sel = defaultSelection(filters);
    const combos = buildCombinations(PARIS.activities, sel, filters);
    assert.ok(combos.length > 0, "Paris should yield combos");
    const endHour = scheduleEndHour(filters, sel, 9);
    const schedulable = combos.some(
      (c) => scheduleCombo(c, 1 /* Tue */, 9, endHour).withinHours
    );
    assert.ok(schedulable, "at least one Paris combo should fit a day");
  });
});
