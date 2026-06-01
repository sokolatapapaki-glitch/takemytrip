// =============================================================================
// Scale-scoring functions + their type definitions
// =============================================================================
// Each curve maps an index value (0–10) to a score given a target, shaped by a
// set of CONSTANTS (curvature, intensity, width, ...). Scores may fall outside
// 0–10; callers clamp as needed.
//
// Signature: (value, target, params) => score.
//
// The named functions below are the source of truth. The CURVES table (in
// curves.data) wraps them with display metadata + slider ranges for the graph
// showcase, and is also what the filters reference by name.
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
// Showcase metadata types (used by the ScoreCurves graph + the CURVES table)
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
