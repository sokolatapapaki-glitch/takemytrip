// =============================================================================
// Scale-scoring functions + their tunable constants
// =============================================================================
// Each curve maps an index value (0–10) to a score given a target, shaped by a
// set of CONSTANTS (curvature, intensity, width, ...). Scores may fall outside
// 0–10; callers clamp as needed.
//
// Signature: (value, target, params) => score.
//
// The named functions below are the source of truth. CURVES (further down) wraps
// them with display metadata + slider ranges for the graph showcase, and is also
// what the filters reference by name.
// =============================================================================
export type Params = Record<string, number>;
export type ScaleScore = (value: number, target: number, p: Params) => number;

// -----------------------------------------------------------------------------
// The functions
// -----------------------------------------------------------------------------
// 10 on target, dropping by `slope` per point of distance, both directions.
export const linear: ScaleScore = (value, target, p) =>
  10 - p.slope * Math.abs(value - target);

// Undershoot and overshoot penalised at different rates. A big `over` with
// `under` = 0 turns this into a budget CEILING (free below, steep above).
export const asymmetricLinear: ScaleScore = (value, target, p) => {
  const distance = Math.abs(value - target);
  const slope = value < target ? p.under : p.over;
  return 10 - slope * distance;
};

// Generalized power: 10 − intensity·|d|^power. power<1 concave, >1 convex.
export const power: ScaleScore = (value, target, p) =>
  10 - p.intensity * Math.abs(value - target) ** p.power;

// Squared falloff: forgiving near target, steep far out.
export const quadratic: ScaleScore = (value, target, p) =>
  10 - p.curvature * (value - target) ** 2;

// Concave: steep right around the target, then flattening (sqrt distance).
export const squareRoot: ScaleScore = (value, target, p) =>
  p.peak - p.intensity * Math.sqrt(Math.abs(value - target));

// Smooth bell centred on the target. `width` (sigma) sets tolerance.
export const gaussian: ScaleScore = (value, target, p) =>
  p.peak * Math.exp(-((value - target) ** 2) / (2 * p.width ** 2));

// Bell with different widths below vs above the target.
export const asymmetricGaussian: ScaleScore = (value, target, p) => {
  const width = value < target ? p.widthUnder : p.widthOver;
  return p.peak * Math.exp(-((value - target) ** 2) / (2 * width ** 2));
};

// Laplace / exponential decay: sharp peak, exponential tails.
export const exponentialDecay: ScaleScore = (value, target, p) =>
  p.peak * Math.exp(-p.rate * Math.abs(value - target));

// Lorentzian / Cauchy: peak / (1 + sharpness·d²). Heavy tails.
export const lorentzian: ScaleScore = (value, target, p) =>
  p.peak / (1 + p.sharpness * (value - target) ** 2);

// Logistic plateau: ~peak inside ±halfWidth, smooth drop outside.
export const logisticPlateau: ScaleScore = (value, target, p) =>
  p.peak / (1 + Math.exp(p.steepness * (Math.abs(value - target) - p.halfWidth)));

// Tolerance band: flat `peak` within ±tolerance, linear falloff beyond.
export const toleranceBand: ScaleScore = (value, target, p) => {
  const excess = Math.max(0, Math.abs(value - target) - p.tolerance);
  return p.peak - p.slope * excess;
};

// Boxcar / step: full `inside` score within ±tolerance, else 0.
export const boxcar: ScaleScore = (value, target, p) =>
  Math.abs(value - target) <= p.tolerance ? p.inside : 0;

// Raised cosine window: smooth bump that reaches 0 exactly at ±width.
export const raisedCosine: ScaleScore = (value, target, p) => {
  const distance = Math.abs(value - target);
  if (distance >= p.width) return 0;
  return p.peak * (0.5 + 0.5 * Math.cos((Math.PI * distance) / p.width));
};

// Linear with a floor: never drops below `floor` no matter the distance.
export const linearWithFloor: ScaleScore = (value, target, p) =>
  Math.max(p.floor, 10 - p.slope * Math.abs(value - target));

// -----------------------------------------------------------------------------
// Showcase metadata (used by the ScoreCurves graph)
// -----------------------------------------------------------------------------
// A tunable constant, rendered as a slider in the UI.
export type Param = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
};

export type Curve = {
  name: string;
  color: string;
  params: Param[];
  fn: ScaleScore;
};

