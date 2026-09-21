// -----------------------------------------------------------------------------
// Score preset type + matchers
// -----------------------------------------------------------------------------
// The preset list itself lives in scorePresets.data.
import { type Params } from "./curves.functions";
import { SCORE_PRESETS } from "./scorePresets.data";

export type ScorePreset = {
  name: string;
  description: string;
  scoreName: string; // must match a curve name in CURVES
  params: Params;
};

// Does a filter's current (scoreName + params) match this preset exactly?
export function matchesPreset(
  preset: ScorePreset,
  scoreName: string,
  params: Params
): boolean {
  if (preset.scoreName !== scoreName) return false;
  const keys = new Set([
    ...Object.keys(preset.params),
    ...Object.keys(params),
  ]);
  for (const k of keys) {
    if (preset.params[k] !== params[k]) return false;
  }
  return true;
}

// The preset matching the given config, if any.
export function activePreset(
  scoreName: string,
  params: Params
): ScorePreset | undefined {
  return SCORE_PRESETS.find((p) => matchesPreset(p, scoreName, params));
}
