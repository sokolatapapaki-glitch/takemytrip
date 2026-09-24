// -----------------------------------------------------------------------------
// The outro scene, as a pure function of time
// -----------------------------------------------------------------------------
// Everything that moves in the closing scene is computed HERE, in Node, and the
// page (template.html) only writes it into the DOM. That keeps every frame a
// pure function of `t` — no CSS animations, no wall clock — exactly like the
// caption overlay, so two renders of the same reel are identical.
//
//   0 ─ slide ──────┐ the last app frame slides up, the scene is already under it
//        headline   │ TAKE · MY · TRIP pop in one at a time, as the slide lands
//        tagline    │ rises in after the last word
//        flight ────┤ plane: left limb → front of the globe → behind the right limb,
//                   │ while the globe turns half a rotation; orange dotted trail
//   end hold ───────┘ the finished frame, globe still turning (slower)

import fs from "node:fs";
import { createRequire } from "node:module";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Outro } from "../types.js";
import { OUTRO_DEFAULTS } from "../config.js";

/** Handed to the page once, before the first frame. */
export type OutroSetup = {
  width: number;
  height: number;
  /** file:// URL of the frame the outro slides away (the plan preview). */
  previewUrl: string;
  headline: string[];
  tagline: string;
  particles: { x: number; y: number; r: number; color: string; opacity: number }[];
  globe: { cx: number; cy: number; r: number };
};

/** Everything that changes from one frame to the next. */
export type OutroFrame = {
  /** Preview's translateY, px (0 = in place, −height = gone). */
  slideY: number;
  particlesDy: number;
  land: string;
  graticule: string;
  plane: { x: number; y: number; angle: number; scale: number; opacity: number } | null;
  trail: { x: number; y: number; opacity: number }[];
  words: { scale: number; opacity: number }[];
  tagline: { opacity: number; dy: number };
};

// --- layout (output px, 1080×1920) -------------------------------------------

const GLOBE = { cx: 540, cy: 1010, r: 350 };
/** Tilt so the northern hemisphere — where the destinations are — faces us. */
const TILT = -24;
/** The longitude centred on screen as the plane lands: Rome. */
const LAND_ON_LON = 12.5;
/** After the flight the globe keeps turning, at this fraction of flight speed. */
const HOLD_SPIN = 0.3;

/** The plane's arc: an ellipse over the front of the globe, slightly tilted. */
const ARC = { a: GLOBE.r * 1.16, b: GLOBE.r * 0.66, lift: 40, tiltDeg: -8 };
const TRAIL_SPACING = 30; // px between trail dots
const TRAIL_GAP = 46; // px of clear air between the plane and the newest dot

// --- easing -------------------------------------------------------------------

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
/** Overshoots to ~1.1 then settles — the headline "pop". */
const backOut = (t: number) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// --- the scene ----------------------------------------------------------------

export type OutroTimings = { [K in keyof typeof OUTRO_DEFAULTS]: number };

export function outroTimings(outro: Outro): OutroTimings {
  return {
    ...OUTRO_DEFAULTS,
    slideMs: outro.slideMs ?? OUTRO_DEFAULTS.slideMs,
    flightMs: outro.flightMs ?? OUTRO_DEFAULTS.flightMs,
    endHoldMs: outro.endHoldMs ?? OUTRO_DEFAULTS.endHoldMs,
  };
}

/** Total outro length in ms. */
export function outroDuration(outro: Outro): number {
  const T = outroTimings(outro);
  const words = outro.headline.length;
  const headlineEnd = T.headlineStartMs + (words - 1) * T.wordStaggerMs + T.wordPopMs;
  const taglineEnd = headlineEnd + T.taglineMs;
  const flightEnd = T.slideMs + T.flightMs;
  return Math.max(flightEnd, taglineEnd) + T.endHoldMs;
}

export function outroSetup(outro: Outro, previewUrl: string): OutroSetup {
  return {
    width: 1080,
    height: 1920,
    previewUrl,
    headline: outro.headline,
    tagline: outro.tagline,
    particles: particles(1080, 1920),
    globe: GLOBE,
  };
}

