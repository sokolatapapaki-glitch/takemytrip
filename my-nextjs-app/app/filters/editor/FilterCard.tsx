// One collapsible filter card: the (non-editable) name acts as the dropdown
// toggle; expanding reveals weight, hint, the score section, and the options.
import { useState } from "react";
import { CURVE_BY_NAME } from "@/app/components/ActivityCombinations/core/curves.data";
import {
  filterUnit,
  isMulti,
  type EditableFilter,
} from "@/app/components/ActivityCombinations/core/filterStore.functions";
import { activePreset } from "@/app/components/ActivityCombinations/core/scorePresets.functions";
import { inputClass, fieldLabel } from "./editorShared";
import { ScoreSection } from "./ScoreSection";
import { OptionsSection } from "./OptionsSection";
import { type EditorActions } from "./useEditorActions";

export function FilterCard({
  filter,
  filterIndex,
  actions,
}: {
  filter: EditableFilter;
  filterIndex: number;
  actions: EditorActions;
}) {
  const [open, setOpen] = useState(false);
  const curve = CURVE_BY_NAME[filter.scoreName];
  const unit = filterUnit(filterIndex);
  const multi = isMulti(filterIndex);
  // Show the friendly preset name in the header when one matches; else "Custom".
  const scoringLabel =
    activePreset(filter.scoreName, filter.params)?.name ?? "Custom";

  return (
    <section className="overflow-hidden rounded-xl border border-black/[.08] dark:border-white/[.145]">
      {/* Filter name = the dropdown toggle (shown on top, not editable). */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      >
        <span className="font-semibold text-zinc-800 dark:text-zinc-100">
          {filter.name}
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {scoringLabel} {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-black/[.08] p-5 dark:border-white/[.145]">
          {/* weight */}
          <label className="flex w-32 flex-col gap-1">
            <span className={fieldLabel}>Weight</span>
            <input
              type="number"
              step={0.05}
              className={inputClass}
              value={filter.weight}
              onChange={(e) =>
                actions.patchFilter(filterIndex, {
                  weight: Number(e.target.value),
                })
              }
            />
          </label>

          {/* hint */}
          <label className="flex flex-col gap-1">
            <span className={fieldLabel}>Hint</span>
            <input
              className={inputClass}
              value={filter.hint}
              onChange={(e) =>
                actions.patchFilter(filterIndex, { hint: e.target.value })
              }
            />
          </label>

          <ScoreSection
            filter={filter}
            filterIndex={filterIndex}
            curve={curve}
            actions={actions}
          />

          <OptionsSection
            filter={filter}
            filterIndex={filterIndex}
            curve={curve}
            unit={unit}
            multi={multi}
            actions={actions}
          />
        </div>
      )}
    </section>
  );
}
