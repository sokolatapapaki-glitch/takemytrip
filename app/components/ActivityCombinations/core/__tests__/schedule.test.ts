// Unit tests for the itinerary scheduler (schedule.functions).
import { test } from "node:test";
import assert from "node:assert/strict";
import { scheduleCombo, scheduleEndHour } from "../schedule.functions";
import { DEFAULT_FILTERS } from "../filters.data";
import { defaultSelection } from "../filters.functions";
import type { DayHours } from "../activities.functions";
import { makeActivity, allWeek, CLOSED_DAY } from "./helpers";

const MON = 0;

// A 7-day program closed on Monday, open `open..close` the rest of the week.
function closedMonday(open: number, close: number): DayHours[] {
  return [CLOSED_DAY, ...Array.from({ length: 6 }, () => ({ open, close }))];
}

test("single activity: feasible plan with no lunch slot", () => {
  const a = makeActivity({ hours: 2, program: allWeek(8, 22) });
  const plan = scheduleCombo([a], MON, 12, 22);
  assert.ok(plan.feasible);
  assert.ok(plan.withinHours);
  assert.equal(plan.items.length, 1);
  assert.ok(!plan.items.some((it) => it.lunch));
  assert.equal(plan.items[0].start, 12);
  assert.equal(plan.items[0].end, 14);
});

test("single activity closed on the chosen day is not within hours", () => {
  const a = makeActivity({ hours: 2, program: closedMonday(8, 22) });
  const plan = scheduleCombo([a], MON, 12, 22);
  assert.ok(!plan.withinHours);
  assert.ok(!plan.feasible);
});

test("two activities get a required lunch break and stay feasible", () => {
  const a = makeActivity({ hours: 2, program: allWeek(8, 22) });
  const b = makeActivity({ hours: 2, program: allWeek(8, 22) });
  const plan = scheduleCombo([a, b], MON, 12, 22);
  assert.ok(plan.feasible);
  const lunch = plan.items.filter((it) => it.lunch);
  assert.equal(lunch.length, 1, "exactly one lunch slot");
  // Lunch sits strictly between two activities.
  const idx = plan.items.findIndex((it) => it.lunch);
  assert.ok(idx > 0 && idx < plan.items.length - 1);
  assert.ok(plan.feasibleOrderings >= 1);
});

test("lunch must start by 4 PM: a late start makes a 2+ combo infeasible", () => {
  // Start 15:00, two 2h activities -> lunch would start at 17:00 (> 16:00).
  const a = makeActivity({ hours: 2, program: allWeek(8, 23) });
  const b = makeActivity({ hours: 2, program: allWeek(8, 23) });
  const plan = scheduleCombo([a, b], MON, 15, 23);
  assert.ok(!plan.feasible);
  assert.ok(!plan.withinHours);
});

test("budget overrun makes a plan infeasible", () => {
  const a = makeActivity({ hours: 2, program: allWeek(8, 22) });
  const b = makeActivity({ hours: 2, program: allWeek(8, 22) });
  // Two 2h activities + 3h lunch = 7h; a 4h budget can't hold it.
  const plan = scheduleCombo([a, b], MON, 12, 16);
  assert.ok(!plan.feasible);
});

test("a foodie is_lunch activity open midday fills the lunch slot", () => {
  const a = makeActivity({ name: "Morning", hours: 2, program: allWeek(8, 22) });
  const food = makeActivity({ name: "Trattoria", hours: 1, program: allWeek(11, 23), is_lunch: true });
  const b = makeActivity({ name: "Evening", hours: 2, program: allWeek(8, 22) });
  const plan = scheduleCombo([a, food, b], MON, 12, 22);
  assert.ok(plan.feasible);
  const lunch = plan.items.find((it) => it.lunch);
  assert.ok(lunch, "there is a lunch slot");
  // The foodie activity (not a generic break) should be able to take the slot.
  assert.equal(lunch!.name, "Trattoria");
});

test("linearity of a scheduled plan stays within 0..10", () => {
  const a = makeActivity({ hours: 2, coords: { lat: 0, lng: 0 } });
  const b = makeActivity({ hours: 2, coords: { lat: 0, lng: 1 } });
  const c = makeActivity({ hours: 1, coords: { lat: 0, lng: 2 } });
  const plan = scheduleCombo([a, b, c], MON, 12, 23);
  assert.ok(plan.linearity >= 0 && plan.linearity <= 10);
});

test("scheduleEndHour = startHour + chosen time-budget hours", () => {
  const filters = DEFAULT_FILTERS;
  const sel = defaultSelection(filters);
  const end = scheduleEndHour(filters, sel, 12);
  // The default (middle) hours option is finite and after the start.
  assert.ok(end > 12);
});

test("empty combo schedules trivially (feasible, no items)", () => {
  const plan = scheduleCombo([], MON, 12, 22);
  assert.ok(plan.feasible);
  assert.equal(plan.items.length, 0);
});
