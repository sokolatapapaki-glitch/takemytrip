"use client";

import { useMemo, useState } from "react";
import type { Activity } from "./core/activities.functions";
import { setActiveCity } from "./core/activities.functions";
import { CITIES, DEFAULT_CITY, type City, type Area } from "./core/cities.data";
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
  circulars: boolean[]; // per-day circular-trip toggle
  area: Area; // the start area the list was computed/anchored with
  dayIndices: number[]; // weekday (Mon=0) per chosen day, in order
  activeDay: number;
  filtersRef: Filter[]; // the filter config it was computed with (for staleness)
  evaluated: number; // how many subsets were evaluated
  elapsedMs: number; // wall-clock time the calculation took
};

// Hand-off params from the /start page (?dest=&area=&start=&end=). The planner
// is client-only (ssr:false), so window.location is available on first render —
// no useSearchParams/Suspense needed. Missing/invalid params just fall back to
// the planner's defaults.
function parseStartParams(): {
  cityId?: string;
  areaId?: string;
  start?: Date;
  end?: Date;
} {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const parseDate = (s: string | null): Date | undefined => {
    const m = s ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(s) : null;
    if (!m) return undefined;
    const d = startOfDay(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  return {
    cityId: p.get("dest") ?? undefined,
    areaId: p.get("area") ?? undefined,
    start: parseDate(p.get("start")),
    end: parseDate(p.get("end")),
  };
}

export default function ActivityCombinations() {
  const [edits] = useFilterEdits();
  const filters = useMemo(() => toEffective(edits), [edits]);

  // Read the /start hand-off once (on mount).
  const initial = useMemo(() => parseStartParams(), []);
  const initialCity = useMemo(
    () => CITIES.find((c) => c.id === initial.cityId) ?? DEFAULT_CITY,
    [initial]
  );

  // The selected city. Its catalogue + centre drive the whole planner. Switching
  // city resets everything to defaults (see changeCity), so the active city is
  // stable across any one calculation.
  const [city, setCity] = useState<City>(initialCity);
  // The selected start AREA within the city (one base for the whole trip). Its
  // coords are the route anchor; defaults to the city's "Centre" area.
  const [area, setArea] = useState<Area>(
    () => initialCity.areas.find((a) => a.id === initial.areaId) ?? initialCity.areas[0]
  );
  // Point the scoring engine (maxComboValue's catalogue + the route anchor) at
  // the active city + selected area, synchronously during render, before any
  // scoring runs below or in the children.
  useMemo(() => setActiveCity(city, area.coords), [city, area]);

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
  // Per-day "circular trip" toggle: when true, that day's route is scored as a
  // loop that starts AND returns to the centre (see scheduleCombo). Default off.
  const [circulars, setCirculars] = useState<boolean[]>(() =>
    Array.from({ length: MAX_DAYS }, () => false)
  );

  // The chosen DATE RANGE (calendar). `end` is null while only the start is
  // picked; the effective range is then just the start day. The planner uses each
  // date's weekday for opening hours.
  const today = useMemo(() => startOfDay(new Date()), []);
  const [range, setRange] = useState<{ start: Date; end: Date | null }>(() => {
    // From /start params when present (end ignored if before start); else the
    // default today → +2 days.
    if (initial.start) {
      const end = initial.end && initial.end >= initial.start ? initial.end : null;
      return { start: initial.start, end };
    }
    return { start: today, end: addDays(today, 2) };
  });
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
  const activeCircular = circulars[activeSlot];
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
    setActiveCity(city, area.coords); // engine on this city + area before scoring
    const t0 = performance.now();
    const scored = buildCombinations(city.activities, activeSelection, filters);
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
      circulars: circulars.slice(),
      area,
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
    setActiveCity(city, area.coords); // engine on this city + area before planning
    const starts = dayIndices.map((_, i) => startHours[i]);
    const ends = dayIndices.map((_, i) =>
      scheduleEndHour(filters, selections[i], startHours[i])
    );
    const sel = dayIndices.map((_, i) => selections[i]);
    const circ = dayIndices.map((_, i) => circulars[i]);
    return planTrip(city.activities, dayIndices, starts, ends, sel, filters, circ);
  }, [city, area, dayIndices, selections, startHours, circulars, filters]);

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

  const toggleActiveCircular = () => {
    setDirty(true);
    setCirculars((prev) => {
      const copy = prev.slice();
      copy[activeSlot] = !copy[activeSlot];
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

  // Switching city is a clean slate: point the engine at the new catalogue and
  // reset every per-day setting + the combos list to defaults.
  const changeCity = (next: City) => {
    if (next.id === city.id) return;
    const nextArea = next.areas[0]; // Centre
    setActiveCity(next, nextArea.coords);
    setCity(next);
    setArea(nextArea);
    setSelections(Array.from({ length: MAX_DAYS }, () => defaultSelection(filters)));
    setStartHours(Array.from({ length: MAX_DAYS }, () => DEFAULT_START_HOUR));
    setRequireds(Array.from({ length: MAX_DAYS }, () => new Set<string>()));
    setCirculars(Array.from({ length: MAX_DAYS }, () => false));
    setRange({ start: today, end: addDays(today, 2) });
    setActiveDay(0);
    setCombos(null);
    setDirty(true);
  };

  // Picking a start area re-anchors the distance score (and the circular return)
  // for the whole trip. Marks the combos list stale so it's recalculated.
  const changeArea = (next: Area) => {
    setArea(next);
    setDirty(true);
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
        circular={activeCircular}
        onToggleCircular={toggleActiveCircular}
        activities={city.activities}
        areas={city.areas}
        area={area}
        areaNoun={city.kind === "region" ? "city" : "area"}
        onAreaChange={changeArea}
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
        {/* Destination selector — switches the whole planner's catalogue +
            anchor. Grouped into cities and regions. */}
        <div className="flex items-center gap-2">
          <label htmlFor="city-select" className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Destination
          </label>
          <select
            id="city-select"
            value={city.id}
            onChange={(e) => {
              const next = CITIES.find((c) => c.id === e.target.value);
              if (next) changeCity(next);
            }}
            className="rounded-lg border border-black/[.08] bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-200"
          >
            <optgroup label="Cities">
              {CITIES.filter((c) => c.kind === "city").map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
            <optgroup label="Regions">
              {CITIES.filter((c) => c.kind === "region").map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {city.activities.length === 0 ? (
          <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-300">
            No activities yet for {city.name}. You can still pick a start{" "}
            {city.kind === "region" ? "city" : "area"} below — combos &amp; trips
            will appear here once activities are added for this destination.
          </p>
        ) : null}

        <ActivityList day={activeWeekday} activities={city.activities} />

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
              city={city}
              area={combos.area}
              combinations={combos.list}
              selections={combos.selections}
              startHours={combos.startHours}
              circulars={combos.circulars}
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
          area={area}
          selections={tripSelections}
          startHours={tripStartHours}
          endHours={tripEndHours}
          circulars={circulars.slice(0, dayCount)}
          filters={filters}
        />
      </div>
    </div>
  );
}
