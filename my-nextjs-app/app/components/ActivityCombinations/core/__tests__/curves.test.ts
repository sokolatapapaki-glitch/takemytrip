// Unit tests for the scale-scoring curve functions (curves.functions).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  linear,
  asymmetricLinear,
  power,
  quadratic,
  gaussian,
  boxcar,
  raisedCosine,
  linearWithFloor,
} from "../curves.functions";
import { CURVE_BY_NAME } from "../curves.data";
import { approx } from "./helpers";

test("every curve peaks (== 10-ish) exactly on target", () => {
  assert.equal(linear(5, 5, { slope: 1 }), 10);
  assert.equal(asymmetricLinear(5, 5, { under: 2, over: 4 }), 10);
  assert.equal(power(5, 5, { intensity: 1, power: 2 }), 10);
  assert.equal(quadratic(5, 5, { curvature: 1 }), 10);
});

test("linear drops by slope per unit of distance, both directions", () => {
  assert.equal(linear(3, 5, { slope: 1 }), 8);
  assert.equal(linear(7, 5, { slope: 1 }), 8);
  assert.equal(linear(0, 5, { slope: 2 }), 0);
});

test("asymmetricLinear penalises under vs over at different rates", () => {
  // under:0 over:100 => a ceiling: free below target, steep above.
  assert.equal(asymmetricLinear(3, 5, { under: 0, over: 100 }), 10);
  assert.ok(asymmetricLinear(6, 5, { under: 0, over: 100 }) < 0);
});

test("quadratic is forgiving near target, steep far away", () => {
  const near = quadratic(5.5, 5, { curvature: 1 });
  const far = quadratic(8, 5, { curvature: 1 });
  assert.ok(near > far);
  assert.equal(approx(quadratic(6, 5, { curvature: 1 })), approx(10 - 1));
});

test("gaussian peaks at target and decays", () => {
  assert.equal(gaussian(5, 5, { peak: 10, width: 2 }), 10);
  assert.ok(gaussian(9, 5, { peak: 10, width: 2 }) < 10);
  assert.ok(gaussian(9, 5, { peak: 10, width: 2 }) > 0);
});

test("boxcar is full inside tolerance, zero outside", () => {
  assert.equal(boxcar(5.5, 5, { tolerance: 1, inside: 10 }), 10);
  assert.equal(boxcar(7, 5, { tolerance: 1, inside: 10 }), 0);
});

test("raisedCosine reaches exactly 0 at ±width", () => {
  assert.equal(approx(raisedCosine(7, 5, { peak: 10, width: 2 }), 6), 0);
  assert.equal(raisedCosine(5, 5, { peak: 10, width: 2 }), 10);
});

test("linearWithFloor never drops below its floor", () => {
  assert.equal(linearWithFloor(50, 5, { slope: 1, floor: 2 }), 2);
  assert.equal(linearWithFloor(5, 5, { slope: 1, floor: 2 }), 10);
});

test("CURVE_BY_NAME resolves named curves used by the default filters", () => {
  assert.ok(CURVE_BY_NAME["Linear (symmetric)"]);
  assert.ok(CURVE_BY_NAME["Asymmetric linear"]);
  // The fn is callable and peaks on target.
  assert.equal(CURVE_BY_NAME["Linear (symmetric)"].fn(5, 5, { slope: 1 }), 10);
});