export const CURVES: Curve[] = [
  {
    name: "Linear (symmetric)",
    color: "#3b82f6",
    fn: linear,
    params: [{ key: "slope", label: "Slope (intensity)", min: 0, max: 20, step: 0.1, default: 1 }],
  },
  {
    name: "Asymmetric linear",
    color: "#22c55e",
    fn: asymmetricLinear,
    params: [
      { key: "under", label: "Below-target slope", min: 0, max: 20, step: 0.1, default: 0.5 },
      { key: "over", label: "Above-target slope", min: 0, max: 20, step: 0.1, default: 2 },
    ],
  },
  {
    name: "Power",
    color: "#f59e0b",
    fn: power,
    params: [
      { key: "intensity", label: "Intensity", min: 0, max: 20, step: 0.1, default: 1 },
      { key: "power", label: "Power (exponent)", min: 0.1, max: 8, step: 0.1, default: 2 },
    ],
  },
  {
    name: "Quadratic",
    color: "#a855f7",
    fn: quadratic,
    params: [{ key: "curvature", label: "Curvature", min: 0, max: 20, step: 0.05, default: 0.4 }],
  },
  {
    name: "Square root (concave)",
    color: "#ef4444",
    fn: squareRoot,
    params: [
      { key: "intensity", label: "Intensity", min: 0, max: 20, step: 0.1, default: 2 },
      { key: "peak", label: "Peak score", min: 1, max: 10, step: 0.5, default: 10 },
    ],
  },
  {
    name: "Gaussian",
    color: "#06b6d4",
    fn: gaussian,
    params: [
      { key: "width", label: "Width (sigma)", min: 0.3, max: 20, step: 0.1, default: 2 },
      { key: "peak", label: "Peak score", min: 1, max: 10, step: 0.5, default: 10 },
    ],
  },
  {
    name: "Asymmetric Gaussian",
    color: "#ec4899",
    fn: asymmetricGaussian,
    params: [
      { key: "widthUnder", label: "Below width (sigma)", min: 0.3, max: 20, step: 0.1, default: 3 },
      { key: "widthOver", label: "Above width (sigma)", min: 0.3, max: 20, step: 0.1, default: 1 },
      { key: "peak", label: "Peak score", min: 1, max: 10, step: 0.5, default: 10 },
    ],
  },
  {
    name: "Exponential decay",
    color: "#84cc16",
    fn: exponentialDecay,
    params: [
      { key: "rate", label: "Decay rate", min: 0, max: 20, step: 0.05, default: 0.6 },
      { key: "peak", label: "Peak score", min: 1, max: 10, step: 0.5, default: 10 },
    ],
  },
  {
    name: "Lorentzian",
    color: "#f97316",
    fn: lorentzian,
    params: [
      { key: "sharpness", label: "Sharpness", min: 0, max: 20, step: 0.1, default: 1 },
      { key: "peak", label: "Peak score", min: 1, max: 10, step: 0.5, default: 10 },
    ],
  },
  {
    name: "Logistic plateau",
    color: "#14b8a6",
    fn: logisticPlateau,
    params: [
      { key: "steepness", label: "Edge steepness", min: 0.1, max: 20, step: 0.1, default: 2 },
      { key: "halfWidth", label: "Half-width", min: 0, max: 10, step: 0.2, default: 3 },
      { key: "peak", label: "Peak score", min: 1, max: 10, step: 0.5, default: 10 },
    ],
  },
  {
    name: "Tolerance band",
    color: "#6366f1",
    fn: toleranceBand,
    params: [
      { key: "tolerance", label: "Flat tolerance", min: 0, max: 10, step: 0.2, default: 2 },
      { key: "slope", label: "Outside slope", min: 0, max: 20, step: 0.1, default: 2 },
      { key: "peak", label: "Peak score", min: 1, max: 10, step: 0.5, default: 10 },
    ],
  },
  {
    name: "Boxcar (step)",
    color: "#eab308",
    fn: boxcar,
    params: [
      { key: "tolerance", label: "Tolerance", min: 0, max: 10, step: 0.2, default: 2 },
      { key: "inside", label: "Inside score", min: 1, max: 10, step: 0.5, default: 10 },
    ],
  },
  {
    name: "Raised cosine",
    color: "#8b5cf6",
    fn: raisedCosine,
    params: [
      { key: "width", label: "Window width", min: 0.5, max: 20, step: 0.1, default: 4 },
      { key: "peak", label: "Peak score", min: 1, max: 10, step: 0.5, default: 10 },
    ],
  },
  {
    name: "Linear with floor",
    color: "#10b981",
    fn: linearWithFloor,
    params: [
      { key: "slope", label: "Slope", min: 0, max: 20, step: 0.1, default: 1 },
      { key: "floor", label: "Minimum score", min: 0, max: 10, step: 0.5, default: 2 },
    ],
  },
];

// Lookups for referencing a curve by name (used by the filters + editor).
export const CURVE_BY_NAME: Record<string, Curve> = Object.fromEntries(
  CURVES.map((c) => [c.name, c])
);

export const CURVE_NAMES: string[] = CURVES.map((c) => c.name);

// The default constants for a curve, as a plain params object.
export function defaultParamsFor(name: string): Params {
  const curve = CURVE_BY_NAME[name];
  return Object.fromEntries((curve?.params ?? []).map((p) => [p.key, p.default]));
}
