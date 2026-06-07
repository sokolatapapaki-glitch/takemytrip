"use client";

import { Fragment, useState } from "react";
import type { Activity, Coords } from "./core/activities.functions";
import { distanceKm, formatDistance, formatTime, setActiveCity } from "./core/activities.functions";
import { DAYS } from "./core/activities.data";
import { ALL_ACTIVITIES, type City, type Area } from "./core/cities.data";
import { Filter, Selection, comboScore, filterApplies, optionValue } from "./core/filters.functions";
import { scheduleCombo, scheduleEndHour, type ComboSchedule } from "./core/schedule.functions";
import { ComboDashboard } from "./ComboDashboard";
import { ComboMap } from "./ComboMap";
import { ScheduledName } from "./ScheduledName";

// Look up an activity's map location by name (scheduled items carry only names).
// Built from EVERY city's catalogue (names are unique across cities), so the
// lookup is city-agnostic. The generic lunch break has no entry here — and lunch
// slots are skipped for distances anyway.
const COORDS_BY_NAME = new Map<string, Coords>(
  ALL_ACTIVITIES.map((a) => [a.name, a.coords])
);

// Look up the full activity by name, so a scheduled row can show its weekly
// opening hours. Lunch slots have no entry (they aren't catalogue activities).
const ACTIVITY_BY_NAME = new Map<string, Activity>(
  ALL_ACTIVITIES.map((a) => [a.name, a])
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

// One day's timed itinerary for a combo: a day heading, the ordered slots with
// inter-stop distances, and a one-line "fits / doesn't fit" + linearity summary.
// Pure in `plan` (already scheduled for `day`), so it's rendered once per day.
// `note` (optional) shows a small caption beside the weekday heading.
export function DayItinerary({
  plan,
  day,
  note,
  showSeeMore = false,
  connectors = false,
}: {
  plan: ComboSchedule;
  day: number;
  note?: string;
  // Opt-in (Trip component only): render a placeholder "See more" button on each
  // real activity row. Default off, so the combos list is unchanged.
  showSeeMore?: boolean;
  // Opt-in (Trip component only): draw a timeline rail (a dot per stop joined by a
  // vertical line) on the left, like the Penpot board. Default off.
  connectors?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {DAYS[day]}
        </h4>
        {note ? (
          <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
            {note}
          </span>
        ) : null}
      </div>

      {/* Timed itinerary: ordered to respect each activity's hours. Between two
          directly-adjacent activities we show the straight-line distance. When a
          lunch slot sits between two activities, we bridge it: the distance shown
          is between the activity before lunch and the one after it. */}
      <ol className={`flex flex-col ${connectors ? "gap-0" : "gap-0.5"}`}>
        {plan.items.map((item, i) => {
          const next = plan.items[i + 1];
          const isFirst = i === 0;
          const isLast = i === plan.items.length - 1;
          let leg: { km: number; label?: string } | null = null;
          if (next && !item.lunch && !next.lunch) {
            // Two directly-adjacent activities.
            const a = COORDS_BY_NAME.get(item.name);
            const b = COORDS_BY_NAME.get(next.name);
            if (a && b) leg = { km: distanceKm(a, b) };
          } else if (item.lunch && next) {
            // Bridge the lunch: distance from the activity before it to the one
            // after it (the two it sits between).
            const prev = plan.items[i - 1];
            const a = prev ? COORDS_BY_NAME.get(prev.name) : undefined;
            const b = COORDS_BY_NAME.get(next.name);
            if (prev && a && b)
              leg = { km: distanceKm(a, b), label: `${prev.name} → ${next.name}` };
          }
          return (
            <Fragment key={item.name}>
              <li
                className={`flex gap-3 text-zinc-800 dark:text-zinc-100 ${
                  connectors ? "items-start" : "items-baseline"
                }`}
              >
                {connectors ? (
                  // Timeline rail: a dot for this stop, joined to the stops above
                  // and below by a vertical line (trimmed at the first/last stop).
                  <span
                    className="relative flex w-4 shrink-0 self-stretch justify-center"
                    aria-hidden
                  >
                    {!isFirst ? (
                      <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-orange-200" />
                    ) : null}
                    {!isLast ? (
                      <span className="absolute bottom-0 left-1/2 top-3 w-px -translate-x-1/2 bg-orange-200" />
                    ) : null}
                    <span
                      className={`relative z-10 mt-[7px] h-2.5 w-2.5 rounded-full border-2 ${
                        item.lunch
                          ? "border-zinc-300 bg-white"
                          : "border-orange-400 bg-white"
                      }`}
                    />
                  </span>
                ) : null}
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
                {showSeeMore && !item.lunch && ACTIVITY_BY_NAME.has(item.name) ? (
                  <button
                    type="button"
                    aria-disabled="true"
                    title="Coming soon"
                    className="ml-auto shrink-0 cursor-not-allowed text-[11px] font-medium text-orange-600 underline-offset-2 transition-colors hover:underline dark:text-orange-400"
                  >
                    See more
                  </button>
                ) : null}
              </li>
              {leg != null ? (
                <li className="flex items-baseline gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                  {connectors ? (
                    // The connecting line continues through the distance leg.
                    <span
                      className="relative flex w-4 shrink-0 self-stretch justify-center"
                      aria-hidden
                    >
                      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-orange-200" />
                    </span>
                  ) : (
                    <span className="w-28 shrink-0" />
                  )}
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

      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        {plan.feasible ? (
          <span className="text-zinc-400 dark:text-zinc-500">
            Ends {formatTime(plan.endsAt)} · fits the day
          </span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400">
            Ends {formatTime(plan.endsAt)} · doesn&apos;t fit (opening hours or
            budget)
          </span>
        )}
        {/* The chosen route is the straightest of the legal orderings; show how
            direct it is and how many orderings were legal. */}
        <span className="text-zinc-400 dark:text-zinc-500">
          · linearity {plan.linearity.toFixed(1)}/10
        </span>
        <span className="text-zinc-400 dark:text-zinc-500">
          · {plan.feasibleOrderings}{" "}
          {plan.feasibleOrderings === 1 ? "feasible ordering" : "feasible orderings"}
        </span>
      </p>
    </div>
  );
}

// The ranked list of activity combinations for the current filter selection.
export function ComboResults({
  filters,
  city,
  area,
  combinations,
  selections,
  startHours,
  circulars,
  dayIndices,
  activeDay,
  evaluated,
  elapsedMs,
}: {
  filters: Filter[];
  city: City; // the selected city (catalogue)
  area: Area; // the selected start area (route anchor + map start marker)
  combinations: Activity[][];
  selections: Selection[]; // per day slot (each day's filter choices)
  startHours: number[]; // per day slot
  circulars: boolean[]; // per day slot — circular (loop) trip toggle
  dayIndices: number[]; // weekday (Mon=0) per chosen day, in order
  activeDay: number; // the day tab that ranks + scores the list
  evaluated: number; // how many subsets were evaluated when calculated
  elapsedMs: number; // wall-clock time the calculation took
}) {
  // Make sure the scoring engine (maxComboValue's catalogue + the route anchor)
  // is on this city + area before the live comboScore / scheduleCombo calls below.
  setActiveCity(city, area.coords);
  // The list is ranked + scored for the ACTIVE day's filters; each combo card
  // still lays out every day, each with its own day's start hour + time budget.
  const activeSelection = selections[activeDay];
  const activeStart = startHours[activeDay];
  const activeEnd = scheduleEndHour(filters, activeSelection, activeStart);
  const activeWeekday = dayIndices[activeDay];
  const activeCircular = circulars[activeDay] ?? false;

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
      <p className="mb-1 font-mono text-xs text-zinc-400 dark:text-zinc-500">
        evaluated {evaluated.toLocaleString()} subsets ·{" "}
        {elapsedMs < 1 ? "<1" : Math.round(elapsedMs).toLocaleString()} ms
      </p>
      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
        Ranked for <span className="font-medium text-zinc-600 dark:text-zinc-300">{DAYS[activeWeekday]}</span>
        &apos;s filters (runs {formatTime(activeStart)}–{formatTime(activeEnd)}):{" "}
        {filters
          .map((f, fi) => {
            const picked = activeSelection[fi] ?? [];
            const names = picked.length
              ? picked.map((i) => f.options[i]?.name).filter(Boolean).join(" / ")
              : "any";
            return `${f.name} — ${names}`;
          })
          .join(" · ")}
        . Each card lays out every day with its own day&apos;s start &amp; budget.
      </p>
      <div className="flex flex-col gap-2">
        {combinations.map((combo, index) => {
          const score = comboScore(combo, activeSelection, filters);
          // One itinerary per chosen date (by weekday). Each day is scheduled with
          // ITS OWN day's start hour + time budget, so per-day filters produce
          // each day's own itinerary.
          const days = dayIndices;
          const plans = days.map((d, slot) =>
            scheduleCombo(
              combo,
              d,
              startHours[slot],
              scheduleEndHour(filters, selections[slot], startHours[slot]),
              circulars[slot] ?? false
            )
          );
          // The ACTIVE day drives the map and the "why this rank" dashboard (it's
          // the day the score + ranking are for).
          const plan = plans[activeDay];
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
                        ? filterSummary(f, fi, combo, activeSelection)
                        : null
                    )
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  score {score.toFixed(2)}
                </span>
              </div>

              {/* One timed itinerary per day: the selected day plus the chosen
                  number of following days. Each reflects that day's opening hours. */}
              <div className="flex flex-col gap-3">
                {plans.map((p, i) => (
                  <DayItinerary
                    key={days[i]}
                    plan={p}
                    day={days[i]}
                    note={i === activeDay ? "ranked day" : undefined}
                  />
                ))}
              </div>

              <div className="mt-1.5 flex items-center justify-end gap-3">
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

              {mapOpen ? (
                <ComboMap
                  stops={stops}
                  start={{ name: area.name, coords: area.coords }}
                  circular={activeCircular}
                />
              ) : null}

              {open ? (
                <ComboDashboard
                  combo={combo}
                  selection={activeSelection}
                  filters={filters}
                  plan={plan}
                  startHour={activeStart}
                  endHour={activeEnd}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
