"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaCheck, FaSliders } from "react-icons/fa6";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/app/context/AppContext";
import { CITIES } from "@/app/components/ActivityCombinations/core/cities.data";
import type { VibeKey } from "@/app/components/ActivityCombinations/core/activities.functions";
import { SearchIcon } from "@/app/start/components/icons";
import { FilterDropdown } from "@/app/map/components/FilterDropdown";
import { VIBES } from "@/app/map/components/mapData";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
import { useScrollLock } from "@/app/components/ui/useScrollLock";
import { StatusToast, type StatusState } from "@/app/components/ui/StatusToast";
import { HIDE_ACTIVITY_PRICES } from "@/app/config";
import {
  ACT_SORT_LABELS,
  DEFAULT_ACT_FILTERS,
  filterAndSortActivities,
  getCityById,
  priceMaxFor,
  type ActSortKey,
  type ActivityListFilters,
} from "./activitiesData";
import { FilterSidebar } from "./FilterSidebar";
import { ActivityCard } from "./ActivityCard";
import { MakeTripModal } from "./MakeTripModal";
import { VIBE_ICONS } from "./vibeStyle";

type OpenMenu = "vibe" | "sort" | "area" | null;

// The "Activities Enlist" page: a city's activities behind a left filter sidebar
// (Price / Vibe / Distance-from area) with a search input and Select-Vibe /
// Sorted-by controls below it. The city comes from the ?city= param set by the
// Cities page's "See Activities" button; an unknown/missing city falls back to
// the first city so the page is still reachable directly.
export default function ActivitiesExperience() {
  const params = useSearchParams();
  const { openActivity, openModal, closeModal } = useApp();
  const cityId = params.get("city");
  const city = getCityById(cityId) ?? CITIES[0];

  const [filters, setFilters] = useState<ActivityListFilters>(DEFAULT_ACT_FILTERS);
  const [open, setOpen] = useState<OpenMenu>(null);
  // Checked activities (by name) — marked for a future "Make Trip".
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Mobile/tablet only: the Filters sidebar lives in a right-side slide-in drawer
  // opened by the "Filters" button (the inline sidebar shows from lg up).
  const [showFilters, setShowFilters] = useState(false);
  // Status toast (e.g. the "select an activity first" error on Make Trip).
  const [notice, setNotice] = useState<{ id: number; state: StatusState; message: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Reset filters + selection when navigating to a different city.
  useEffect(() => {
    setFilters(DEFAULT_ACT_FILTERS);
    setSelected(new Set());
  }, [cityId]);

  // Outside-click closes whichever dropdown is open.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // While the filter drawer is open, lock the page scroll so only the drawer
  // scrolls (no scrollbar on the page behind it).
  useScrollLock(showFilters);

  const priceMax = useMemo(() => priceMaxFor(city), [city]);
  const results = useMemo(
    () => filterAndSortActivities(city, filters),
    [city, filters]
  );

  const set = (patch: Partial<ActivityListFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));
  const toggleMenu = (m: Exclude<OpenMenu, null>) =>
    setOpen((o) => (o === m ? null : m));
  const toggleVibe = (v: VibeKey) =>
    set({
      vibes: filters.vibes.includes(v)
        ? filters.vibes.filter((x) => x !== v)
        : [...filters.vibes, v],
    });
  const toggleSelect = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  // "Distance from" — open the area picker as an app modal listing the
  // destination's areas; choosing one sets the sort's reference point.
  const openAreaModal = () => {
    const centerId = city.areas[0].id;
    const currentAreaId = filters.areaId ?? centerId;
    openModal(
      <div>
        <h2 className="text-lg font-semibold text-zinc-800">Απόσταση από</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Διάλεξε το σημείο στην πόλη ({city.name}) από το οποίο μετράει η
          ταξινόμηση «Απόσταση από το κέντρο».
        </p>
        <div className="mt-4 flex flex-col gap-1">
          {city.areas.map((a) => {
            const active = currentAreaId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  set({ areaId: a.id });
                  closeModal();
                }}
                className={`rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${active
                    ? "bg-emerald-50 font-medium text-emerald-700"
                    : "text-zinc-700 hover:bg-zinc-50"
                  }`}
              >
                {a.name}
                {a.id === centerId ? " (κέντρο)" : ""}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Make Trip — opens the centered trip-search modal whose Search builds a plan
  // that MUST include the selection. With nothing selected it shows an error
  // toast instead of opening. Rendered in two spots (next to the title on
  // mobile, in the controls on xl).
  const makeTrip = () => {
    if (selected.size === 0) {
      setNotice({
        id: Date.now(),
        state: "error",
        message: "Διάλεξε πρώτα τουλάχιστον μία δραστηριότητα για να φτιάξεις ταξίδι.",
      });
      return;
    }
    openModal(<MakeTripModal city={city} selectedNames={[...selected]} />);
  };
  const makeTripButton = () => (
    <button
      type="button"
      onClick={makeTrip}
      className={`${buttonStyles.primary} shrink-0`}
    >
      Φτιάξε ταξίδι{selected.size > 0 ? ` (${selected.size})` : ""}
    </button>
  );

  return (
    <section className="relative flex-1 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-emerald-50 px-4 py-10 sm:px-8">
      {/* Soft colour blobs for the glass surfaces to blur over. */}
      <div
        aria-hidden
        className="animate-drift-slow pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-drift-slower pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl"
      />

      <div
        ref={rootRef}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 xl:max-w-7xl"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          {/* Title row — on mobile/tablet the Make Trip button sits right next to
              the title; from xl it moves into the controls group on the right. */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-800 sm:text-3xl">
              Δραστηριότητες στην πόλη: {city.name}
            </h1>
            <div className="xl:hidden">{makeTripButton()}</div>
          </div>

          {/* Controls — from lg up: Sorted-by chip; from xl up: Make Trip too.
              On mobile sorting lives in the filter drawer instead. */}
          <div className="hidden items-center justify-end gap-2 lg:flex lg:flex-wrap">
            <FilterDropdown
              label="Ταξινόμηση"
              active={filters.sortBy !== DEFAULT_ACT_FILTERS.sortBy}
              summary={ACT_SORT_LABELS[filters.sortBy]}
              open={open === "sort"}
              onToggle={() => toggleMenu("sort")}
            >
              <div className="flex flex-col gap-1">
                {(Object.keys(ACT_SORT_LABELS) as ActSortKey[])
                  .filter((k) => !HIDE_ACTIVITY_PRICES || k !== "price")
                  .map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      set({ sortBy: k });
                      setOpen(null);
                    }}
                    className={`rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${filters.sortBy === k
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                  >
                    {ACT_SORT_LABELS[k]}
                  </button>
                ))}
              </div>
            </FilterDropdown>

            <div className="hidden xl:block">{makeTripButton()}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)]">
          {/* Left filter sidebar — inline from lg up; below that it moves into the
              slide-in drawer opened by the "Filters" button. */}
          <div className="hidden lg:block">
            <FilterSidebar
              city={city}
              filters={filters}
              priceMax={priceMax}
              onOpenAreaModal={openAreaModal}
              onChange={set}
              onToggleVibe={toggleVibe}
            />
          </div>

          {/* Main column. */}
          <div className="min-w-0">
            {/* Search input (matches the Cities page search). */}
            <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3.5 shadow-lg shadow-orange-900/5 ring-1 ring-inset ring-white/60 backdrop-blur-md focus-within:ring-emerald-200">
              <SearchIcon className="h-6 w-6 shrink-0 text-zinc-400" />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => set({ query: e.target.value })}
                placeholder="Αναζήτησε δραστηριότητες"
                className="w-full bg-transparent text-base text-zinc-800 outline-none placeholder:text-zinc-400"
              />
            </div>

            {/* Filters — opens the right-side drawer (mobile/tablet only). */}
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className={`mt-3 flex w-full items-center justify-center gap-2 lg:hidden ${buttonStyles.secondary}`}
            >
              <FaSliders className="h-4 w-4" />
              Φίλτρα
            </button>

            {/* Activity cards grid. */}
            {results.length === 0 ? (
              <p className="mt-10 text-sm text-zinc-400">
                {city.activities.length === 0
                  ? `Δεν υπάρχουν ακόμη δραστηριότητες για: ${city.name}.`
                  : "Καμία δραστηριότητα δεν ταιριάζει με τα φίλτρα σου."}
              </p>
            ) : (
              // Fixed-width cards (matching the City card's ~20rem render width)
              // that wrap and centre, with equal heights per row, so the
              // Activities grid reads at the same size as the Cities grid.
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                {results.map((a, i) => (
                  <div key={a.name} className="w-full">
                    <ActivityCard
                      activity={a}
                      index={i}
                      selected={selected.has(a.name)}
                      onToggleSelect={(act) => toggleSelect(act.name)}
                      onSeeMore={openActivity}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile/tablet filter drawer — slides in from the right, fullscreen
            but BELOW the navbar (top-14) so the nav stays visible/tappable. It
            lives inside the rootRef container so its dropdowns aren't dismissed
            by the outside-click handler; overflow-hidden clips the off-screen
            panel during the slide-in (no transient horizontal scrollbar). */}
        {showFilters && (
          <div className="fixed inset-x-0 bottom-0 top-14 z-30 overflow-hidden lg:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowFilters(false)}
            />
            <div className="animate-slide-in-right absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-[420px]">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
                <h2 className="text-lg font-semibold text-zinc-800">Φίλτρα</h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className={buttonStyles.underline}
                >
                  Έγινε
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {/* Sort by — a header chip on desktop, but on mobile it belongs
                    in the drawer alongside the filters. */}
                <div>
                  <p className="text-sm font-medium text-zinc-700">Ταξινόμηση</p>
                  <div className="mt-2 flex flex-col gap-1">
                    {(Object.keys(ACT_SORT_LABELS) as ActSortKey[])
                  .filter((k) => !HIDE_ACTIVITY_PRICES || k !== "price")
                  .map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => set({ sortBy: k })}
                        className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${filters.sortBy === k
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-zinc-700 hover:bg-zinc-50"
                          }`}
                      >
                        {ACT_SORT_LABELS[k]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="my-4 h-px bg-zinc-100" />
                <FilterSidebar
                  city={city}
                  filters={filters}
                  priceMax={priceMax}
                  onOpenAreaModal={openAreaModal}
                  onChange={set}
                  onToggleVibe={toggleVibe}
                  mobile
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {notice && (
        <StatusToast
          key={notice.id}
          state={notice.state}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}
    </section>
  );
}
