// Unit tests for the activity generator's pure helpers.
// Run from my-nextjs-app:   node --test scripts/gen-activities.lib.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRESET,
  collectImages,
  emitActivity,
  normalizeOpeningHours,
  presetProgramLiteral,
  programLiteral,
  resolvePriority,
  resolveVibes,
} from "./gen-activities.lib.mjs";

const W = (open, close) => ({ open, close });
const CREDIT = {
  source: "Wikimedia Commons",
  photoUrl: "https://commons.wikimedia.org/wiki/File:X.jpg",
  author: "Someone",
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  attributionRequired: true,
};

// --- opening hours -------------------------------------------------------------

test("opening_hours: unset means 'use the category preset'", () => {
  const errors = [];
  assert.equal(normalizeOpeningHours(undefined, errors, "x"), null);
  assert.equal(normalizeOpeningHours(null, errors, "x"), null);
  assert.deepEqual(errors, []);
});

test("opening_hours: legacy single window = the same every day", () => {
  const errors = [];
  assert.deepEqual(normalizeOpeningHours(W(9, 17), errors, "x"), Array(7).fill(W(9, 17)));
  assert.deepEqual(errors, []);
});

test("opening_hours: 7 Monday-first days, null = closed", () => {
  const errors = [];
  const days = [W(9, 18), null, W(9, 18), W(9, 18), W(9, 18), W(9, 18), W(9.5, 18)];
  assert.deepEqual(normalizeOpeningHours(days, errors, "x"), days);
  assert.deepEqual(errors, []);
});

test("opening_hours: malformed input is an error, never a silent default", () => {
  for (const bad of [
    [W(9, 18)], // not 7 days
    Array(7).fill(W(18, 9)), // open after close
    Array(7).fill(W(9, 25)), // past midnight
    Array(7).fill(W(0, 0)), // closed must be null, not 0–0
    Array(7).fill({ open: "9", close: 18 }), // not numbers
    "9-18",
  ]) {
    const errors = [];
    assert.equal(normalizeOpeningHours(bad, errors, "x"), null, JSON.stringify(bad));
    assert.equal(errors.length > 0, true, JSON.stringify(bad));
  }
});

test("program literal: all days equal collapses to everyDay(...)", () => {
  const use = {};
  assert.equal(programLiteral(Array(7).fill(W(9, 18)), use), "everyDay(at(9, 18))");
  assert.equal(programLiteral(Array(7).fill(W(0, 24)), {}), "everyDay(ALL_DAY)");
  assert.equal(use.everyDay && use.at, true);
});

test("program literal: mixed days spell out CLOSED / ALL_DAY / at()", () => {
  const use = {};
  const days = [null, W(9.5, 18), W(9.5, 18), W(9.5, 21.75), W(9.5, 18), W(0, 24), W(9.5, 18)];
  assert.equal(
    programLiteral(days, use),
    "[CLOSED, at(9.5, 18), at(9.5, 18), at(9.5, 21.75), at(9.5, 18), ALL_DAY, at(9.5, 18)]"
  );
  assert.equal(use.closed && use.allDay && use.at, true);
});

test("preset program is unchanged from the old generator", () => {
  assert.equal(presetProgramLiteral(PRESET.museum, {}), "everyDay(at(9, 18))");
  assert.equal(presetProgramLiteral(PRESET.park, {}), "everyDay(ALL_DAY)");
});

// --- vibes & priority ------------------------------------------------------------

test("vibes: JSON values win, missing keys fall back to the preset", () => {
  const errors = [];
  assert.deepEqual(resolveVibes({ cultural: 10, relaxing: 1 }, PRESET.museum, errors, "x"), [10, 0, 2, 1]);
  assert.deepEqual(resolveVibes(undefined, PRESET.museum, errors, "x"), [8, 0, 2, 3]);
  assert.deepEqual(errors, []);
});

test("vibes: out of range is an error", () => {
  const errors = [];
  resolveVibes({ foodie: 11 }, PRESET.museum, errors, "x");
  resolveVibes([1, 2, 3, 4], PRESET.museum, errors, "x");
  assert.equal(errors.length, 2);
});

