"use client";

import { Fragment, useState } from "react";
import type { Activity, Coords } from "./core/activities.functions";
import { distanceKm, formatDistance, formatTime } from "./core/activities.functions";
import { ACTIVITIES } from "./core/activities.data";
import { Filter, Selection, comboScore, filterApplies, optionValue } from "./core/filters.functions";
import { scheduleCombo, scheduleEndHour } from "./core/schedule.functions";
import { ComboDashboard } from "./ComboDashboard";
import { ComboMap } from "./ComboMap";
import { ScheduledName } from "./ScheduledName";

// Look up an activity's map location by name (scheduled items carry only names).
// The generic lunch break has no entry here — and lunch slots are skipped for
// distances anyway.
const COORDS_BY_NAME = new Map<string, Coords>(
  ACTIVITIES.map((a) => [a.name, a.coords])
);

// Look up the full activity by name, so a scheduled row can show its weekly
// opening hours. Lunch slots have no entry (they aren't catalogue activities).
const ACTIVITY_BY_NAME = new Map<string, Activity>(
  ACTIVITIES.map((a) => [a.name, a])
);

// A stable identity for a combo (independent of its rank), so an open dashboard
// stays open even when re-sorting moves the combo up or down the list.
const comboKey = (combo: Activity[]): string =>
  combo.map((a) => a.name).join("|");

// Per-filter readout for one combo: the selected options and their values.
function filterSummary(
  filter: Filter,
  filterIndex: number,
  combo: Activity[],
  selection: Selection
): string {
  const picked = selection[filterIndex] ?? [];
  if (picked.length === 0) return `${filter.name}: any`;

  const parts = picked.map((i) => {
    const option = filter.options[i];
    if (!option) return "";
    if (filter.multi) {
      return `${option.name} ${optionValue(filter, option)(combo).toFixed(1)}`;
    }
    // Single-select: prefer the real-world label (e.g. "12h", "€80").
    return filter.format
      ? filter.format(combo)
      : optionValue(filter, option)(combo).toFixed(1);
  });

  return `${filter.name}: ${parts.filter(Boolean).join(", ")}`;
}

