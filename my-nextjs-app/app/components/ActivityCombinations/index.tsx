"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { setActiveCity, setActiveParty, type Activity, type Party } from "./core/activities.functions";
import { CITIES, DEFAULT_CITY, type City, type Area } from "./core/cities.data";
import { defaultSelection, Selection, type Filter } from "./core/filters.functions";
import { costOptionsForParty } from "./core/filters.data";
import { HIDE_ACTIVITY_PRICES } from "@/app/config";
import { scheduleEndHour } from "./core/schedule.functions";
import { toEffective, useFilterEdits } from "./core/filterStore.functions";
import { addDays, diffDays, mondayIndex, startOfDay } from "./core/calendar.functions";
import { FilterSidebar } from "./FilterSidebar";
import { ActivityList } from "./ActivityList";
import { AdvancedFiltersModal } from "./AdvancedFiltersModal";
import { TripPlan } from "./TripPlan";
import { planTrip } from "./core/trip.functions";
import { enforceRequired } from "./core/trip.required";
import { DEFAULT_START_HOUR } from "./core/schedule.data";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
import { SearchIcon } from "@/app/start/components/icons";
import { FaSliders, FaCircleInfo } from "react-icons/fa6";
import { useScrollLock } from "@/app/components/ui/useScrollLock";

// The most days a trip can span (the date range / duration is capped at this
// length). Per-day state arrays are pre-allocated to this length so changing the
// range never needs to resize them — the range's length just decides how many
// slots are USED. A generous safety cap (#2: "as many days as the user wants")
// that still bounds the per-day UI/state and the planner's work.
const MAX_DAYS = 30;

