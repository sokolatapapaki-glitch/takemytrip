"use client";

import { useMemo, useState } from "react";
import { ACTIVITIES } from "./core/activities.data";
import type { Activity } from "./core/activities.functions";
import { buildCombinations, defaultSelection, type Filter, Selection } from "./core/filters.functions";
import { scheduleCombo, scheduleEndHour } from "./core/schedule.functions";
import { toEffective, useFilterEdits } from "./core/filterStore.functions";
import { addDays, diffDays, mondayIndex, startOfDay } from "./core/calendar.functions";
import { FilterSidebar } from "./FilterSidebar";
import { ActivityList } from "./ActivityList";
import { ComboResults } from "./ComboResults";
import { TripPlan } from "./TripPlan";
import { planTrip } from "./core/trip.functions";
import { filterByRequired } from "./RequiredActivities";
import { DEFAULT_START_HOUR } from "./core/schedule.data";

// The most days a trip can span (the date range is capped at this length). Per-day
// state arrays are pre-allocated to this length so changing the range never needs
// to resize them — the range's length just decides how many slots are USED.
const MAX_DAYS = 7;

// A frozen snapshot of the combos list and the per-day settings it was computed
// with. The combos view renders from this (not live state), so it only changes
// when the user clicks Calculate.
type ComboSnapshot = {
  list: Activity[][];
  selections: Selection[];
  startHours: number[];
  dayIndices: number[]; // weekday (Mon=0) per chosen day, in order
  activeDay: number;
  filtersRef: Filter[]; // the filter config it was computed with (for staleness)
  evaluated: number; // how many subsets were evaluated
  elapsedMs: number; // wall-clock time the calculation took
};