/** A frame-by-frame renderer for one outro. */
export function outroScene(outro: Outro): (tMs: number) => OutroFrame {
  const T = outroTimings(outro);
  const total = outroDuration(outro);
  const flightStart = T.slideMs;
  const flightEnd = T.slideMs + T.flightMs;
  const spin = 180 / T.flightMs; // deg per ms — half a turn over the flight

  const land = loadLand();
  const graticule = geoGraticule10();
  const projection = geoOrthographic()
    .scale(GLOBE.r)
    .translate([GLOBE.cx, GLOBE.cy])
    .clipAngle(90)
    .precision(0.4);
  const path = geoPath(projection);

  const arc = arcSampler();

  return (t: number): OutroFrame => {
    // Rotation: linear through the flight so Rome is centred as the plane
    // lands, then slowing for the hold. λ is minus the centred longitude.
    const lambdaEnd = -LAND_ON_LON;
    const lambda =
      t <= flightEnd
        ? lambdaEnd + spin * (t - flightEnd)
        : lambdaEnd + spin * HOLD_SPIN * (t - flightEnd);
    projection.rotate([lambda, TILT]);

    // Plane: near-constant speed with a soft start and landing.
    const x = clamp01((t - flightStart) / T.flightMs);
    const u = mix(x, easeInOut(x), 0.35);
    let plane: OutroFrame["plane"] = null;
    const trail: OutroFrame["trail"] = [];
    if (t >= flightStart) {
      const p = arc.at(u);
      const ahead = arc.at(Math.min(1, u + 0.004));
      const behind = arc.at(Math.max(0, u - 0.004));
      const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      // Emerges from behind the left limb, dips back behind the right one:
      // small and faint at both ends, full size across the face.
      const edge = Math.min(clamp01(u / 0.1), clamp01((1 - u) / 0.12));
      if (u < 1) {
        plane = {
          x: p.x,
          y: p.y,
          angle,
          scale: mix(0.55, 1, easeOut(edge)),
          opacity: easeOut(edge),
        };
      }
      const head = arc.lengthAt(u) - TRAIL_GAP * edge;
      for (let s = 0; s <= head; s += TRAIL_SPACING) {
        const q = arc.atLength(s);
        // Newest dots full strength; the route behind fades a little.
        const age = head > 0 ? 1 - s / head : 0;
        trail.push({ x: q.x, y: q.y, opacity: mix(1, 0.55, age) });
      }
    }

    const words = outro.headline.map((_, i) => {
      const p = clamp01((t - T.headlineStartMs - i * T.wordStaggerMs) / T.wordPopMs);
      return { scale: p <= 0 ? 0 : backOut(p), opacity: clamp01(p * 2.5) };
    });
    const tagStart =
      T.headlineStartMs + (outro.headline.length - 1) * T.wordStaggerMs + T.wordPopMs;
    const tp = easeOut(clamp01((t - tagStart) / T.taglineMs));

    return {
      slideY: -1920 * easeInOut(clamp01(t / T.slideMs)),
      particlesDy: -24 * (t / total),
      land: path(land) ?? "",
      graticule: path(graticule) ?? "",
      plane,
      trail,
      words,
      tagline: { opacity: tp, dy: mix(28, 0, tp) },
    };
  };
}

// --- helpers --------------------------------------------------------------------

function loadLand() {
  const require = createRequire(import.meta.url);
  const topo = JSON.parse(
    fs.readFileSync(require.resolve("world-atlas/land-110m.json"), "utf8")
  ) as Topology<{ land: GeometryCollection }>;
  return feature(topo, topo.objects.land);
}

/** The plane's path, sampled once so dots can be placed by arc length. */
function arcSampler() {
  const N = 1200;
  const tilt = (ARC.tiltDeg * Math.PI) / 180;
  const raw = (u: number) => {
    const th = Math.PI * (1 - u); // π (left) → 0 (right), over the top
    const x = ARC.a * Math.cos(th);
    const y = -ARC.b * Math.sin(th) - ARC.lift * Math.sin(th);
    return {
      x: GLOBE.cx + x * Math.cos(tilt) - y * Math.sin(tilt),
      y: GLOBE.cy + x * Math.sin(tilt) + y * Math.cos(tilt),
    };
  };
  const pts = Array.from({ length: N + 1 }, (_, i) => raw(i / N));
  const cum = [0];
  for (let i = 1; i <= N; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return {
    at: raw,
    lengthAt: (u: number) => {
      const f = clamp01(u) * N;
      const i = Math.floor(f);
      return i >= N ? cum[N] : mix(cum[i], cum[i + 1], f - i);
    },
    atLength: (s: number) => {
      let lo = 0;
      let hi = N;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (cum[mid] < s) lo = mid;
        else hi = mid;
      }
      const span = cum[hi] - cum[lo] || 1;
      return raw((lo + (s - cum[lo]) / span) / N);
    },
  };
}

/** Faint particles on a jittered grid — a pattern, not noise. Seeded. */
function particles(width: number, height: number): OutroSetup["particles"] {
  let seed = 0x7a4e3;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const out: OutroSetup["particles"] = [];
  const cols = 9;
  const rows = 17;
  const cw = width / cols;
  const ch = (height + 60) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Every other row is offset half a cell, like a woven pattern.
      const ox = r % 2 ? cw / 2 : 0;
      out.push({
        x: c * cw + ox + (rand() - 0.5) * cw * 0.5,
        y: r * ch + (rand() - 0.5) * ch * 0.5,
        r: 2 + rand() * 3.5,
        color: rand() < 0.55 ? "#ffffff" : "#8a5a2b",
        opacity: 0.1 + rand() * 0.14,
      });
    }
  }
  return out;
}
