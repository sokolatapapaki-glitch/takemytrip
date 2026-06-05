// Unit tests for the geometry / catalogue helpers (activities.functions).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  distanceKm,
  routeLinearity,
  bestRouteLinearity,
  dayHours,
  isClosedDay,
  isAllDay,
  formatTime,
  maxComboValue,
} from "../activities.functions";
import { makeActivity, allWeek, CLOSED_DAY, approx } from "./helpers";

test("distanceKm is zero for identical points", () => {
  const p = { lat: 41.9, lng: 12.5 };
  assert.equal(distanceKm(p, p), 0);
});

test("distanceKm ~ 111 km for one degree of latitude", () => {
  const d = distanceKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
  assert.ok(Math.abs(d - 111.19) < 0.5, `expected ~111.19, got ${d}`);
});

test("distanceKm is symmetric", () => {
  const a = { lat: 41.9, lng: 12.5 };
  const b = { lat: 41.85, lng: 12.6 };
  assert.equal(approx(distanceKm(a, b)), approx(distanceKm(b, a)));
});

test("routeLinearity: fewer than 2 points is trivially direct (10)", () => {
  assert.equal(routeLinearity([]), 10);
  assert.equal(routeLinearity([{ lat: 1, lng: 1 }]), 10);
});

test("routeLinearity: zero-length path (all same point) is 10", () => {
  const p = { lat: 1, lng: 1 };
  assert.equal(routeLinearity([p, p, p]), 10);
});

test("routeLinearity: collinear in-order points score 10", () => {
  const path = [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 1 },
    { lat: 0, lng: 2 },
  ];
  assert.ok(approx(routeLinearity(path), 4) >= 9.99);
});

test("routeLinearity: there-and-back is far from direct (low)", () => {
  const path = [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 1 },
    { lat: 0, lng: 0 }, // return to start
  ];
  // end==start so endToEnd is 0 -> linearity 0.
  assert.equal(approx(routeLinearity(path), 4), 0);
});

test("routeLinearity is always within 0..10", () => {
  const pts = [
    { lat: 0, lng: 0 },
    { lat: 1, lng: 3 },
    { lat: -2, lng: 1 },
    { lat: 0.5, lng: -1 },
  ];
  const lin = routeLinearity(pts);
  assert.ok(lin >= 0 && lin <= 10);
});

test("bestRouteLinearity: <3 stops is trivially 10, and order-independent", () => {
  const a = makeActivity({ coords: { lat: 0, lng: 0 } });
  const b = makeActivity({ coords: { lat: 0, lng: 5 } });
  assert.equal(bestRouteLinearity([]), 10);
  assert.equal(bestRouteLinearity([a]), 10);
  assert.equal(bestRouteLinearity([a, b]), 10);
});

test("bestRouteLinearity finds the straightest ordering (>= any fixed order)", () => {
  // Three collinear points given out of order: the best ordering is straight.
  const a = makeActivity({ coords: { lat: 0, lng: 0 } });
  const b = makeActivity({ coords: { lat: 0, lng: 2 } });
  const c = makeActivity({ coords: { lat: 0, lng: 1 } });
  const best = bestRouteLinearity([a, b, c]);
  assert.ok(approx(best, 4) >= 9.99, `best ordering should be straight, got ${best}`);
});

test("dayHours / isClosedDay / isAllDay", () => {
  const a = makeActivity({ program: allWeek(9, 17) });
  assert.deepEqual(dayHours(a, 0), { open: 9, close: 17 });
  // Out-of-range day index falls back to CLOSED.
  assert.ok(isClosedDay(dayHours(a, 99)));
  assert.ok(isClosedDay(CLOSED_DAY));
  assert.ok(!isClosedDay({ open: 9, close: 17 }));
  assert.ok(isAllDay({ open: 0, close: 24 }));
  assert.ok(!isAllDay({ open: 9, close: 17 }));
});

test("formatTime renders 24h decimals as HH:MM", () => {
  assert.equal(formatTime(8.5), "08:30");
  assert.equal(formatTime(13), "13:00");
  assert.equal(formatTime(0), "00:00");
  assert.equal(formatTime(23.75), "23:45");
});

test("maxComboValue sums a field across the real catalogue (positive)", () => {
  assert.ok(maxComboValue("hours") > 0);
  assert.ok(maxComboValue("cost") > 0);
});