// Hand-off params from the /start page (?dest=&area=&start=&end=&adults=&ages=).
// Read from Next's reactive `useSearchParams()` (passed in) rather than a one-time
// window.location snapshot, so a client-side navigation from the homepage always
// lands on the chosen city — not the default. Missing/invalid params fall back to
// the planner's defaults.
function parseStartParams(p: ReadonlyURLSearchParams): {
  cityId?: string;
  areaId?: string;
  // Personal start point handed from the homepage (?slat=&slng=&sname=). When
  // present it overrides the area as the route anchor (#3).
  startPoint?: { name: string; coords: { lat: number; lng: number } };
  start?: Date;
  end?: Date;
  // Trip length in days (#2) — the PRIMARY length input from /start. When present
  // it decides the number of days (dates become optional / illustrative); when
  // absent the count is derived from start/end as before.
  days?: number;
  party: Party;
  // Activity names the trip MUST contain (?include=, repeated) — the activities
  // page's "Make Trip" hand-off. They pre-check the "Must include" filter.
  include: string[];
  // Pre-selected filter options from ?filters= (filterIndex → chosen option
  // indexes), applied to every day. Format: groups joined by "_", each
  // "<filterIdx>-<optIdx>[.<optIdx>…]". E.g. "1-1_2-0" → filter 1 → option 1,
  // filter 2 → option 0. Out-of-range/invalid entries are ignored downstream.
  filterSel: Record<number, number[]>;
} {
  const parseDate = (s: string | null): Date | undefined => {
    const m = s ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(s) : null;
    if (!m) return undefined;
    const d = startOfDay(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  // The party from ?adults=&ages= (ages = comma list of each child's age). Always
  // at least one adult; non-numeric ages are dropped.
  const adults = Math.max(1, Math.floor(Number(p.get("adults"))) || 1);
  const childAges = (p.get("ages") ?? "")
    .split(",")
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n >= 0);
  // Trip length in days from ?days= (free-typed on /start). Clamped to ≥1 and the
  // safety cap; invalid/absent → undefined (fall back to start/end).
  const daysRaw = Math.floor(Number(p.get("days")));
  const days =
    Number.isFinite(daysRaw) && daysRaw >= 1
      ? Math.min(daysRaw, MAX_DAYS)
      : undefined;
  // Personal start point from ?slat=&slng=&sname= (the homepage's address/hotel
  // search). Both coords must parse for it to count.
  const slat = parseFloat(p.get("slat") ?? "");
  const slng = parseFloat(p.get("slng") ?? "");
  const startPoint =
    Number.isFinite(slat) && Number.isFinite(slng)
      ? { name: p.get("sname") || "Διαμονή", coords: { lat: slat, lng: slng } }
      : undefined;
  // Pre-selected filter options from ?filters= (see the return type above).
  const filterSel: Record<number, number[]> = {};
  const rawFilters = p.get("filters");
  if (rawFilters) {
    for (const group of rawFilters.split("_")) {
      const [fi, opts] = group.split("-");
      const fidx = Number(fi);
      if (!Number.isInteger(fidx) || fidx < 0) continue;
      const idxs = (opts ?? "")
        .split(".")
        .map((s) => Number(s))
        .filter((n) => Number.isInteger(n) && n >= 0);
      if (idxs.length) filterSel[fidx] = idxs;
    }
  }
  return {
    cityId: p.get("dest") ?? undefined,
    areaId: p.get("area") ?? undefined,
    startPoint,
    start: parseDate(p.get("start")),
    end: parseDate(p.get("end")),
    days,
    party: { adults, childAges },
    include: p.getAll("include"),
    filterSel,
  };
}

// Merge URL-supplied filter selections onto the defaults: start from
// defaultSelection, then for each requested filter override its chosen option
// indexes (clamped to that filter's real options; unknown filters ignored). A
// single-select filter keeps only the first valid index.
function selectionFromParams(
  filters: Filter[],
  sel: Record<number, number[]>
): Selection {
  const base = defaultSelection(filters);
  for (const [k, opts] of Object.entries(sel)) {
    const fi = Number(k);
    const f = filters[fi];
    if (!f) continue;
    const valid = opts.filter((o) => o >= 0 && o < f.options.length);
    if (!valid.length) continue;
    base[fi] = f.multi ? valid : [valid[0]];
  }
  return base;
}

// Shown in the results column while the trip is being recalculated after a filter
// change. Skeleton cards keep the layout stable while planTrip runs.
function TripResultsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span
          className="h-9 w-9 animate-spin rounded-full border-[3px] border-orange-200 border-t-orange-500"
          aria-hidden
        />
        <div>
          <p className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
            Υπολογίζουμε ξανά το πρόγραμμα…
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Εφαρμόζουμε τα νέα φίλτρα στις δραστηριότητες κάθε ημέρας.
          </p>
        </div>
      </div>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex gap-4 rounded-3xl border border-white/80 bg-white/70 p-4 shadow-xl shadow-orange-900/10"
        >
          <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-zinc-200/70" />
          <div className="flex min-w-0 flex-1 flex-col gap-3 py-1">
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-200/80" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-200/70" />
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-200/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ActivityCombinations() {
  const [edits] = useFilterEdits();

  // Read the /start hand-off from the live URL query (reactive — correct after a
  // client-side navigation from the homepage search).
  const searchParams = useSearchParams();
  const initial = useMemo(() => parseStartParams(searchParams), [searchParams]);
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
  const [area, setArea] = useState<Area>(() => {
    // A personal start point from /start wins (#3): use it as a custom anchor.
    if (initial.startPoint) {
      return {
        id: "custom",
        name: initial.startPoint.name,
        coords: initial.startPoint.coords,
      };
    }
    // Otherwise fall back to a city area by id (direct links), else the centre.
    return initialCity.areas.find((a) => a.id === initial.areaId) ?? initialCity.areas[0];
  });
  // The traveller party from the /start hand-off (drives price totals); fixed for
  // the session like the city.
  const party = initial.party;
  // Point the scoring engine (maxComboValue's catalogue + the route anchor + the
  // party's price totals) at the active city + selected area + party, synchronously
  // during render, before any scoring runs below or in the children. setActiveParty
  // comes AFTER setActiveCity — the latter clears the party-price cache.
  useMemo(() => {
    setActiveCity(city, area.coords);
    setActiveParty(party);
  }, [city, area, party]);

  // Runtime filters: editor edits merged onto the code defaults, then the cost
  // filter's budget buckets rebuilt for the actual party so they read as party
  // totals (€50/person → "έως €150" for three travellers). Built AFTER the engine
  // setup above so maxPartyPrice() inside costOptionsForParty sees this party.
  const filters = useMemo(() => {
    const base = toEffective(edits);
    const travelers = party.adults + party.childAges.length;
    // When prices are hidden, drop the cost filter entirely so cost is neither
    // shown nor accounted for in scoring.
    return base
      .filter((f) => !HIDE_ACTIVITY_PRICES || f.name !== "Κόστος")
      .map((f) =>
        f.name === "Κόστος" ? { ...f, options: costOptionsForParty(travelers) } : f
      );
  }, [edits, party]);

  // PER-DAY state. Each day slot (0 = first chosen date, 1 = next, …) has its own
  // filter choices, start hour, and "must include" set. Pre-allocated to MAX_DAYS;
  // only the slots the chosen range spans are used. The filter set never changes
  // shape, so selection keys stay valid; stale option indexes are ignored.
  const [selections, setSelections] = useState<Selection[]>(() =>
    Array.from({ length: MAX_DAYS }, () => selectionFromParams(filters, initial.filterSel))
  );
  const [startHours, setStartHours] = useState<number[]>(() =>
    Array.from({ length: MAX_DAYS }, () => DEFAULT_START_HOUR)
  );
  const [requireds, setRequireds] = useState<Set<string>[]>(() => {
    // Pre-check the "Must include" filter with the ?include= hand-off from the
    // activities page's Make Trip (unknown names are dropped).
    const fromParams = new Set(
      initial.include.filter((n) => initialCity.activities.some((a) => a.name === n))
    );
    return Array.from({ length: MAX_DAYS }, () => new Set(fromParams));
  });
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
    // default today → +2 days. When a `days` duration is given it WINS for the
    // length (#2): the end is start + days − 1, regardless of any picked dates.
    if (initial.start) {
      let end = initial.end && initial.end >= initial.start ? initial.end : null;
      if (initial.days) end = addDays(initial.start, initial.days - 1);
      return { start: initial.start, end };
    }
    // Duration without dates: anchor at today (its weekday drives opening hours)
    // and span `days` days. Dates stay optional.
    if (initial.days) return { start: today, end: addDays(today, initial.days - 1) };
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

  // The chosen dates as a short Greek range, shown in the trip card header
  // instead of a "trip of N days" label — e.g. "3 Ιουν – 5 Ιουν" (single date
  // when the trip is one day).
  const tripDateLabel = useMemo(() => {
    if (dates.length === 0) return "";
    const fmt = (d: Date) =>
      d.toLocaleDateString("el-GR", { day: "numeric", month: "short" });
    return dates.length === 1
      ? fmt(dates[0])
      : `${fmt(dates[0])} – ${fmt(dates[dates.length - 1])}`;
  }, [dates]);

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
  // First-visit hint pointing at the "Επιλογή δραστηριοτήτων" button (shows on
  // every plan-page mount until dismissed or the button is used).
  const [showSelectHint, setShowSelectHint] = useState(true);
  const [activityQuery, setActivityQuery] = useState("");
  // Activities the user has ticked in the catalogue (by name), plus the set
  // "locked in" by Submit. While `submitted` is null the trip is built from the
  // whole catalogue; once submitted, it's built from ONLY the chosen activities.
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(
    () => new Set()
  );
  const [submitted, setSubmitted] = useState<Set<string> | null>(null);

  const toggleSelectedActivity = (a: Activity) =>
    setSelectedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(a.name)) next.delete(a.name);
      else next.add(a.name);
      return next;
    });

  // Build the trip from only the ticked activities. Nothing ticked → alert and
  // bail (no empty trip).
  const submitSelection = () => {
    if (selectedActivities.size === 0) {
      alert("Διάλεξε πρώτα τουλάχιστον μία δραστηριότητα.");
      return;
    }
    setSubmitted(new Set(selectedActivities));
  };

  // Reverse the submit: drop back to the full-catalogue trip.
  const undoSelection = () => setSubmitted(null);
  // The advanced (per-day) filters modal — same controls as the sidebar, by day.
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // Whether the main trip card is expanded (it opens by default). When it is, the
  // desktop filter sidebar stretches to the trip's height and scrolls internally.
  const [tripExpanded, setTripExpanded] = useState(true);

  // Lock the page scroll while the mobile filter drawer is open.
  useScrollLock(showMobileFilters);

  // Per-day settings for the trip, in chosen-date order.
  const tripSelections = selections.slice(0, dayCount);
  const tripStartHours = startHours.slice(0, dayCount);
  const tripEndHours = tripStartHours.map((sh, i) =>
    scheduleEndHour(filters, tripSelections[i], sh)
  );

  // The pool the trip is planned from: the whole catalogue by default, or just
  // the submitted (ticked) activities once the user has clicked Submit.
  const activityPool = useMemo(
    () =>
      submitted
        ? city.activities.filter((a) => submitted.has(a.name))
        : city.activities,
    [submitted, city]
  );

  // The best multi-day trip across the chosen dates: every activity used once,
  // assigned to maximize the average of the days' combo scores. Each day is
  // scheduled AND scored with its own day's filters. The "must include" sets
  // are then enforced as a HARD constraint on the result (see trip.required.ts):
  // every checked activity is slotted into a free window or takes over a
  // non-required activity's slot — trip-level, so the union over the days.
  // Bundle every input the trip depends on into one object so it can be deferred
  // as a single unit (a new object only when one of the inputs actually changes).
  const tripInputs = useMemo(
    () => ({ city, area, party, dayIndices, selections, startHours, circulars, filters, activityPool, requireds }),
    [city, area, party, dayIndices, selections, startHours, circulars, filters, activityPool, requireds]
  );
  // Defer the heavy recompute so the "recalculating" loading state can paint
  // first, before planTrip blocks the thread. While the deferred snapshot lags
  // the live inputs, a recalculation is in flight.
  const deferredInputs = useDeferredValue(tripInputs);
  const isRecalculating = deferredInputs !== tripInputs;

  const trip = useMemo(() => {
    const { city, area, party, dayIndices, selections, startHours, circulars, filters, activityPool, requireds } =
      deferredInputs;
    setActiveCity(city, area.coords); // engine on this city + area before planning
    setActiveParty(party); // and on the chosen party, for price totals
    const starts = dayIndices.map((_, i) => startHours[i]);
    const ends = dayIndices.map((_, i) =>
      scheduleEndHour(filters, selections[i], startHours[i])
    );
    const sel = dayIndices.map((_, i) => selections[i]);
    const circ = dayIndices.map((_, i) => circulars[i]);
    const planned = planTrip(activityPool, dayIndices, starts, ends, sel, filters, circ);
    const required = new Set<string>();
    for (const set of requireds.slice(0, dayIndices.length))
      for (const name of set) required.add(name);
    return enforceRequired(planned, required, starts, ends);
  }, [deferredInputs]);

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
      {/* Soft orange→white→emerald backdrop matching the Cities page, with two
          drifting blurred colour blobs for the glass surfaces to blur over. */}
      <section className="relative flex-1 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-emerald-50">
        <div
          aria-hidden
          className="animate-drift-slow pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="animate-drift-slower pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl"
        />
        <div className="relative z-10 mx-auto flex w-full flex-col gap-8 px-4 py-6 sm:px-8 sm:py-8 md:px-24">
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                  {city.name}
                </h2>
                <div className="flex shrink-0 items-center gap-3">
                  {/* The Επιλογή button (relative, so the hint anchors to it).
                      On tablet the inline Φίλτρα button sits to its right. */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowActivities((s) => !s);
                        setShowSelectHint(false);
                      }}
                      aria-expanded={showActivities}
                      disabled={city.activities.length === 0}
                      className={`shrink-0 ${buttonStyles.common} disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent`}
                    >
                      {showActivities ? "Απόκρυψη δραστηριοτήτων" : "Επιλογή δραστηριοτήτων"}
                    </button>

                    {/* On-load hint, anchored under the button with an arrow. */}
                    {showSelectHint && (
                      <div className="animate-pop-in absolute right-0 top-full z-30 mt-3 w-64 max-w-[calc(100vw-2rem)]">
                        <div className="absolute -top-1.5 right-8 h-3 w-3 rotate-45 border-l border-t border-orange-200 bg-white dark:border-orange-400/30 dark:bg-zinc-800" />
                        <div className="relative rounded-xl border border-orange-200 bg-white p-3 pr-7 text-sm text-zinc-600 shadow-lg shadow-orange-900/10 dark:border-orange-400/30 dark:bg-zinc-800 dark:text-zinc-300">
                          <button
                            type="button"
                            onClick={() => setShowSelectHint(false)}
                            aria-label="Κλείσιμο"
                            className="absolute right-1.5 top-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
                          >
                            ✕
                          </button>
                          Επίλεξε δραστηριότητες για να φτιάξεις πρόγραμμα αποκλειστικά με αυτές.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tablet-only filters button — sits to the RIGHT of Επιλογή
                      (mobile keeps the full-width one below; desktop uses the
                      sidebar). */}
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(true)}
                    className={`hidden shrink-0 items-center justify-center gap-2 md:flex lg:hidden ${buttonStyles.secondary}`}
                  >
                    <FaSliders className="h-4 w-4" />
                    Φίλτρα
                  </button>
                </div>
              </div>
              {/* Mobile-only filters button — full width below the header (tablet
                shows the inline one above; desktop uses the sidebar). */}
              <button
                type="button"
                onClick={() => setShowMobileFilters(true)}
                className={`flex w-full items-center justify-center gap-2 md:hidden ${buttonStyles.secondary}`}
              >
                <FaSliders className="h-4 w-4" />
                Φίλτρα
              </button>
              {showActivities && (
                <>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3.5 shadow-lg shadow-orange-900/5 ring-1 ring-inset ring-white/60 backdrop-blur-md focus-within:ring-orange-200">
                      <SearchIcon className="h-6 w-6 shrink-0 text-zinc-400" />
                      <input
                        type="text"
                        value={activityQuery}
                        onChange={(e) => setActivityQuery(e.target.value)}
                        placeholder="Αναζήτησε δραστηριότητες"
                        className="w-full bg-transparent text-base text-zinc-800 outline-none placeholder:text-zinc-400"
                      />
                    </div>
                    {/* Explains what "Υποβολή επιλογής" does: it restricts the trip
                      to ONLY the ticked activities (not a "must include"). */}
                    <div className="flex items-start gap-2 rounded-xl border border-orange-200/70 bg-orange-50/70 px-4 py-2.5 text-sm text-zinc-600 dark:border-orange-400/20 dark:bg-orange-950/20 dark:text-zinc-300">
                      <FaCircleInfo className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                      <span>
                        Διάλεξε δραστηριότητες και πάτησε «Υποβολή επιλογής»: το
                        πρόγραμμα θα δημιουργηθεί αποκλειστικά από τις δραστηριότητες
                        που επέλεξες.
                      </span>
                    </div>
                  </div>
                  <ActivityList
                    day={activeWeekday}
                    activities={city.activities}
                    query={activityQuery}
                    selected={selectedActivities}
                    onToggleSelect={toggleSelectedActivity}
                  />

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={submitSelection}
                      className={buttonStyles.secondary}
                    >
                      Υποβολή επιλογής
                    </button>
                    {submitted ? (
                      <button
                        type="button"
                        onClick={undoSelection}
                        className={buttonStyles.common}
                      >
                        Αναίρεση υποβολής
                      </button>
                    ) : null}
                    {submitted ? (
                      <span className="text-sm text-zinc-500">
                        Το ταξίδι φτιάχτηκε από {submitted.size}{" "}
                        {submitted.size === 1
                          ? "επιλεγμένη δραστηριότητα"
                          : "επιλεγμένες δραστηριότητες"}
                        .
                      </span>
                    ) : null}
                  </div>
                </>
              )}
            </section>

            <div
              className={`lg:flex lg:gap-8 ${tripExpanded ? "lg:items-stretch" : "lg:items-start"}`}
            >
              <div
                className={`hidden lg:block lg:w-80 lg:shrink-0 ${tripExpanded ? "lg:relative" : ""}`}
              >
                <FilterSidebar
                  fillHeight={tripExpanded}
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
                  area={area}
                  cityName={city.name}
                  onAreaChange={changeArea}
                  rangeStart={rangeStart}
                  rangeEnd={range.end}
                  onRangeChange={changeRange}
                  minDate={today}
                  maxDays={MAX_DAYS}
                  dates={dates}
                  onOpenAdvanced={() => setShowAdvanced(true)}
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-8">
                {city.activities.length === 0 ? (
                  <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-300">
                    Δεν υπάρχουν ακόμη δραστηριότητες για: {city.name}. Μπορείς όμως
                    να διαλέξεις {city.kind === "region" ? "πόλη" : "περιοχή"}{" "}
                    αφετηρίας παρακάτω — το ταξίδι σου θα εμφανιστεί εδώ μόλις
                    προστεθούν δραστηριότητες για αυτόν τον προορισμό.
                  </p>
                ) : null}

                {isRecalculating ? (
                  <TripResultsLoading />
                ) : (
                  <TripPlan
                    trip={trip}
                    area={area}
                    cityName={city.name}
                    dateLabel={tripDateLabel}
                    party={party}
                    expanded={tripExpanded}
                    onExpandedChange={setTripExpanded}
                    selections={tripSelections}
                    startHours={tripStartHours}
                    endHours={tripEndHours}
                    circulars={circulars.slice(0, dayCount)}
                    filters={filters}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showMobileFilters && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-30 overflow-hidden lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="animate-slide-in-right absolute right-0 top-0 flex h-full w-full flex-col bg-white text-zinc-900 shadow-2xl sm:max-w-[420px]">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
              <h2 className="text-lg font-semibold">Φίλτρα</h2>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className={buttonStyles.underline}
              >
                Έγινε
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
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
                area={area}
                cityName={city.name}
                onAreaChange={changeArea}
                rangeStart={rangeStart}
                rangeEnd={range.end}
                onRangeChange={changeRange}
                minDate={today}
                maxDays={MAX_DAYS}
                dates={dates}
                onOpenAdvanced={() => setShowAdvanced(true)}
                mobile
              />
            </div>
          </div>
        </div>
      )}
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
          areaName={area.name}
        />
      )}
    </>
  );
}