// The ranked list of activity combinations for the current filter selection.
export function ComboResults({
  filters,
  combinations,
  selection,
  startHour,
  day,
}: {
  filters: Filter[];
  combinations: Activity[][];
  selection: Selection;
  startHour: number;
  day: number;
}) {
  // The plan ends at the start hour + the chosen time budget (e.g. 12:00 + 10h
  // -> 22:00).
  const endHour = scheduleEndHour(filters, selection, startHour);

  // Which combos' "why this rank" dashboards / maps are open. Each is a Set so
  // several can stay open at once; keyed by combo identity so re-sorting doesn't
  // toggle them.
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [openMaps, setOpenMaps] = useState<Set<string>>(new Set());
  const toggleIn =
    (setter: typeof setOpenKeys) => (key: string) =>
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
  const toggle = toggleIn(setOpenKeys);
  const toggleMap = toggleIn(setOpenMaps);

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
        Combinations ({combinations.length})
      </h2>
      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
        Day runs {formatTime(startHour)}–{formatTime(endHour)}. Ranked for your
        filters:{" "}
        {filters
          .map((f, fi) => {
            const picked = selection[fi] ?? [];
            const names = picked.length
              ? picked.map((i) => f.options[i]?.name).filter(Boolean).join(" / ")
              : "any";
            return `${f.name} — ${names}`;
          })
          .join(" · ")}
        .
      </p>
      <div className="flex flex-col gap-2">
        {combinations.map((combo, index) => {
          const score = comboScore(combo, selection, filters);
          const plan = scheduleCombo(combo, day, startHour, endHour);
          const key = comboKey(combo);
          const open = openKeys.has(key);
          const mapOpen = openMaps.has(key);
          // Activities in visiting order, lunch excluded, with coords for the map.
          const stops = plan.items
            .filter((it) => !it.lunch)
            .map((it) => ({ name: it.name, coords: COORDS_BY_NAME.get(it.name) }))
            .filter((s): s is { name: string; coords: NonNullable<typeof s.coords> } =>
              s.coords !== undefined
            );
          return (
            <div
              key={index}
              className="rounded-xl border border-black/[.08] bg-white px-5 py-3 dark:border-white/[.145] dark:bg-zinc-900"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-zinc-400 dark:text-zinc-500">
                  {filters
                    .map((f, fi) =>
                      filterApplies(f, combo)
                        ? filterSummary(f, fi, combo, selection)
                        : null
                    )
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  score {score.toFixed(2)}
                </span>
              </div>

              {/* Timed itinerary: ordered to respect each activity's hours.
                  Between two directly-adjacent activities we show the
                  straight-line distance. When a lunch slot sits between two
                  activities, we bridge it: the distance shown is between the
                  activity before lunch and the one after it. */}
              <ol className="flex flex-col gap-0.5">
                {plan.items.map((item, i) => {
                  const next = plan.items[i + 1];
                  let leg: { km: number; label?: string } | null = null;
                  if (next && !item.lunch && !next.lunch) {
                    // Two directly-adjacent activities.
                    const a = COORDS_BY_NAME.get(item.name);
                    const b = COORDS_BY_NAME.get(next.name);
                    if (a && b) leg = { km: distanceKm(a, b) };
                  } else if (item.lunch && next) {
                    // Bridge the lunch: distance from the activity before it to
                    // the one after it (the two it sits between).
                    const prev = plan.items[i - 1];
                    const a = prev ? COORDS_BY_NAME.get(prev.name) : undefined;
                    const b = COORDS_BY_NAME.get(next.name);
                    if (prev && a && b)
                      leg = { km: distanceKm(a, b), label: `${prev.name} → ${next.name}` };
                  }
                  return (
                    <Fragment key={item.name}>
                      <li className="flex items-baseline gap-3 text-zinc-800 dark:text-zinc-100">
                        <span
                          className={`w-28 shrink-0 font-mono text-xs ${
                            item.closed
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {item.closed
                            ? "closed"
                            : `${formatTime(item.start)}–${formatTime(item.end)}`}
                        </span>
                        <ScheduledName
                          item={item}
                          activity={ACTIVITY_BY_NAME.get(item.name)}
                          day={day}
                        />
                      </li>
                      {leg != null ? (
                        <li className="flex items-baseline gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                          <span className="w-28 shrink-0" />
                          <span>
                            ↓ {formatDistance(leg.km)}
                            {leg.label ? (
                              <span className="text-zinc-300 dark:text-zinc-600">
                                {" "}· {leg.label}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ) : null}
                    </Fragment>
                  );
                })}
              </ol>

              <div className="mt-1.5 flex items-center justify-between gap-3">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                  {plan.feasible ? (
                    <span className="text-zinc-400 dark:text-zinc-500">
                      Ends {formatTime(plan.endsAt)} · fits the day
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      Ends {formatTime(plan.endsAt)} · doesn&apos;t fit (opening
                      hours or budget)
                    </span>
                  )}
                  {/* The chosen route is the straightest of the legal orderings;
                      show how direct it is and how many orderings were legal. */}
                  <span className="text-zinc-400 dark:text-zinc-500">
                    · linearity {plan.linearity.toFixed(1)}/10
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500">
                    · {plan.feasibleOrderings}{" "}
                    {plan.feasibleOrderings === 1 ? "feasible ordering" : "feasible orderings"}
                  </span>
                </p>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMap(key)}
                    aria-expanded={mapOpen}
                    className="rounded-lg border border-black/[.08] px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {mapOpen ? "Hide map ▲" : "Map ▼"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    aria-expanded={open}
                    className="rounded-lg border border-black/[.08] px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {open ? "Hide breakdown ▲" : "Why this rank? ▼"}
                  </button>
                </div>
              </div>

              {mapOpen ? <ComboMap stops={stops} /> : null}

              {open ? (
                <ComboDashboard
                  combo={combo}
                  selection={selection}
                  filters={filters}
                  plan={plan}
                  startHour={startHour}
                  endHour={endHour}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
