// =============================================================================
// Curve table + lookups (the data)
// =============================================================================
// CURVES wraps each scoring function (from curves.functions) with display
// metadata + slider ranges. `defaultParamsFor` is a lookup over CURVE_BY_NAME,
// so it lives here with the data it reads.
import {
  asymmetricGaussian,
  asymmetricLinear,
  boxcar,
  exponentialDecay,
  gaussian,
  linear,
  linearWithFloor,
  logisticPlateau,
  lorentzian,
  power,
  quadratic,
  raisedCosine,
  squareRoot,
  toleranceBand,
  type Curve,
  type Params,
} from "./curves.functions";

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
