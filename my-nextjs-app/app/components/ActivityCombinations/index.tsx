"use client";

import { useMemo, useState } from "react";
import { ACTIVITIES } from "./core/activities.data";
import type { Activity } from "./core/activities.functions";
import { buildCombinations, defaultSelection, type Filter, Selection } from "./core/filters.functions";
import { scheduleCombo, scheduleEndHour } from "./core/schedule.functions";
import { toEffective, useFilterEdits } from "./core/filterStore.functions";
import { FilterSidebar } from "./FilterSidebar";
import { ActivityList } from "./ActivityList";
import { ComboResults } from "./ComboResults";
import { TripPlan } from "./TripPlan";
import { planTrip } from "./core/trip.functions";
import { filterByRequired } from "./RequiredActivities";
import { DEFAULT_DAY, DEFAULT_START_HOUR } from "./core/schedule.data";

// The most days a trip can span: the selected day + up to 4 after (daysAfter 0–4).
// Per-day state arrays are pre-allocated to this length so changing the day count
// never needs to resize them — `daysAfter` just decides how many slots are USED.
const MAX_DAYS = 5;

// A frozen snapshot of the combos list and the per-day settings it was computed
// with. The combos view renders from this (not live state), so it only changes
// when the user clicks Calculate.
type ComboSnapshot = {
  list: Activity[][];
  selections: Selection[];
  startHours: number[];
  day: number;
  daysAfter: number;
  activeDay: number;
  filtersRef: Filter[]; // the filter config it was computed with (for staleness)
};

