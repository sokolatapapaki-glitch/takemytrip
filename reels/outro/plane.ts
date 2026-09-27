// -----------------------------------------------------------------------------
// The outro's airliner: a tiny low-poly 3D model, flat-shaded like a cartoon
// -----------------------------------------------------------------------------
// A flat sprite can rotate and squash but it can never turn toward you — at the
// limbs, where the plane points at the camera, it collapses to a sliver. So the
// plane is real geometry: a tube of a fuselage, both wings, fin, tailplane and
// engines, ~100 polygons, projected through the plane's body axes every frame.
//
// It still LOOKS 2D on purpose: every face is one flat colour from three toon
// shading steps, there is a bold silhouette outline, and the palette is the
// site's own white / orange. It just has a real shape behind it.
//
// Body coordinates: f = forward (nose +), u = up, p = port (left wing +).
// About 23 units nose to tail; the caller decides how many pixels a unit is.

type V3 = [number, number, number]; // [f, u, p]
type Face = {
  pts: V3[];
  color: string;
  /** Outward normal in body space, fixed once at build time. */
  n: V3;
  /** Decals sit on another face; they skip the silhouette pass. */
  decal?: boolean;
};

const WHITE = "#ffffff";
const WING = "#f5f7fa";
const ENGINE = "#e4e8ee";
const INTAKE = "#475569";
const FIN = "#f97316"; // orange-500 — the tail livery
const GLASS = "#c2410c"; // orange-700
const OUTLINE = "#7c2d12"; // orange-900

// --- building --------------------------------------------------------------------

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const centroid = (pts: V3[]): V3 => {
  const c: V3 = [0, 0, 0];
  for (const p of pts) for (let i = 0; i < 3; i++) c[i] += p[i] / pts.length;
  return c;
};
/** Newell's method — robust for any planar-ish polygon, winding irrelevant. */
const newell = (pts: V3[]): V3 => {
  const n: V3 = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    n[0] += (a[1] - b[1]) * (a[2] + b[2]);
    n[1] += (a[2] - b[2]) * (a[0] + b[0]);
    n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const m = Math.hypot(...n) || 1;
  return [n[0] / m, n[1] / m, n[2] / m];
};

/**
 * Faces of one convex part, each normal flipped to point AWAY from the part's
 * centre. That makes back-face culling independent of vertex winding — which
 * matters, because the screen frame is left-handed and winding would flip.
 */
function part(polys: V3[][], color: string | ((i: number, pts: V3[]) => string)): Face[] {
  const c = centroid(polys.flat());
  return polys.map((pts, i) => {
    let n = newell(pts);
    if (dot(n, sub(centroid(pts), c)) < 0) n = [-n[0], -n[1], -n[2]];
    return { pts, n, color: typeof color === "string" ? color : color(i, pts) };
  });
}

/** A box-ish slab from a planform: `top` and `bottom` are matching outlines. */
function slab(top: V3[], bottom: V3[]): V3[][] {
  const faces: V3[][] = [top, [...bottom].reverse()];
  for (let i = 0; i < top.length; i++) {
    const j = (i + 1) % top.length;
    faces.push([top[i], top[j], bottom[j], bottom[i]]);
  }
  return faces;
}

const mirror = (pts: V3[]): V3[] => pts.map(([f, u, p]) => [f, u, -p]);

