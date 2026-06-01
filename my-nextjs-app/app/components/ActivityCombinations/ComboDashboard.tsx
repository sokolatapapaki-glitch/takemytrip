import { formatTime, type Activity } from "./core/activities.functions";
import {
  Filter,
  Selection,
  scoreBreakdown,
  type FilterBreakdown,
} from "./core/filters.functions";
import type { Params } from "./core/curves.functions";
import type { ComboSchedule } from "./core/schedule.functions";
import { CurveGraph } from "./CurveGraph";

// A short, human-readable formula for the curves the filters actually use, so
// the raw number below it can be checked by hand. Falls back to the name.
function formulaText(scoreName: string, p: Params): string {
  switch (scoreName) {
    case "Linear (symmetric)":
      return `10 − ${p.slope}·|value − target|`;
    case "Asymmetric linear":
      return `10 − (value < target ? ${p.under} : ${p.over})·|value − target|`;
    default:
      return scoreName;
  }
}

const n = (x: number) => x.toFixed(2);

// One filter's contribution, broken down option by option.
function FilterBlock({ f }: { f: FilterBreakdown }) {
  return (
    <div className="rounded-lg border border-black/[.06] bg-zinc-50 p-3 dark:border-white/[.1] dark:bg-zinc-950/50">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {f.filterName}
          {f.realWorld ? (
            <span className="ml-2 font-normal text-zinc-400 dark:text-zinc-500">
              combo total {f.realWorld}
            </span>
          ) : null}
        </span>
        <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
          weight {n(f.weight)}
        </span>
      </div>
      <p className="mb-2 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
        {f.scoreName}: score = {formulaText(f.scoreName, f.params)}
      </p>

      {f.options.length === 0 ? (
        <p className="text-xs italic text-zinc-400 dark:text-zinc-500">
          No option selected — contributes 0.
        </p>
      ) : (
        <>
        {/* The curve this filter scores with: x = the combo's index value,
            y = the resulting score. Dashed lines mark each selected option's
            target; the dot is where THIS combo actually lands. */}
        <div className="mb-2">
          <CurveGraph
            fn={f.fn}
            params={f.params}
            color={f.curveColor}
            targets={f.options.map((o) => o.targetIdx)}
            points={f.options.map((o) => ({ value: o.value, score: o.clamped }))}
          />
          <p className="mt-1 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
            index value (x) → score (y) · dashed = target · dot = this combo
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          {f.options.map((o) => (
            <div
              key={o.optionName}
              className="rounded-md bg-white px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <div className="mb-0.5 font-sans text-xs font-medium text-zinc-700 dark:text-zinc-200">
                {o.optionName}
              </div>
              <div>
                value (index) = <span className="text-zinc-800 dark:text-zinc-100">{n(o.value)}</span>
                {"  ·  "}
                target = {n(o.realTarget)}
                {f.unitSuffix ? f.unitSuffix : ""} → index {n(o.targetIdx)}
              </div>
              <div>
                raw = {n(o.raw)} → clamp 0–10 = {n(o.clamped)} × weight {n(o.weight)}{" "}
                = <span className="font-semibold text-green-600 dark:text-green-400">{n(o.contribution)}</span>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      <div className="mt-1.5 text-right text-xs text-zinc-500 dark:text-zinc-400">
        subtotal ={" "}
        <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-200">
          {n(f.subtotal)}
        </span>
      </div>
    </div>
  );
}

// The drop-down "why this rank" panel for a single combo: the full score math
// plus the scheduling feasibility that decides whether it fits the day.
export function ComboDashboard({
  combo,
  selection,
  filters,
  plan,
  startHour,
  endHour,
}: {
  combo: Activity[];
  selection: Selection;
  filters: Filter[];
  plan: ComboSchedule;
  startHour: number;
  endHour: number;
}) {
  const bd = scoreBreakdown(combo, selection, filters);

  return (
    <div className="mt-3 rounded-lg border border-black/[.08] bg-white/60 p-3 dark:border-white/[.145] dark:bg-zinc-950/40">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Why this rank
      </h4>

      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        The score is the sum, over every selected filter option, of{" "}
        <span className="font-mono">weight × clamp₀₋₁₀(curve(value, target))</span>.
        Each value and target is on a 0–10 scale. A filter that doesn&apos;t apply
        to this combo (e.g. route directness needs 3+ stops) is left out entirely,
        not scored as 0 — so only the filters below count toward the total.
      </p>

      <div className="flex flex-col gap-2">
        {bd.filters.map((f) => (
          <FilterBlock key={f.filterName} f={f} />
        ))}
      </div>

      <div className="mt-2 flex items-baseline justify-between rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800/60">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Total score
        </span>
        <span className="font-mono text-sm font-semibold text-green-600 dark:text-green-400">
          {bd.filters.map((f) => n(f.subtotal)).join(" + ")} = {n(bd.total)}
        </span>
      </div>

      {/* Scheduling proof: ranking is by score, but feasibility decides fit. */}
      <h4 className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Schedule check
      </h4>
      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
        Day window {formatTime(startHour)}–{formatTime(endHour)}. Activities run
        back-to-back from the start, waiting for each to open and finishing before
        it closes. A lunch break is required in every 2+ combo and must start by
        4&nbsp;PM. Combos that can&apos;t fit their opening windows (or that lunch)
        are filtered out of the list entirely — so a combo only appears here when
        every window is satisfied; the only remaining way to &quot;not fit&quot;
        is running past the day&apos;s time budget.
      </p>
      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
        Of the{" "}
        <span className="font-medium text-zinc-600 dark:text-zinc-300">
          {plan.feasibleOrderings}
        </span>{" "}
        ordering{plan.feasibleOrderings === 1 ? "" : "s"} of these activities that
        schedule legally, the one shown is the{" "}
        <span className="font-medium text-zinc-600 dark:text-zinc-300">
          straightest route
        </span>{" "}
        — linearity{" "}
        <span className="font-mono">{plan.linearity.toFixed(1)}/10</span>{" "}
        (feasibility is settled first; linearity only chooses among the legal
        orderings, it doesn&apos;t change the score).
      </p>
      <ol className="flex flex-col gap-0.5 font-mono text-[11px]">
        {plan.items.map((item) => (
          <li key={item.name} className="flex items-baseline gap-2">
            <span
              className={
                item.closed
                  ? "w-24 shrink-0 text-amber-600 dark:text-amber-400"
                  : "w-24 shrink-0 text-zinc-400 dark:text-zinc-500"
              }
            >
              {item.closed
                ? "closed"
                : `${formatTime(item.start)}–${formatTime(item.end)}`}
            </span>
            <span className="text-zinc-600 dark:text-zinc-300">
              {item.name}
              {item.lunch ? " (lunch)" : ""}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-1.5 text-xs">
        Ends {formatTime(plan.endsAt)} —{" "}
        {plan.feasible ? (
          <span className="text-zinc-500 dark:text-zinc-400">
            within {formatTime(endHour)}, so it fits the day.
          </span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400">
            past {formatTime(endHour)}, so it runs over the time budget (this
            doesn&apos;t change the score or the rank, only the fit flag).
          </span>
        )}
      </p>
    </div>
  );
}