test("priority: explicit wins over `top`, `top` still bumps when unset", () => {
  const errors = [];
  assert.equal(resolvePriority({ priority: 3, top: true }, PRESET.museum, errors, "x"), 3);
  assert.equal(resolvePriority({ top: true }, PRESET.museum, errors, "x"), 9);
  assert.equal(resolvePriority({}, PRESET.museum, errors, "x"), 6);
  resolvePriority({ priority: 12 }, PRESET.museum, errors, "x");
  assert.equal(errors.length, 1);
});

// --- images ----------------------------------------------------------------------

test("images: local /public paths need no credit", () => {
  const warnings = [];
  const r = collectImages({ name: "A", images: ["/destinations/rome/1-a/1.jpg"] }, "Rome", warnings, "x");
  assert.deepEqual(r.urls, ["/destinations/rome/1-a/1.jpg"]);
  assert.deepEqual(r.credits, []);
  assert.deepEqual(warnings, []);
});

test("images: a remote image without a complete credit is skipped with a warning", () => {
  const warnings = [];
  const r = collectImages(
    {
      name: "A",
      images: [
        "https://example.org/a.jpg",
        { url: "https://example.org/b.jpg" },
        { url: "https://example.org/c.jpg", credit: { ...CREDIT, author: "" } },
      ],
    },
    "Rome",
    warnings,
    "x"
  );
  assert.deepEqual(r.urls, []);
  assert.equal(warnings.length, 3);
});

test("images: a credited remote image is used and listed on /credits", () => {
  const warnings = [];
  const r = collectImages(
    { name: "Castel Sant'Angelo", images: [{ url: "https://example.org/a.jpg", credit: CREDIT }] },
    "Ρώμη",
    warnings,
    "x"
  );
  assert.deepEqual(r.urls, ["https://example.org/a.jpg"]);
  assert.deepEqual(r.credits, [
    {
      subject: "Ρώμη — Castel Sant'Angelo",
      author: "Someone",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:X.jpg",
    },
  ]);
});

test("images: attributionRequired:false (CC0, Unsplash) is used but not listed", () => {
  const r = collectImages(
    { name: "A", images: [{ url: "https://example.org/a.jpg", credit: { ...CREDIT, attributionRequired: false } }] },
    "Rome",
    [],
    "x"
  );
  assert.equal(r.urls.length, 1);
  assert.equal(r.credits.length, 0);
});

// --- one activity ------------------------------------------------------------------

const base = {
  id: 7,
  name: "Musée X",
  description: "d",
  category: "museum",
  duration_hours: 2,
  location: { lat: 48.86, lng: 2.33 },
  prices: { adult: 17 },
};

test("activity: no new fields -> exactly the old synthesized engine fields, plus ref", () => {
  const out = emitActivity(base, "paris", { lat: 0, lng: 0 }, {}, []);
  assert.match(out, /ref: "paris:7",/);
  assert.match(out, /program: everyDay\(at\(9, 18\)\),/);
  assert.match(out, /cultural: 8, foodie: 0, adventurous: 2, relaxing: 3, priority: 6,/);
  assert.match(out, /hours: 2, cost: 17,/);
});

test("activity: opening_hours, vibes and priority from the JSON are used", () => {
  const errors = [];
  const a = {
    ...base,
    opening_hours: [W(9, 18), null, W(9, 18), W(9, 18), W(9, 18), W(9, 18), W(9, 18)],
    vibes: { cultural: 10, foodie: 0, adventurous: 1, relaxing: 2 },
    priority: 10,
  };
  const out = emitActivity(a, "paris", { lat: 0, lng: 0 }, {}, errors);
  assert.deepEqual(errors, []);
  assert.match(out, /program: \[at\(9, 18\), CLOSED, at\(9, 18\), at\(9, 18\), at\(9, 18\), at\(9, 18\), at\(9, 18\)\],/);
  assert.match(out, /cultural: 10, foodie: 0, adventurous: 1, relaxing: 2, priority: 10,/);
});
