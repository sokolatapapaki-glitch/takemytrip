"use client";

import { Fragment, useState } from "react";
import { FaArrowsRotate, FaChevronDown, FaChevronUp, FaTrashCan } from "react-icons/fa6";
import type { Activity, Coords, Party } from "./core/activities.functions";
import {
  activityPrice,
  distanceKm,
  formatDistance,
  formatTime,
  partyPriceLines,
  partyPriceLinesTotal,
  setActiveCity,
} from "./core/activities.functions";
import { DAYS } from "./core/activities.data";
import { ALL_ACTIVITIES, type City, type Area } from "./core/cities.data";
import { Filter, Selection, comboScore, filterApplies, optionValue } from "./core/filters.functions";
import {
  scheduleCombo,
  scheduleEndHour,
  type ComboSchedule,
  type ScheduledItem,
} from "./core/schedule.functions";
import { ComboDashboard } from "./ComboDashboard";
import { ComboMap } from "./ComboMap";
import { ScheduledName } from "./ScheduledName";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
import { useApp } from "@/app/context/AppContext";

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

// A free-time window an Add button offers on /my-trips. `placeLate` anchors the
// inserted activity to the window's END (used before the day's first item, so
// the newcomer finishes right when the schedule starts).
export type AddWindow = { start: number; end: number; placeLate?: boolean };

// Free time must fit at least a short visit for an Add button to make sense.
const MIN_ADD_GAP = 1; // hours

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
// Compact euro label for the per-member price lines.
const fmtEuro = (n: number): string => (n === 0 ? "Δωρεάν" : `€${n}`);

