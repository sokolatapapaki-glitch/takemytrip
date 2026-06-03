"use client";

import type { ReactNode } from "react";
import { DAYS } from "./core/activities.data";
import type {
  Filter,
  Selection,
  TripIndexProof,
  UseAllBreakdown,
} from "./core/filters.functions";
import type { Params } from "./core/curves.functions";
import type { LeftoverReason, Trip } from "./core/trip.functions";
import { ComboDashboard } from "./ComboDashboard";
import { ComboMap } from "./ComboMap";
import { CurveGraph } from "./CurveGraph";

const n2 = (x: number) => x.toFixed(2);

// Compact, checkable formula for the curves a trip-level index is likely to use.
// `varName` is the index's x-variable (e.g. "left out").
function tripFormula(scoreName: string, varName: string, p: Params): string {
  switch (scoreName) {
    case "Linear (symmetric)":
      return `10 − ${p.slope}·|${varName} − target|`;
    case "Asymmetric linear":
      return `10 − (${varName} < target ? ${p.under} : ${p.over})·|${varName} − target|`;
    default:
      return scoreName;
  }
}

// One trip-level index's proof: a curve graph + the value → score → × weight
// math, weighted then ADDED to the day average.
function TripIndexBlock({
  title,
  badge,
  varName,
  xCaption,
  valueLine,
  proof,
}: {
  title: string; // the index name, e.g. "Use every activity"
  badge: string; // small grey caption beside the title (the trip's real value)
  varName: string; // the x-variable in the formula ("left out")
  xCaption: string; // caption under the curve graph
  valueLine: ReactNode; // the "value = … · target = …" line
  proof: TripIndexProof;
}) {
  return (
    <div className="mt-3 rounded-lg border border-black/[.06] bg-zinc-50 p-3 dark:border-white/[.1] dark:bg-zinc-950/50">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {title}
          <span className="ml-2 font-normal text-zinc-400 dark:text-zinc-500">
            {badge}
          </span>
        </span>
        <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
          weight {n2(proof.weight)}
        </span>
      </div>
      <p className="mb-2 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
        {proof.scoreName}: score = {tripFormula(proof.scoreName, varName, proof.params)}
      </p>

      <div className="mb-2">
        <CurveGraph
          fn={proof.fn}
          params={proof.params}
          color={proof.curveColor}
          targets={[proof.targetIdx]}
          points={[{ value: proof.value, score: proof.clamped }]}
        />
        <p className="mt-1 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
          {xCaption}
        </p>
      </div>

      <div className="rounded-md bg-white px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
        <div>{valueLine}</div>
        <div>
          raw = {n2(proof.raw)} → clamp 0–10 = {n2(proof.clamped)} × weight{" "}
          {n2(proof.weight)} ={" "}
          <span className="font-semibold text-green-600 dark:text-green-400">
            {n2(proof.contribution)}
          </span>
        </div>
      </div>
    </div>
  );
}

// The "use every activity" term: how many placeable activities were left out.
function UseAllBlock({ u }: { u: UseAllBreakdown }) {
  const total = u.leftoverCount + u.placedCount;
  return (
    <TripIndexBlock
      title="Use every activity"
      badge={`using ${u.placedCount} · left out ${u.leftoverCount}`}
      varName="left out"
      xCaption="activities left out (x) → score (y) · dashed = target · dot = this trip"
      proof={u}
      valueLine={
        <>
          left out ={" "}
          <span className="text-zinc-800 dark:text-zinc-100">
            {u.leftoverCount}
          </span>{" "}
          of {total} placeable {"  ·  "}
          target = {n2(u.realTarget)}
        </>
      }
    />
  );
}

function leftoverText(reason: LeftoverReason): string {
  switch (reason) {
    case "closed":
      return "closed on all selected days";
    case "no-room":
      return "can't fit any day within the time budget";
    case "score":
      return "left out — placing it anywhere would lower the average score";
  }
}

