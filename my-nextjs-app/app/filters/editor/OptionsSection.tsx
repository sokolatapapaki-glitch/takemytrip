// The "Options" block: header (+ Add for single-select) and a row per option.
import { type Curve } from "@/app/components/ActivityCombinations/core/curves.functions";
import { type EditableFilter } from "@/app/components/ActivityCombinations/core/filterStore.functions";
import { type Unit } from "@/app/components/ActivityCombinations/core/filters.functions";
import { fieldLabel, targetSliderConfig } from "./editorShared";
import { OptionRow } from "./OptionRow";
import { type EditorActions } from "./useEditorActions";

export function OptionsSection({
  filter,
  filterIndex,
  curve,
  unit,
  multi,
  actions,
}: {
  filter: EditableFilter;
  filterIndex: number;
  curve: Curve | undefined;
  unit?: Unit;
  multi: boolean;
  actions: EditorActions;
}) {
  const slider = targetSliderConfig(filter, filterIndex, unit);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={fieldLabel}>Options</span>
        {!multi && (
          <button
            type="button"
            onClick={() => actions.addOption(filterIndex)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            + Add option
          </button>
        )}
      </div>

      {filter.options.map((opt, oi) => (
        <OptionRow
          key={oi}
          option={opt}
          optionIndex={oi}
          curve={curve}
          params={filter.params}
          unit={unit}
          slider={slider}
          canRemove={!multi}
          onPatch={(i, patch) => actions.patchOption(filterIndex, i, patch)}
          onRemove={(i) => actions.removeOption(filterIndex, i)}
        />
      ))}
    </div>
  );
}