export function DayItinerary({
  plan,
  day,
  note,
  showSeeMore = false,
  showDetails = false,
  party,
  onReplace,
  onRemove,
  onAdd,
  connectors = false,
}: {
  plan: ComboSchedule;
  day: number;
  note?: string;
  // Opt-in (Trip component only): under each real activity row, show its short
  // description and the per-member price breakdown (#7/#11/#10) so the user sees
  // what each activity is AND what each traveller pays without opening the modal.
  showDetails?: boolean;
  // The traveller party the per-member prices are computed for (defaults to the
  // engine's active party when omitted).
  party?: Party;
  // Opt-in (Trip component only): render a "See more" button on each real
  // activity row that opens the activity detail modal. Default off, so the
  // combos list is unchanged.
  showSeeMore?: boolean;
  // Opt-in (My Trips page only): a "Replace" button left of "See more" on each
  // real activity row. The handler gets the scheduled slot so the caller can
  // offer replacements that fit it.
  onReplace?: (item: ScheduledItem, day: number) => void;
  // Opt-in (My Trips page only): a "Remove" button on each real activity row —
  // takes the activity out of this day's plan.
  onRemove?: (item: ScheduledItem, day: number) => void;
  // Opt-in (My Trips page only): "+ Add" buttons in the free time before the
  // first item, in any ≥1h gap between items, and after the last item.
  onAdd?: (win: AddWindow, day: number) => void;
  // Opt-in (Trip component only): draw a timeline rail (a dot per stop joined by a
  // vertical line) on the left, like the Penpot board. Default off.
  connectors?: boolean;
}) {
  const { openActivity } = useApp();
  const first = plan.items[0];
  const last = plan.items[plan.items.length - 1];
  // An "+ Add" row offering the given free-time window.
  const addRow = (win: AddWindow, key: string) => (
    <li key={key} className={`flex items-baseline gap-3 ${connectors ? "pl-7" : ""}`}>
      <button
        type="button"
        onClick={() => onAdd?.(win, day)}
        className={`my-0.5 inline-flex items-center gap-1 ${buttonStyles.common}`}
      >
        + Προσθήκη ({formatTime(win.start)}–{formatTime(win.end)})
      </button>
    </li>
  );
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {DAYS[day]}
        </h4>
      </div>

      {/* Timed itinerary: ordered to respect each activity's hours. Between two
          directly-adjacent activities we show the straight-line distance. When a
          lunch slot sits between two activities, we bridge it: the distance shown
          is between the activity before lunch and the one after it. */}
      <ol className={`flex flex-col ${connectors ? "gap-0" : "gap-0.5"}`}>
        {/* Free time before the schedule starts (from 06:00, ending exactly at
            the first item — the inserted activity is anchored to the end). */}
        {onAdd && first && first.start - 6 >= MIN_ADD_GAP
          ? addRow({ start: 6, end: first.start, placeLate: true }, "add-before")
          : null}
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
                className={`flex gap-3 text-zinc-800 dark:text-zinc-100 ${connectors ? "items-start" : "items-baseline"
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
                      className={`relative z-10 mt-[7px] h-2.5 w-2.5 rounded-full border-2 ${item.lunch
                        ? "border-zinc-300 bg-white"
                        : "border-orange-400 bg-white"
                        }`}
                    />
                  </span>
                ) : null}
                {/* Hour, name and "See more" share one row on sm+ (hour · name ·
                    action). On mobile they reflow: the hour (and the See-more
                    action) sit on the top line, the name wraps onto the line
                    below — see the order-/basis- utilities. */}
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span
                    className={`order-1 w-auto shrink-0 font-mono text-xs sm:w-28 ${item.closed
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-zinc-500 dark:text-zinc-400"
                      }`}
                  >
                    {item.closed
                      ? "κλειστό"
                      : `${formatTime(item.start)}–${formatTime(item.end)}`}
                  </span>
                  <div className="order-3 min-w-0 basis-full sm:order-2 sm:flex-1 sm:basis-auto">
                    <ScheduledName
                      item={item}
                      activity={ACTIVITY_BY_NAME.get(item.name)}
                      day={day}
                    />
                  </div>
                  {showSeeMore && !item.lunch && ACTIVITY_BY_NAME.has(item.name) ? (
                    <span className="order-2 ml-auto flex shrink-0 items-center gap-3 sm:order-3">
                      {onReplace ? (
                        <button
                          type="button"
                          onClick={() => onReplace(item, day)}
                          title="Αντικατάσταση δραστηριότητας"
                          aria-label="Αντικατάσταση δραστηριότητας"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/[.05] hover:text-zinc-800 dark:hover:bg-white/[.08] dark:hover:text-zinc-100"
                        >
                          <FaArrowsRotate className="h-4 w-4" />
                        </button>
                      ) : null}
                      {onRemove ? (
                        <button
                          type="button"
                          onClick={() => onRemove(item, day)}
                          title="Αφαίρεση από αυτή την ημέρα"
                          aria-label="Αφαίρεση από αυτή την ημέρα"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/[.05] hover:text-red-600 dark:hover:bg-white/[.08] dark:hover:text-red-400"
                        >
                          <FaTrashCan className="h-4 w-4" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openActivity(ACTIVITY_BY_NAME.get(item.name)!)}
                        className={buttonStyles.underline}
                      >
                        Δες περισσότερα
                      </button>
                    </span>
                  ) : null}
                  {/* Description + per-member cost, inline under the row (#7/#11/#10). */}
                  {showDetails && !item.lunch && ACTIVITY_BY_NAME.get(item.name)
                    ? (() => {
                        const act = ACTIVITY_BY_NAME.get(item.name)!;
                        const lines = partyPriceLines(act, party);
                        const naive = partyPriceLinesTotal(act, party);
                        const total = activityPrice(act, party);
                        const bundle = total < naive;
                        return (
                          <div className="order-4 basis-full pt-0.5 sm:pl-28">
                            {act.description ? (
                              <p className="line-clamp-2 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                                {act.description}
                              </p>
                            ) : null}
                            {lines.length > 0 ? (
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                {lines.map((l) => (
                                  <span key={l.label}>
                                    {l.label}
                                    {l.count > 1 ? ` ×${l.count}` : ""}: {fmtEuro(l.perPerson)}
                                  </span>
                                ))}
                                <span className="font-medium text-zinc-700 dark:text-zinc-200">
                                  Σύνολο: {fmtEuro(total)}
                                  {bundle ? " (οικογ. πακέτο)" : ""}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        );
                      })()
                    : null}
                </div>
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
                  <span className="inline-flex items-center gap-1">
                    {formatDistance(leg.km)}
                    {leg.label ? (
                      <span className="text-zinc-300 dark:text-zinc-600">
                        {" "}· {leg.label}
                      </span>
                    ) : null}
                  </span>
                </li>
              ) : null}
              {/* Free time between this item and the next (e.g. where a removed
                  activity used to be) — big enough gaps get an Add button. */}
              {onAdd && next && next.start - item.end >= MIN_ADD_GAP
                ? addRow({ start: item.end, end: next.start }, `add-gap-${i}`)
                : null}
            </Fragment>
          );
        })}
        {/* Free time after the last item, until midnight. */}
        {onAdd && last && 24 - last.end >= MIN_ADD_GAP
          ? addRow({ start: last.end, end: 24 }, "add-after")
          : null}
      </ol>
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
              <div className="flex flex-col gap-0">
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
                    {mapOpen ? (
                      <span className="inline-flex items-center gap-1">Hide map <FaChevronUp className="h-3 w-3" /></span>
                    ) : (
                      <span className="inline-flex items-center gap-1">Map <FaChevronDown className="h-3 w-3" /></span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    aria-expanded={open}
                    className="rounded-lg border border-black/[.08] px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {open ? (
                      <span className="inline-flex items-center gap-1">Hide breakdown <FaChevronUp className="h-3 w-3" /></span>
                    ) : (
                      <span className="inline-flex items-center gap-1">Why this rank? <FaChevronDown className="h-3 w-3" /></span>
                    )}
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
