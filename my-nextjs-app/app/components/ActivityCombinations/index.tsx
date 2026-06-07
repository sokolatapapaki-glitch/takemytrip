"use client";

import { useMemo, useState } from "react";
import { setActiveCity } from "./core/activities.functions";
import { DAYS } from "./core/activities.data";
import { CITIES, DEFAULT_CITY, type City, type Area } from "./core/cities.data";
import { defaultSelection, Selection } from "./core/filters.functions";
import { scheduleEndHour } from "./core/schedule.functions";
import { toEffective, useFilterEdits } from "./core/filterStore.functions";
import { addDays, diffDays, mondayIndex, startOfDay } from "./core/calendar.functions";
import { FilterSidebar } from "./FilterSidebar";
import { ActivityList } from "./ActivityList";
import { AdvancedFiltersModal } from "./AdvancedFiltersModal";
import { TripPlan } from "./TripPlan";
import { planTrip } from "./core/trip.functions";
import { DEFAULT_START_HOUR } from "./core/schedule.data";

// The most days a trip can span (the date range is capped at this length). Per-day
// state arrays are pre-allocated to this length so changing the range never needs
// to resize them — the range's length just decides how many slots are USED.
const MAX_DAYS = 7;

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

  // The selected city. Its catalogue + centre drive the whole planner. The city
  // is fixed for the session (set from the /start hand-off); there is no in-page
  // destination switcher, so the active city is stable across any calculation.
  const [city] = useState<City>(initialCity);
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

  // Which day tab is active (0..dayCount-1). Its filters/start time/required are
  // what the sidebar + advanced modal edit, and its weekday drives the activity
  // hours and that day's leg of the trip. Clamped in case the range shrank.
  const [activeDay, setActiveDay] = useState<number>(0);
  const activeSlot = Math.min(activeDay, dayCount - 1);

  const activeSelection = selections[activeSlot];
  const activeStartHour = startHours[activeSlot];
  const activeRequired = requireds[activeSlot];
  const activeCircular = circulars[activeSlot];
  const activeWeekday = dayIndices[activeSlot];

  // The activities catalogue + its search box are hidden until the user clicks
  // "Select activities". `activityQuery` filters the shown list.
  const [showActivities, setShowActivities] = useState(false);
  const [activityQuery, setActivityQuery] = useState("");
  // The advanced (per-day) filters modal — same controls as the sidebar, by day.
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  // Per-day mutators write to the ACTIVE day's slot, leaving the others untouched.
  const choose = (filterIndex: number, optionIndex: number) => {
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
    setStartHours((prev) => {
      const copy = prev.slice();
      copy[activeSlot] = hour;
      return copy;
    });
  };

  const toggleActiveCircular = () => {
    setCirculars((prev) => {
      const copy = prev.slice();
      copy[activeSlot] = !copy[activeSlot];
      return copy;
    });
  };

  const toggleRequired = (name: string) => {
    setRequireds((prev) => {
      const copy = prev.slice();
      const next = new Set(copy[activeSlot]);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      copy[activeSlot] = next;
      return copy;
    });
  };

  // SIDEBAR handlers — edits here are the GLOBAL DEFAULT: the change is applied to
  // every day slot. Per-day overrides are made with the active-day handlers above
  // (used only by the Advanced Filters modal). Toggles base their new state on
  // slot 0, which is the value the sidebar displays.
  const chooseAll = (filterIndex: number, optionIndex: number) => {
    // Broadcasting to every slot intentionally collapses any per-day divergence
    // for THIS filter — the sidebar is the "default for all days" surface.
    setSelections((prev) => {
      const base = prev[0] ?? {};
      let nextOpts: number[];
      if (filters[filterIndex]?.multi) {
        const current = base[filterIndex] ?? [];
        nextOpts = current.includes(optionIndex)
          ? current.filter((i) => i !== optionIndex)
          : [...current, optionIndex];
      } else {
        nextOpts = [optionIndex];
      }
      return prev.map((sel) => ({ ...sel, [filterIndex]: nextOpts }));
    });
  };

  const setAllStartHour = (hour: number) => {
    setStartHours((prev) => prev.map(() => hour));
  };

  const toggleAllCircular = () => {
    setCirculars((prev) => {
      const next = !prev[0];
      return prev.map(() => next);
    });
  };

  const toggleAllRequired = (name: string) => {
    setRequireds((prev) => {
      const add = !prev[0].has(name);
      return prev.map((set) => {
        const copy = new Set(set);
        if (add) copy.add(name);
        else copy.delete(name);
        return copy;
      });
    });
  };

  const changeActiveDay = (slot: number) => setActiveDay(slot);

  const changeRange = (start: Date, end: Date | null) => {
    setRange({ start, end });
    const cnt = Math.min((end ? diffDays(start, end) : 0) + 1, MAX_DAYS);
    if (activeDay > cnt - 1) setActiveDay(cnt - 1);
  };

  // Picking a start area re-anchors the distance score (and the circular return)
  // for the whole trip.
  const changeArea = (next: Area) => setArea(next);

  return (
    <>
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-8 lg:flex-row">
      <FilterSidebar
        filters={filters}
        selection={selections[0]}
        onChoose={chooseAll}
        required={requireds[0]}
        onToggleRequired={toggleAllRequired}
        startHour={startHours[0]}
        onStartHourChange={setAllStartHour}
        circular={circulars[0]}
        onToggleCircular={toggleAllCircular}
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
        onOpenAdvanced={() => setShowAdvanced(true)}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        {city.activities.length === 0 ? (
          <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-300">
            No activities yet for {city.name}. You can still pick a start{" "}
            {city.kind === "region" ? "city" : "area"} below — your trip will
            appear here once activities are added for this destination.
          </p>
        ) : null}

        {/* Activities catalogue — hidden until "Select activities" is clicked,
            then revealed in place (with a search box) above the trip plan. */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              Activities in {city.name}{" "}
              <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
                · hours for {DAYS[activeWeekday]}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setShowActivities((s) => !s)}
              aria-expanded={showActivities}
              disabled={city.activities.length === 0}
              className="shrink-0 rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-orange-900/10 transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
            >
              {showActivities ? "Hide activities" : "Select activities"}
            </button>
          </div>
          {showActivities && (
            <>
              <input
                type="text"
                value={activityQuery}
                onChange={(e) => setActivityQuery(e.target.value)}
                placeholder="Search activities"
                className="w-full rounded-lg border border-black/[.08] bg-white px-4 py-2.5 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-300 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-100"
              />
              <ActivityList
                day={activeWeekday}
                activities={city.activities}
                query={activityQuery}
              />
            </>
          )}
        </section>

        <TripPlan
          trip={trip}
          area={area}
          cityName={city.name}
          selections={tripSelections}
          startHours={tripStartHours}
          endHours={tripEndHours}
          circulars={circulars.slice(0, dayCount)}
          filters={filters}
        />
      </div>
    </div>

    {showAdvanced && (
      <AdvancedFiltersModal
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
        dates={dates}
        activeDay={activeSlot}
        onActiveDayChange={changeActiveDay}
        onClose={() => setShowAdvanced(false)}
      />
    )}
    </>
  );
}
