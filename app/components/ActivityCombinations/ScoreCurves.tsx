"use client";

import { useState } from "react";
import { CURVES } from "./core/curves.data";
import type { Params, ScaleScore } from "./core/curves.functions";

// =============================================================================
// Graph geometry
// =============================================================================
const W = 380;
const H = 280;
const PAD = 36;
const MIN = 0;
const MAX = 10;
const STEP = 0.1;

const xOf = (value: number) => PAD + ((value - MIN) / (MAX - MIN)) * (W - 2 * PAD);
const yOf = (score: number) => H - PAD - ((score - MIN) / (MAX - MIN)) * (H - 2 * PAD);

function pathFor(fn: ScaleScore, target: number, p: Params): string {
  const points: string[] = [];
  for (let v = MIN; v <= MAX + 1e-9; v += STEP) {
    const score = Math.max(MIN, Math.min(MAX, fn(v, target, p)));
    points.push(`${xOf(v).toFixed(1)},${yOf(score).toFixed(1)}`);
  }
  return "M" + points.join(" L");
}

const TICKS = [0, 2, 4, 6, 8, 10];

// Build the default { curveName: { paramKey: value } } map.
function defaultParams(): Record<string, Params> {
  return Object.fromEntries(
    CURVES.map((c) => [
      c.name,
      Object.fromEntries(c.params.map((p) => [p.key, p.default])),
    ])
  );
}

// =============================================================================
// Component
// =============================================================================
export default function ScoreCurves() {
  const [target, setTarget] = useState(7);
  const [selectedName, setSelectedName] = useState(CURVES[0].name);
  const [paramValues, setParamValues] = useState<Record<string, Params>>(defaultParams);

  const selected = CURVES.find((c) => c.name === selectedName) ?? CURVES[0];
  const selectedParams = paramValues[selected.name];

  const setParam = (key: string, value: number) =>
    setParamValues((prev) => ({
      ...prev,
      [selected.name]: { ...prev[selected.name], [key]: value },
    }));

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          Scale-scoring curves
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          How the selected function scores an index value (x) against the target
          (dashed line). Tune its constants below.
        </p>
      </div>

      {/* Curve selector — pick one to show */}
      <div className="flex flex-wrap gap-2">
        {CURVES.map((curve) => {
          const active = curve.name === selectedName;
          return (
            <button
              key={curve.name}
              type="button"
              onClick={() => setSelectedName(curve.name)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-zinc-400 bg-zinc-100 text-zinc-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-100"
                  : "border-black/[.08] text-zinc-600 hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-400 dark:hover:bg-zinc-800/50"
              }`}
            >
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: curve.color }}
              />
              {curve.name}
            </button>
          );
        })}
      </div>

      {/* Graph */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-900"
      >
        {/* Grid + axis ticks */}
        {TICKS.map((t) => (
          <g key={`x${t}`}>
            <line
              x1={xOf(t)}
              y1={yOf(0)}
              x2={xOf(t)}
              y2={yOf(10)}
              className="stroke-black/[.05] dark:stroke-white/[.08]"
            />
            <text
              x={xOf(t)}
              y={H - PAD + 16}
              textAnchor="middle"
              className="fill-zinc-400 text-[10px] dark:fill-zinc-500"
            >
              {t}
            </text>
          </g>
        ))}
        {TICKS.map((t) => (
          <g key={`y${t}`}>
            <line
              x1={xOf(0)}
              y1={yOf(t)}
              x2={xOf(10)}
              y2={yOf(t)}
              className="stroke-black/[.05] dark:stroke-white/[.08]"
            />
            <text
              x={PAD - 8}
              y={yOf(t) + 3}
              textAnchor="end"
              className="fill-zinc-400 text-[10px] dark:fill-zinc-500"
            >
              {t}
            </text>
          </g>
        ))}

        {/* Axes */}
        <line x1={xOf(0)} y1={yOf(0)} x2={xOf(10)} y2={yOf(0)} className="stroke-zinc-300 dark:stroke-zinc-700" />
        <line x1={xOf(0)} y1={yOf(0)} x2={xOf(0)} y2={yOf(10)} className="stroke-zinc-300 dark:stroke-zinc-700" />

        {/* Axis labels */}
        <text x={W / 2} y={H - 4} textAnchor="middle" className="fill-zinc-500 text-[11px] dark:fill-zinc-400">
          index value
        </text>
        <text
          x={12}
          y={H / 2}
          textAnchor="middle"
          transform={`rotate(-90 12 ${H / 2})`}
          className="fill-zinc-500 text-[11px] dark:fill-zinc-400"
        >
          score
        </text>

        {/* Target line */}
        <line
          x1={xOf(target)}
          y1={yOf(0)}
          x2={xOf(target)}
          y2={yOf(10)}
          strokeDasharray="4 3"
          className="stroke-zinc-400 dark:stroke-zinc-500"
        />

        {/* Selected curve */}
        <path
          d={pathFor(selected.fn, target, selectedParams)}
          fill="none"
          stroke={selected.color}
          strokeWidth={2}
        />
      </svg>

      {/* Controls: target + the selected curve's constants */}
      <div className="flex flex-col gap-3 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]">
        <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
          <span className="w-40 shrink-0 font-medium">Target: {target.toFixed(1)}</span>
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={0.5}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <div className="h-px bg-black/[.06] dark:bg-white/[.1]" />

        {selected.params.map((param) => (
          <label
            key={param.key}
            className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <span className="w-40 shrink-0 font-medium">
              {param.label}: {selectedParams[param.key].toFixed(2)}
            </span>
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={selectedParams[param.key]}
              onChange={(e) => setParam(param.key, Number(e.target.value))}
              className="w-full"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
