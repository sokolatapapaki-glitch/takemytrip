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
//        flight ────┤ plane: out from behind the left limb, across the face, back
//                   │ behind the right one; orange dotted trail, occluded with it
//   end hold ───────┘ the finished frame, globe still turning (slower)
//
// The flight is a satellite ORBIT: a real circle in 3D, at altitude above the
// surface, fixed to the CAMERA and not to the sphere — the earth turns
// underneath and the orbit is unaffected. Depth is what makes it read as 3D: a
// point is dropped only where the globe actually eclipses it, so the route
// swings wide past the limb, crosses the face, and is swallowed at the back.

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
  /** file:// URL of the frame the outro slides away (the reel's last frame). */
  previewUrl: string;
  headline: string[];
  tagline: string;
  globe: { cx: number; cy: number; r: number };
};

/** Everything that changes from one frame to the next. */
export type OutroFrame = {
  /** Preview's translateY, px (0 = in place, −height = gone). */
  slideY: number;
  land: string;
  graticule: string;
  plane: {
    x: number;
    y: number;
    angle: number;
    scale: number;
    opacity: number;
    /**
     * How much of the 3D velocity lies in the screen plane: the real
     * foreshortening. The page squashes the side silhouette along its own
     * length by this, which is what turns a flat shape into a solid one.
     *
     * It never reaches 0 on this orbit — at the limbs it bottoms out at
     * cos(tilt) — because that is where the orbit's velocity still has a
     * cos(tilt) share across the frame. A steeper tilt would take the plane
     * closer to dead end-on, at the cost of flattening the on-screen arc.
     */
    squashX: number;
    /**
     * Which silhouette to show: 1 = full side profile, 0 = the end-on one.
     * Normalised over `squashX`'s ACTUAL range for this tilt, so the cross-fade
     * uses all of itself instead of the top half — and the two opacities sum to
     * 1, so the pair never goes translucent mid-turn.
     */
    sideMix: number;
  } | null;
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

/**
 * The flight: a satellite ORBIT — a real circle in 3D, at altitude, fixed to the
 * CAMERA rather than to the sphere. The globe turns underneath and the orbit
 * does not care.
 *
 * Because it sits above the surface, "behind the globe" is not simply the far
 * half of the circle. A point is hidden only when it is both behind (z < 0) AND
 * inside the globe's silhouette; behind but out past the limb, it is in open
 * space and you see it. That is exactly how a satellite reads: it swings wide
 * round the sides, passes over the face, and is eclipsed at the back.
 *
 *   radius    1.08× the globe — just enough daylight under it to read as an
 *             orbit rather than a line drawn on the surface.
 *   tilt      how steeply the orbit leans out of the screen plane. It has to be
 *             steep enough that the orbit's narrowest on-screen point falls
 *             INSIDE the disc, or nothing is ever eclipsed: that needs
 *             cos(tilt) < 1/radius, i.e. above ~32°. 62° gives a deep eclipse.
 *   start     where the orbit begins, in degrees. 90° is the middle of the
 *             eclipse, so the plane is already hidden when the flight starts —
 *             you never catch it appearing from nowhere.
 *   sweep     360° — one full revolution, ending back in the eclipse.
 */
const FLIGHT = { radius: 1.08, tiltDeg: 62, startDeg: 90, sweepDeg: 360 };
/** Degrees of arc between trail dots. */
const TRAIL_SPACING_DEG = 3;
/** Degrees of clear air between the plane's nose and the newest dot. */
const TRAIL_GAP_DEG = 8;

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
    globe: GLOBE,
  };
}

