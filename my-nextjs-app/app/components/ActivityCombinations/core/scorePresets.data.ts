// -----------------------------------------------------------------------------
// Score presets — common (curve + params) combinations (the data)
// -----------------------------------------------------------------------------
// These are the MAIN way to set a filter's scoring: each preset is a named,
// ready-made pairing of a curve from curves with sensible constants. The
// "Advanced" editor still lets you pick any curve and tune its params by hand.
// The ScorePreset type + matchers live in scorePresets.functions.
import type { ScorePreset } from "./scorePresets.functions";

export const SCORE_PRESETS: ScorePreset[] = [
  {
    name: "Ceiling",
    description: "Full score up to the target, then drops off sharply (a budget cap).",
    scoreName: "Asymmetric linear",
    params: { under: 0, over: 100 },
  },
  {
    name: "Linear",
    description: "Score falls evenly the further the value is from the target.",
    scoreName: "Linear (symmetric)",
    params: { slope: 1 },
  },
  {
    name: "Strict",
    description: "Only values very close to the target score well; steep penalty otherwise.",
    scoreName: "Quadratic",
    params: { curvature: 1 },
  },
  {
    name: "Tolerant",
    description: "Forgiving — a wide band around the target still scores highly.",
    scoreName: "Gaussian",
    params: { width: 3, peak: 10 },
  },
  {
    name: "Soft floor",
    description: "Like linear, but the score never drops below a baseline.",
    scoreName: "Linear with floor",
    params: { slope: 1.5, floor: 3 },
  },
];