export default function ActivityCombinations() {
  const [edits] = useFilterEdits();
  const filters = useMemo(() => toEffective(edits), [edits]);

  // PER-DAY state. Each day slot (0 = first chosen date, 1 = next, …) has its own
  // filter choices, start hour, and "must include" set. Pre-allocated to MAX_DAYS;
  // only the slots the chosen range spans are used. The filter set never changes
  // shape, so selection keys stay valid; stale option indexes are ignored.
  const [selections, setSelections] = useState<Selection[]>(() =>
    Array.from({ length: MAX_DAYS }, () => defaultSelection(filters))
  );
  const [startHours, setStartHours] = useState<number[]>(() =>
    Array.from({ length: MAX_DAYS }, () => DEFAULT_START_HOUR)
  );
  const [requireds, setRequireds] = useState<Set<string>[]>(() =>
    Array.from({ length: MAX_DAYS }, () => new Set<string>())
  );

  // The chosen DATE RANGE (calendar). `end` is null while only the start is
  // picked; the effective range is then just the start day. The planner uses each
  // date's weekday for opening hours.
  const today = useMemo(() => startOfDay(new Date()), []);
  const [range, setRange] = useState<{ start: Date; end: Date | null }>(() => ({
    start: today,
    end: addDays(today, 2),
  }));
  const rangeStart = range.start;
  const rangeEnd = range.end ?? range.start;
  const dayCount = Math.min(diffDays(rangeStart, rangeEnd) + 1, MAX_DAYS);

  // The chosen dates, and their weekday indices (Mon=0), in order.
  const dates = useMemo(
    () => Array.from({ length: dayCount }, (_, i) => addDays(rangeStart, i)),
    [rangeStart, dayCount]
  );
  const dayIndices = useMemo(() => dates.map(mondayIndex), [dates]);

  // Which day tab is active (0..dayCount-1). Its filters rank the combos list and
  // its values are what the sidebar controls edit. Clamped in case the range shrank.
  const [activeDay, setActiveDay] = useState<number>(0);
  const activeSlot = Math.min(activeDay, dayCount - 1);

  const activeSelection = selections[activeSlot];
  const activeStartHour = startHours[activeSlot];
  const activeRequired = requireds[activeSlot];
  const activeWeekday = dayIndices[activeSlot];

  // The combos list is computed ON DEMAND (when the user clicks Calculate), not
  // reactively — enumerating + ranking every subset is the expensive part. A click
  // snapshots the current per-day settings together with the computed list; the
  // view stays frozen on that snapshot until the next click. `dirty`/`stale` flag
  // that settings have changed since the last calculation.
  const [combos, setCombos] = useState<ComboSnapshot | null>(null);
  const [dirty, setDirty] = useState(true);
  const stale = dirty || (combos !== null && combos.filtersRef !== filters);

  const calculate = () => {
    const t0 = performance.now();
    const scored = buildCombinations(ACTIVITIES, activeSelection, filters);
    const endHour = scheduleEndHour(filters, activeSelection, activeStartHour);
    const open = scored.filter(
      (combo) => scheduleCombo(combo, activeWeekday, activeStartHour, endHour).withinHours
    );
    const list = filterByRequired(open, activeRequired);
    const elapsedMs = performance.now() - t0;
    setCombos({
      list,
      selections: selections.slice(),
      startHours: startHours.slice(),
      dayIndices: dayIndices.slice(),
      activeDay: activeSlot,
      filtersRef: filters,
      evaluated: scored.length,
      elapsedMs,
    });
    setDirty(false);
  };

  // Per-day settings for the trip, in chosen-date order.
  const tripSelections = selections.slice(0, dayCount);
  const tripStartHours = startHours.slice(0, dayCount);
  const tripEndHours = tripStartHours.map((sh, i) =>
    scheduleEndHour(filters, tripSelections[i], sh)
  );

  // The best multi-day trip across the chosen dates: every activity used once,
  // assigned to maximize the average of the days' combo scores. Each day is
  // scheduled AND scored with its own day's filters. Independent of the
  // "must include" sets (the pool is the whole catalogue).
  const trip = useMemo(() => {
    const starts = dayIndices.map((_, i) => startHours[i]);
    const ends = dayIndices.map((_, i) =>
      scheduleEndHour(filters, selections[i], startHours[i])
    );
    const sel = dayIndices.map((_, i) => selections[i]);
    return planTrip(ACTIVITIES, dayIndices, starts, ends, sel, filters);
  }, [dayIndices, selections, startHours, filters]);

  // Per-day mutators write to the ACTIVE day's slot, leaving the others untouched,
  // and mark the combos snapshot dirty.
  const choose = (filterIndex: number, optionIndex: number) => {
    setDirty(true);
    setSelections((prev) => {
      const cur = prev[activeSlot] ?? {};
      let nextSel: Selection;
      if (filters[filterIndex]?.multi) {
        const current = cur[filterIndex] ?? [];
        const nextOpts = current.includes(optionIndex)
          ? current.filter((i) => i !== optionIndex)
          : [...current, optionIndex];
        nextSel = { ...cur, [filterIndex]: nextOpts };
      } else {
        nextSel = { ...cur, [filterIndex]: [optionIndex] };
      }
      const copy = prev.slice();
      copy[activeSlot] = nextSel;
      return copy;
    });
  };

  const setActiveStartHour = (hour: number) => {
    setDirty(true);
    setStartHours((prev) => {
      const copy = prev.slice();
      copy[activeSlot] = hour;
      return copy;
    });
  };

  const toggleRequired = (name: string) => {
    setDirty(true);
    setRequireds((prev) => {
      const copy = prev.slice();
      const next = new Set(copy[activeSlot]);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      copy[activeSlot] = next;
      return copy;
    });
  };

  const changeActiveDay = (slot: number) => {
    setDirty(true);
    setActiveDay(slot);
  };

  const changeRange = (start: Date, end: Date | null) => {
    setDirty(true);
    setRange({ start, end });
    const cnt = Math.min((end ? diffDays(start, end) : 0) + 1, MAX_DAYS);
    if (activeDay > cnt - 1) setActiveDay(cnt - 1);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-8 lg:flex-row">
      <FilterSidebar
        filters={filters}
        selection={activeSelection}
        onChoose={choose}
        required={activeRequired}
        onToggleRequired={toggleRequired}
        startHour={activeStartHour}
        onStartHourChange={setActiveStartHour}
        rangeStart={rangeStart}
        rangeEnd={range.end}
        onRangeChange={changeRange}
        minDate={today}
        maxDays={MAX_DAYS}
        dates={dates}
        activeDay={activeSlot}
        onActiveDayChange={changeActiveDay}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <ActivityList day={activeWeekday} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={calculate}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {combos ? "Recalculate combinations" : "Calculate combinations"}
            </button>
            {combos && stale ? (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Settings changed — recalculate to update the list.
              </span>
            ) : null}
          </div>

          {combos ? (
            <ComboResults
              filters={filters}
              combinations={combos.list}
              selections={combos.selections}
              startHours={combos.startHours}
              dayIndices={combos.dayIndices}
              activeDay={combos.activeDay}
              evaluated={combos.evaluated}
              elapsedMs={combos.elapsedMs}
            />
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Pick your dates and filters, then click{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-200">
                Calculate combinations
              </span>{" "}
              to see the ranked list.
            </p>
          )}
        </div>

        <TripPlan
          trip={trip}
          selections={tripSelections}
          startHours={tripStartHours}
          endHours={tripEndHours}
          filters={filters}
        />
      </div>
    </div>
  );
}