/** A frame-by-frame renderer for one outro. */
export function outroScene(outro: Outro): (tMs: number) => OutroFrame {
  const T = outroTimings(outro);
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

  /** λ at time t. Minus the longitude sitting at the centre of the frame. */
  const lambdaAt = (t: number): number => {
    const lambdaEnd = -LAND_ON_LON;
    return t <= flightEnd
      ? lambdaEnd + spin * (t - flightEnd)
      : lambdaEnd + spin * HOLD_SPIN * (t - flightEnd);
  };

  // The flight, in camera space. θ is degrees around the circle: 180° is the
  // left limb, 270° the top of the arc dead in front, 360° the right limb.
  // Outside (180, 360) the point is on the far side and the globe hides it.
  const R = GLOBE.r * FLIGHT.radius;
  const cosTilt = Math.cos(FLIGHT.tiltDeg * D2R);
  const sinTilt = Math.sin(FLIGHT.tiltDeg * D2R);
  const at = (deg: number) => {
    const a = deg * D2R;
    const x = GLOBE.cx + R * Math.cos(a);
    const y = GLOBE.cy + R * Math.sin(a) * cosTilt;
    /** Toward the camera. Positive = the near side of the orbit. */
    const z = -R * Math.sin(a) * sinTilt;
    // Eclipsed: behind the globe AND within its silhouette. Behind but outside
    // the limb is open space — a satellite there is perfectly visible.
    const eclipsed = z <= 0 && Math.hypot(x - GLOBE.cx, y - GLOBE.cy) < GLOBE.r;
    return { x, y, z, eclipsed };
  };
  const thetaFrom = FLIGHT.startDeg;
  const thetaTo = FLIGHT.startDeg + FLIGHT.sweepDeg;
  const thetaAt = (u: number) => mix(thetaFrom, thetaTo, u);

  return (t: number): OutroFrame => {
    projection.rotate([lambdaAt(t), TILT]);

    // Plane: near-constant speed with a soft start and landing.
    const x = clamp01((t - flightStart) / T.flightMs);
    const u = mix(x, easeInOut(x), 0.35);
    let plane: OutroFrame["plane"] = null;
    const trail: OutroFrame["trail"] = [];
    if (t >= flightStart) {
      const head = thetaAt(u);

      // The trail: every dot already flown that is not eclipsed. No fade at the
      // limb — the globe does the hiding now, which is the whole point, and a
      // fade would only blur the edge it is meant to sell.
      for (let a = thetaFrom; a <= head - TRAIL_GAP_DEG; a += TRAIL_SPACING_DEG) {
        const q = at(a);
        if (q.eclipsed) continue;
        // Newest dots full strength; the route behind fades a little.
        const age = clamp01((head - a) / Math.max(1, head - thetaFrom));
        trail.push({ x: q.x, y: q.y, opacity: mix(1, 0.55, age) });
      }

      const here = at(head);
      if (u < 1 && !here.eclipsed) {
        const ahead = at(head + 1.2);
        const behind = at(head - 1.2);
        // Velocity in 3D. Its screen part gives the heading; how much of the
        // whole vector that screen part accounts for gives us how side-on the
        // plane is — the thing that makes two flat sprites read as one solid
        // object turning. Straight across the frame: full profile. Pointing at
        // the camera: end-on, and the profile view foreshortens to nothing.
        const vx = ahead.x - behind.x;
        const vy = ahead.y - behind.y;
        const vz = ahead.z - behind.z;
        const angle = (Math.atan2(vy, vx) * 180) / Math.PI;
        const squashX = Math.hypot(vx, vy) / (Math.hypot(vx, vy, vz) || 1);
        // cosTilt is the floor squashX can reach, so rescale from there.
        const sideMix = clamp01((squashX - cosTilt) / (1 - cosTilt));
        // Smaller the further away it is: perspective, not a fade-out. z runs
        // ±R·sin(tilt) and is NEGATIVE for the half of the orbit that swings
        // behind, which is visible out past the limb — so this maps the whole
        // range to 0–1 rather than treating the far side as zero.
        const depth = clamp01((here.z / (R * sinTilt) + 1) / 2);
        plane = {
          x: here.x,
          y: here.y,
          angle,
          scale: mix(0.62, 1, depth),
          opacity: 1,
          squashX,
          sideMix,
        };
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

const D2R = Math.PI / 180;
