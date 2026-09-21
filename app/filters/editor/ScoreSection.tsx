// Scoring editor. Default = preset buttons (common function+param combos).
// "Advanced" reveals the raw curve dropdown + its param sliders.
import { useState } from "react";
import { CURVE_NAMES } from "@/app/components/ActivityCombinations/core/curves.data";
import { type Curve } from "@/app/components/ActivityCombinations/core/curves.functions";
import { SCORE_PRESETS } from "@/app/components/ActivityCombinations/core/scorePresets.data";
import { activePreset } from "@/app/components/ActivityCombinations/core/scorePresets.functions";
import { type EditableFilter } from "@/app/components/ActivityCombinations/core/filterStore.functions";
import { inputClass, fieldLabel } from "./editorShared";
import { type EditorActions } from "./useEditorActions";

export function ScoreSection({
  filter,
  filterIndex,
  curve,
  actions,
}: {
  filter: EditableFilter;
  filterIndex: number;
  curve: Curve | undefined;
  actions: EditorActions;
}) {
  const current = activePreset(filter.scoreName, filter.params);
  // Open Advanced automatically when the config matches no preset.
  const [advanced, setAdvanced] = useState(!current);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={fieldLabel}>Scoring</span>
        <button
          type="button"
          onClick={() => setAdvanced((a) => !a)}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          {advanced ? "Use presets" : "Advanced"}
        </button>
      </div>

      {/* Preset buttons — the main way to choose a scoring shape. */}
      <div className="flex flex-wrap gap-2">
        {SCORE_PRESETS.map((preset) => {
          const active = current?.name === preset.name;
          return (
            <button
              key={preset.name}
              type="button"
              title={preset.description}
              onClick={() =>
                actions.applyPreset(filterIndex, preset.scoreName, preset.params)
              }
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-300"
                  : "border-black/[.08] text-zinc-700 hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      {/* The active preset's description, or a note when fully custom. */}
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        {current?.description ?? "Custom scoring — tune it in Advanced below."}
      </p>

      {/* Advanced: raw curve + param sliders. */}
      {advanced && (
        <div className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-3 dark:border-white/[.145]">
          <label className="flex flex-col gap-1">
            <span className={fieldLabel}>Function</span>
            <select
              className={inputClass}
              value={filter.scoreName}
              onChange={(e) => actions.changeScore(filterIndex, e.target.value)}
            >
              {CURVE_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          {(curve?.params ?? []).map((p) => (
            <label
              key={p.key}
              className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <span className="w-40 shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {p.label}: {(filter.params[p.key] ?? p.default).toFixed(2)}
              </span>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={filter.params[p.key] ?? p.default}
                onChange={(e) =>
                  actions.setParam(filterIndex, p.key, Number(e.target.value))
                }
                className="w-full"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
