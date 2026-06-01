// One editable option: name, target slider (with index note), curve preview,
// and a remove button for single-select filters.
import { CurveGraph } from "@/app/components/ActivityCombinations/CurveGraph";
import { type Curve, type Params } from "@/app/components/ActivityCombinations/core/curves.functions";
import { type EditableOption } from "@/app/components/ActivityCombinations/core/filterStore.functions";
import { type Unit } from "@/app/components/ActivityCombinations/core/filters.functions";
import { inputClass, fieldLabel, formatTarget } from "./editorShared";

export function OptionRow({
  option,
  optionIndex,
  curve,
  params,
  unit,
  slider,
  canRemove,
  onPatch,
  onRemove,
}: {
  option: EditableOption;
  optionIndex: number;
  curve: Curve | undefined;
  params: Params;
  unit?: Unit;
  slider: { min: number; max: number; step: number };
  canRemove: boolean;
  onPatch: (oi: number, patch: Partial<EditableOption>) => void;
  onRemove: (oi: number) => void;
}) {
  const indexValue = unit ? unit.toIndex(option.target) : option.target;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-3 sm:flex-row sm:items-start dark:border-white/[.145]">
      {/* name field (label above input) */}
      <label className="flex flex-1 flex-col gap-1">
        <span className={fieldLabel}>Name</span>
        <input
          className={inputClass}
          value={option.name}
          onChange={(e) => onPatch(optionIndex, { name: e.target.value })}
        />
      </label>

      {/* target slider */}
      <label className="flex flex-1 flex-col gap-1 sm:max-w-sm">
        <span className={fieldLabel}>
          {unit ? unit.label : "Target (0-10)"}: {formatTarget(option.target, unit)}
        </span>
        <input
          type="range"
          min={slider.min}
          max={slider.max}
          step={slider.step}
          value={option.target}
          onChange={(e) =>
            onPatch(optionIndex, { target: Number(e.target.value) })
          }
          className="w-full"
        />
        {unit && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            index {indexValue.toFixed(2)}
          </span>
        )}
      </label>

      {curve && (
        <div className="w-full sm:w-56">
          <CurveGraph
            fn={curve.fn}
            params={params}
            targets={[indexValue]}
            color={curve.color}
          />
        </div>
      )}

      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(optionIndex)}
          className="self-start rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50 sm:mt-5 dark:hover:bg-red-950/40"
          aria-label="Remove option"
        >
          ✕
        </button>
      )}
    </div>
  );
}