function buildModel(): Face[] {
  const faces: Face[] = [];
  const SIDES = 8;
  const ang = (k: number) => ((22.5 + 45 * k) * Math.PI) / 180; // 0 = straight up
  const ring = (f: number, r: number, uOff: number): V3[] =>
    Array.from({ length: SIDES }, (_, k) => [f, uOff + r * Math.cos(ang(k)), r * Math.sin(ang(k))]);

  // --- fuselage: a tapered octagonal tube, nose right, tail lifted ---
  const stations: [number, number, number][] = [
    [9.6, 1.7, -0.1],
    [7.0, 2.5, 0],
    [-4.5, 2.5, 0],
    [-8.5, 1.7, 0.7],
    [-11.4, 0.7, 1.5],
  ];
  const rings = stations.map(([f, r, u]) => ring(f, r, u));
  const nose: V3 = [11.7, -0.2, 0];
  const body: V3[][] = [];
  const bodyColor: string[] = [];
  for (let k = 0; k < SIDES; k++) {
    body.push([nose, rings[0][k], rings[0][(k + 1) % SIDES]]);
    bodyColor.push(WHITE);
  }
  for (let s = 0; s < rings.length - 1; s++) {
    for (let k = 0; k < SIDES; k++) {
      const k2 = (k + 1) % SIDES;
      body.push([rings[s][k], rings[s][k2], rings[s + 1][k2], rings[s + 1][k]]);
      // Windshield: the upper-side faces of the nose section, both sides.
      // Face k is centred at 45°·(k+1) from straight up.
      const centre = (45 * (k + 1)) % 360;
      bodyColor.push(s === 0 && (centre === 45 || centre === 315) ? GLASS : WHITE);
    }
  }
  body.push([...rings[rings.length - 1]].reverse());
  bodyColor.push(WHITE);
  faces.push(...part(body, (i) => bodyColor[i]));

  // --- cabin windows: decals just proud of the flat side faces ---
  // The side face centred at 90° is the plane p = r·sin(67.5°).
  const side = 2.5 * Math.sin((67.5 * Math.PI) / 180) + 0.04;
  for (const f of [5, 3.2, 1.4, -0.4, -2.2, -4]) {
    const win: V3[] = [
      [f + 0.45, 0.35, side],
      [f - 0.45, 0.35, side],
      [f - 0.45, 1.05, side],
      [f + 0.45, 1.05, side],
    ];
    for (const pts of [win, mirror(win)]) {
      faces.push({ pts, n: [0, 0, Math.sign(pts[0][2])], color: GLASS, decal: true });
    }
  }

  // --- wings: low-mounted, swept, a little dihedral ---
  const wing = (uRoot: number, uTip: number): V3[] => [
    [3.0, uRoot, 2.0],
    [-2.4, uTip, 12.0],
    [-4.4, uTip, 12.0],
    [-2.2, uRoot, 2.0],
  ];
  const wingTop = wing(-0.75, 0.15);
  const wingBot = wing(-1.25, -0.3);
  faces.push(...part(slab(wingTop, wingBot), WING));
  faces.push(...part(slab(mirror(wingTop), mirror(wingBot)), WING));

  // --- tailplane ---
  const tp = (u: number): V3[] => [
    [-8.2, u, 0.6],
    [-10.6, u + 0.25, 4.8],
    [-11.6, u + 0.25, 4.8],
    [-11.2, u, 0.6],
  ];
  faces.push(...part(slab(tp(1.45), tp(1.15)), WING));
  faces.push(...part(slab(mirror(tp(1.45)), mirror(tp(1.15))), WING));

  // --- fin: the orange tail ---
  const fin = (p: number): V3[] => [
    [-6.4, 2.2, p],
    [-9.7, 7.8, p],
    [-11.5, 7.8, p],
    [-11.3, 1.9, p],
  ];
  faces.push(...part(slab(fin(0.3), fin(-0.3)), FIN));

  // --- engines: hexagonal pods under each wing, dark intake at the front ---
  for (const sgn of [1, -1]) {
    const E = 6;
    const pod = (f: number, r: number): V3[] =>
      Array.from({ length: E }, (_, k) => {
        const a = (Math.PI * 2 * k) / E;
        return [f, -2.1 + r * Math.cos(a), sgn * 5.2 + r * Math.sin(a)] as V3;
      });
    const front = pod(1.8, 0.95);
    const back = pod(-2.2, 0.7);
    const polys: V3[][] = [];
    for (let k = 0; k < E; k++) {
      const k2 = (k + 1) % E;
      polys.push([front[k], front[k2], back[k2], back[k]]);
    }
    polys.push(front, [...back].reverse());
    faces.push(...part(polys, (i) => (i === E ? INTAKE : ENGINE)));
  }

  return faces;
}

const MODEL = buildModel();

// --- drawing -------------------------------------------------------------------------

type Vec = { x: number; y: number; z: number };

export type PlanePoly = { pts: string; fill: string; edge: string; outline: boolean };

/** Light from upper-left, in front: screen x right, y DOWN, z toward camera. */
const LIGHT: Vec = (() => {
  const v = { x: -0.45, y: -0.75, z: 0.55 };
  const m = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / m, y: v.y / m, z: v.z / m };
})();

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (s: number) => Math.round(Math.min(255, ((n >> s) & 255) * k));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

/**
 * The model, placed on screen.
 *
 * `fwd`, `up`, `port` are the plane's body axes as screen-space unit vectors;
 * `cx, cy` its centre in px; `px` how many px one model unit is. Returns the
 * visible faces far-to-near, ready to paint in order.
 */
export function drawPlane(
  fwd: Vec,
  up: Vec,
  port: Vec,
  cx: number,
  cy: number,
  px: number
): PlanePoly[] {
  const toWorld = ([f, u, p]: V3): Vec => ({
    x: f * fwd.x + u * up.x + p * port.x,
    y: f * fwd.y + u * up.y + p * port.y,
    z: f * fwd.z + u * up.z + p * port.z,
  });

  const out: { depth: number; poly: PlanePoly }[] = [];
  for (const face of MODEL) {
    const n = toWorld(face.n);
    if (n.z <= 0.02) continue; // facing away
    const w = face.pts.map(toWorld);
    // Three toon steps, not a smooth gradient: flat colour is the cartoon.
    const lambert = Math.max(0, n.x * LIGHT.x + n.y * LIGHT.y + n.z * LIGHT.z);
    const k = lambert > 0.62 ? 1 : lambert > 0.3 ? 0.93 : 0.84;
    const depth = w.reduce((s, v) => s + v.z, 0) / w.length + (face.decal ? 0.05 : 0);
    out.push({
      depth,
      poly: {
        pts: w.map((v) => `${(cx + v.x * px).toFixed(1)},${(cy + v.y * px).toFixed(1)}`).join(" "),
        fill: shade(face.color, k),
        edge: shade(face.color, k * 0.8),
        outline: !face.decal,
      },
    });
  }
  out.sort((a, b) => a.depth - b.depth);
  return out.map((o) => o.poly);
}

export const PLANE_OUTLINE = OUTLINE;
