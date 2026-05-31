"use client";

import { useState } from "react";
import Link from "next/link";
import { CURVE_BY_NAME, CURVE_NAMES, defaultParamsFor } from "./curves";
import {
  DEFAULT_EDITS,
  EditableFilter,
  filterUnit,
  isMulti,
  useFilterEdits,
} from "./filterStore";
import { CurveGraph } from "./CurveGraph";
import { type Unit } from "./filters";

const inputClass =
  "rounded-lg border border-black/[.08] bg-white px-3 py-1.5 text-sm text-zinc-800 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-100";

const fieldLabel =
  "text-xs font-medium text-zinc-500 dark:text-zinc-400";

const targetSliderConfig = (
  filter: EditableFilter,
  filterIndex: number,
  unit?: Unit
) => {
  if (!unit) return { min: 0, max: 10, step: 0.1 };

  const defaultTargets =
    DEFAULT_EDITS[filterIndex]?.options.map((option) => option.target) ?? [];
  const currentTargets = filter.options.map((option) => option.target);
  const max = Math.max(10, ...defaultTargets, ...currentTargets);
  const step = unit.suffix === "€" ? 1 : 0.5;

  return { min: 0, max, step };
};

const formatTarget = (value: number, unit?: Unit) => {
  if (unit?.suffix === "€") return `${Math.round(value)}${unit.suffix}`;
  if (unit) return `${value.toFixed(1)}${unit.suffix}`;
  return value.toFixed(2);
};

export default function FiltersEditor() {
  // Reads from + writes to the shared store (auto-persisted to localStorage).
  const [edits, setEdits] = useFilterEdits();

  // Which filters are expanded (collapsed by default — a dropdown per filter).
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const toggleOpen = (fi: number) =>
    setOpen((prev) => ({ ...prev, [fi]: !prev[fi] }));

  // ---- mutation helpers --------------------------------------------------
  const patchFilter = (fi: number, patch: Partial<EditableFilter>) =>
    setEdits((prev) => prev.map((f, i) => (i === fi ? { ...f, ...patch } : f)));

  const changeScore = (fi: number, scoreName: string) =>
    patchFilter(fi, { scoreName, params: defaultParamsFor(scoreName) });

  const setParam = (fi: number, key: string, value: number) =>
    setEdits((prev) =>
      prev.map((f, i) =>
        i === fi ? { ...f, params: { ...f.params, [key]: value } } : f
      )
    );

  const patchOption = (
    fi: number,
    oi: number,
    patch: Partial<{ name: string; target: number }>
  ) =>
    setEdits((prev) =>
      prev.map((f, i) =>
        i === fi
          ? {
              ...f,
              options: f.options.map((o, j) =>
                j === oi ? { ...o, ...patch } : o
              ),
            }
          : f
      )
    );

  const addOption = (fi: number) =>
    setEdits((prev) =>
      prev.map((f, i) =>
        i === fi
          ? { ...f, options: [...f.options, { name: "New option", target: 5 }] }
          : f
      )
    );

  const removeOption = (fi: number, oi: number) =>
    setEdits((prev) =>
      prev.map((f, i) =>
        i === fi ? { ...f, options: f.options.filter((_, j) => j !== oi) } : f
      )
    );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
          Edit filters
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEdits(DEFAULT_EDITS)}
            className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Reset to defaults
          </button>
          <Link
            href="/"
            className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Done
          </Link>
        </div>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Changes save automatically and apply to the ranking on the results page.
      </p>

      {edits.map((filter, fi) => {
        const curve = CURVE_BY_NAME[filter.scoreName];
        const unit = filterUnit(fi);
        const targetConfig = targetSliderConfig(filter, fi, unit);
        const isOpen = !!open[fi];
        return (
          <section
            key={fi}
            className="overflow-hidden rounded-xl border border-black/[.08] dark:border-white/[.145]"
          >
            {/* Filter name = the dropdown toggle (name shown on top, not editable) */}
            <button
              type="button"
              onClick={() => toggleOpen(fi)}
              className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                {filter.name}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {filter.scoreName} {isOpen ? "▾" : "▸"}
              </span>
            </button>

            {isOpen && (
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
                      patchFilter(fi, { weight: Number(e.target.value) })
                    }
                  />
                </label>

                {/* hint */}
                <label className="flex flex-col gap-1">
                  <span className={fieldLabel}>Hint</span>
                  <input
                    className={inputClass}
                    value={filter.hint}
                    onChange={(e) => patchFilter(fi, { hint: e.target.value })}
                  />
                </label>

                {/* score function + params */}
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <span className={fieldLabel}>Score function</span>
                    <select
                      className={inputClass}
                      value={filter.scoreName}
                      onChange={(e) => changeScore(fi, e.target.value)}
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
                          setParam(fi, p.key, Number(e.target.value))
                        }
                        className="w-full"
                      />
                    </label>
                  ))}
                </div>

                {/* options */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={fieldLabel}>Options</span>
                    {!isMulti(fi) && (
                      <button
                        type="button"
                        onClick={() => addOption(fi)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        + Add option
                      </button>
                    )}
                  </div>

                  {filter.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-3 sm:flex-row sm:items-start dark:border-white/[.145]"
                    >
                      {/* name field (label above input) */}
                      <label className="flex flex-1 flex-col gap-1">
                        <span className={fieldLabel}>Name</span>
                        <input
                          className={inputClass}
                          value={opt.name}
                          onChange={(e) =>
                            patchOption(fi, oi, { name: e.target.value })
                          }
                        />
                      </label>

                      {/* target slider */}
                      <label className="flex flex-1 flex-col gap-1 sm:max-w-sm">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {unit ? unit.label : "Target (0-10)"}:{" "}
                          {formatTarget(opt.target, unit)}
                        </span>
                        <input
                          type="range"
                          min={targetConfig.min}
                          max={targetConfig.max}
                          step={targetConfig.step}
                          value={opt.target}
                          onChange={(e) =>
                            patchOption(fi, oi, { target: Number(e.target.value) })
                          }
                          className="w-full"
                        />
                        {unit && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            index {unit.toIndex(opt.target).toFixed(2)}
                          </span>
                        )}
                      </label>

                      {curve && (
                        <div className="w-full sm:w-56">
                          <CurveGraph
                            fn={curve.fn}
                            params={filter.params}
                            targets={[
                              unit ? unit.toIndex(opt.target) : opt.target,
                            ]}
                            color={curve.color}
                          />
                        </div>
                      )}

                      {!isMulti(fi) && (
                        <button
                          type="button"
                          onClick={() => removeOption(fi, oi)}
                          className="self-start rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50 sm:mt-5 dark:hover:bg-red-950/40"
                          aria-label="Remove option"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