export default function ActivityCombinations() {
  const [edits] = useFilterEdits();
  const filters = useMemo(() => toEffective(edits), [edits]);

  // PER-DAY state. Each day slot (0 = selected day, 1 = next day, …) has its own
  // filter choices, start hour, and "must include" set, so days can be tuned
  // independently. Pre-allocated to MAX_DAYS; only slots 0..daysAfter are used.
  // The filter set never changes shape (only field values), so the selection keys
  // stay valid; stale option indexes after an edit are ignored by comboScore.
  const [selections, setSelections] = useState<Selection[]>(() =>
    Array.from({ length: MAX_DAYS }, () => defaultSelection(filters))
  );
  const [startHours, setStartHours] = useState<number[]>(() =>
    Array.from({ length: MAX_DAYS }, () => DEFAULT_START_HOUR)
  );
  const [requireds, setRequireds] = useState<Set<string>[]>(() =>
    Array.from({ length: MAX_DAYS }, () => new Set<string>())
  );

  // The day of the week the trip STARTS on (0=Mon..6=Sun). Day slot i is the
  // weekday (day + i) % 7. Global — it defines which days the tabs represent.
  const [day, setDay] = useState<number>(DEFAULT_DAY);

  // How many days AFTER the selected day to plan/lay out (0–4). The combos and
  // the trip span the selected day plus this many following days. Global.
  const [daysAfter, setDaysAfter] = useState<number>(2);

  // Which day tab is active (0..daysAfter). Its filters rank the combos list and
  // its values are what the sidebar controls edit.
  const [activeDay, setActiveDay] = useState<number>(0);

  // The active day's values + weekday — these drive the sidebar and the combos list.
  const activeSelection = selections[activeDay];
  const activeStartHour = startHours[activeDay];
  const activeRequired = requireds[activeDay];
  const activeWeekday = (day + activeDay) % 7;

  // The combos list is computed ON DEMAND (when the user clicks Calculate), not
  // reactively — enumerating + ranking every subset is the expensive part. A
  // click snapshots the current per-day settings together with the computed list;
  // the view stays frozen on that snapshot until the next click. `dirty` flags
  // that settings have changed since the last calculation.
  const [combos, setCombos] = useState<ComboSnapshot | null>(null);
  const [dirty, setDirty] = useState(true);

  // The shown list is out of date if a per-day setting changed (`dirty`) or the
  // filter config itself changed on the /filters page (snapshot's filtersRef no
  // longer matches). Derived — no effect needed.
  const stale = dirty || (combos !== null && combos.filtersRef !== filters);

  // Build + rank + filter for the ACTIVE day's filters: scored with that day's
  // selection, kept only if schedulable within that day's opening windows, then
  // narrowed to that day's required activities. Snapshot it with the per-day
  // settings the cards need (each card lays out every day with its own budget).
  const calculate = () => {
    const scored = buildCombinations(ACTIVITIES, activeSelection, filters);
    const endHour = scheduleEndHour(filters, activeSelection, activeStartHour);
    const open = scored.filter(
      (combo) => scheduleCombo(combo, activeWeekday, activeStartHour, endHour).withinHours
    );
    setCombos({
      list: filterByRequired(open, activeRequired),
      selections: selections.slice(),
      startHours: startHours.slice(),
      day,
      daysAfter,
      activeDay,
      filtersRef: filters,
    });
    setDirty(false);
  };

  // The day slots the trip spans, and each slot's own start hour, end hour (start
  // + that day's time budget), and filter selection.
  const tripLen = daysAfter + 1;
  const tripSelections = selections.slice(0, tripLen);
  const tripStartHours = startHours.slice(0, tripLen);
  const tripEndHours = tripStartHours.map((sh, i) =>
    scheduleEndHour(filters, tripSelections[i], sh)
  );

  // The best multi-day trip: every activity used once, assigned across the
  // selected day plus the next `daysAfter` days to MAXIMIZE the average of the
  // days' combo scores. Each day is scheduled AND scored with its own day's
  // filters. Independent of the "must include" sets (the pool is the whole
  // catalogue).
  const trip = useMemo(() => {
    const tripDays = Array.from({ length: tripLen }, (_, i) => (day + i) % 7);
    const sel = tripDays.map((_, i) => selections[i]);
    const starts = tripDays.map((_, i) => startHours[i]);
    const ends = tripDays.map((_, i) =>
      scheduleEndHour(filters, selections[i], startHours[i])
    );
    return planTrip(ACTIVITIES, tripDays, starts, ends, sel, filters);
  }, [day, tripLen, selections, startHours, filters]);

  // All the per-day mutators write to the ACTIVE day's slot, leaving the others
  // untouched (each slot is its own object/set so editing one never bleeds over).
  // Each also marks the combos snapshot dirty, since it no longer reflects the
  // current settings.
  const choose = (filterIndex: number, optionIndex: number) => {
    setDirty(true);
    setSelections((prev) => {
      const cur = prev[activeDay] ?? {};
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
      copy[activeDay] = nextSel;
      return copy;
    });
  };

  const setActiveStartHour = (hour: number) => {
    setDirty(true);
    setStartHours((prev) => {
      const copy = prev.slice();
      copy[activeDay] = hour;
      return copy;
    });
  };

  const toggleRequired = (name: string) => {
    setDirty(true);
    setRequireds((prev) => {
      const copy = prev.slice();
      const next = new Set(copy[activeDay]);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      copy[activeDay] = next;
      return copy;
    });
  };

  const changeDay = (d: number) => {
    setDirty(true);
    setDay(d);
  };

  const changeActiveDay = (slot: number) => {
    setDirty(true);
    setActiveDay(slot);
  };

  // Shrinking the day count can leave the active tab out of range — clamp it.
  const changeDaysAfter = (n: number) => {
    setDirty(true);
    setDaysAfter(n);
    if (activeDay > n) setActiveDay(n);
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
        day={day}
        onDayChange={changeDay}
        daysAfter={daysAfter}
        onDaysAfterChange={changeDaysAfter}
        activeDay={activeDay}
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
              day={combos.day}
              daysAfter={combos.daysAfter}
              activeDay={combos.activeDay}
            />
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Set your filters per day, then click{" "}
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
