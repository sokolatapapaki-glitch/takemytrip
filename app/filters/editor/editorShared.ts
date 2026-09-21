// Shared styling constants + small helpers for the filters editor.
import { DEFAULT_EDITS } from "@/app/components/ActivityCombinations/core/filterStore.data";
import { type EditableFilter } from "@/app/components/ActivityCombinations/core/filterStore.functions";
import { type Unit } from "@/app/components/ActivityCombinations/core/filters.functions";

export const inputClass =
  "rounded-lg border border-black/[.08] bg-white px-3 py-1.5 text-sm text-zinc-800 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-100";

export const fieldLabel = "text-xs font-medium text-zinc-500 dark:text-zinc-400";

// Slider bounds for an option's target. Without a unit the target is a raw 0–10
// index; with one (hours/euros) we widen the max to cover the configured values.
export function targetSliderConfig(
  filter: EditableFilter,
  filterIndex: number,
  unit?: Unit
) {
  if (!unit) return { min: 0, max: 10, step: 0.1 };

  const defaultTargets =
    DEFAULT_EDITS[filterIndex]?.options.map((o) => o.target) ?? [];
  const currentTargets = filter.options.map((o) => o.target);
  const max = Math.max(10, ...defaultTargets, ...currentTargets);
  const step = unit.suffix === "€" ? 1 : 0.5;

  return { min: 0, max, step };
}

// Human-readable target label (e.g. "6.0h", "50€", or a bare index).
export function formatTarget(value: number, unit?: Unit): string {
  if (unit?.suffix === "€") return `${Math.round(value)}${unit.suffix}`;
  if (unit) return `${value.toFixed(1)}${unit.suffix}`;
  return value.toFixed(2);
}