// The "why this trip" proof: the trip score is the AVERAGE of the three days'
// combo scores, and this assignment maximizes it. We show the objective, the
// search result, then for EACH day the full combo proof reused verbatim — the
// route map (distances), the per-index curve graphs + calculations, and the
// schedule check — followed by the leftovers and why each was dropped.
export function TripDashboard({
  trip,
  selections,
  filters,
  startHours,
  endHours,
}: {
  trip: Trip;
  selections: Selection[]; // per day slot (each day's filter choices)
  filters: Filter[];
  startHours: number[]; // per day slot
  endHours: number[]; // per day slot
}) {
  const dayScores = trip.days.map((d) => d.score);

  return (
    <div className="mt-3 rounded-lg border border-black/[.08] bg-white/60 p-3 dark:border-white/[.145] dark:bg-zinc-950/40">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Why this trip
      </h4>

      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        The trip score is the <span className="font-mono">average</span> of the
        days&apos; combo scores (each day scored exactly like a combo)
        {trip.useAll && trip.useAll.weight > 0 ? (
          <span>
            {" "}plus a <span className="font-mono">use every activity</span> bonus that
            rewards leaving out fewer activities
          </span>
        ) : null}
        . We evaluated{" "}
        <span className="font-medium text-zinc-600 dark:text-zinc-300">
          {trip.evaluated.toLocaleString()}
        </span>{" "}
        legal assignments in{" "}
        <span className="font-medium text-zinc-600 dark:text-zinc-300">
          {trip.elapsedMs < 1 ? "<1" : Math.round(trip.elapsedMs).toLocaleString()} ms
        </span>{" "}
        — each activity on at most one day, every day a schedulable combo — and this
        one maximizes that objective
        {trip.exact ? (
          <span>
            , so it is the <span className="font-medium">true optimum</span>.
          </span>
        ) : (
          <span> (best found by heuristic search).</span>
        )}
      </p>

      <div className="mt-2 flex items-baseline justify-between rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800/60">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Day average
        </span>
        <span className="font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          ({dayScores.map(n2).join(" + ")}) / {dayScores.length} = {n2(trip.dayAverage)}
        </span>
      </div>

      {trip.useAll ? <UseAllBlock u={trip.useAll} /> : null}

      {trip.useAll ? (
        <div className="mt-2 flex items-baseline justify-between gap-2 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800/60">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Trip score
          </span>
          <span className="font-mono text-sm font-semibold text-green-600 dark:text-green-400">
            {n2(trip.dayAverage)} + {n2(trip.useAll.contribution)} = {n2(trip.score)}
          </span>
        </div>
      ) : null}

      {trip.secondBest != null ? (
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          The next-best trip averages{" "}
          <span className="font-mono">{n2(trip.secondBest)}</span>, so this one wins by{" "}
          <span className="font-mono">{n2(trip.score - trip.secondBest)}</span>.
        </p>
      ) : null}

      {/* Per-day proof — the same map + index graphs + calculations as a combo.
          Each day uses its OWN day's filters, start hour, and time budget. */}
      {trip.days.map((td, slot) => {
        const byName = new Map(td.activities.map((a) => [a.name, a.coords]));
        const stops = td.plan.items
          .filter((it) => !it.lunch)
          .map((it) => ({ name: it.name, coords: byName.get(it.name) }))
          .filter(
            (s): s is { name: string; coords: NonNullable<typeof s.coords> } =>
              s.coords !== undefined
          );

        return (
          <div key={td.day} className="mt-4 border-t border-black/[.06] pt-3 dark:border-white/[.1]">
            <div className="flex items-baseline justify-between gap-2">
              <h5 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {DAYS[td.day]}
              </h5>
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                day score {n2(td.score)} · {td.load.toFixed(1)}h
              </span>
            </div>

            {td.activities.length === 0 ? (
              <p className="mt-1 text-xs italic text-zinc-400 dark:text-zinc-500">
                Empty day — contributes 0 to the average.
              </p>
            ) : (
              <>
                <ComboMap stops={stops} />
                <ComboDashboard
                  combo={td.activities}
                  selection={selections[slot]}
                  filters={filters}
                  plan={td.plan}
                  startHour={startHours[slot]}
                  endHour={endHours[slot]}
                />
              </>
            )}
          </div>
        );
      })}

      {trip.leftover.length > 0 ? (
        <div className="mt-4 border-t border-black/[.06] pt-3 dark:border-white/[.1]">
          <h5 className="mb-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Not scheduled ({trip.leftover.length})
          </h5>
          <ul className="flex flex-col gap-1">
            {trip.leftover.map(({ activity, reason }) => (
              <li
                key={activity.name}
                className="flex flex-wrap items-baseline gap-x-2 text-xs text-zinc-500 dark:text-zinc-400"
              >
                <span className="text-zinc-700 dark:text-zinc-200">{activity.name}</span>
                <span className="text-zinc-400 dark:text-zinc-500">· {leftoverText(reason)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
