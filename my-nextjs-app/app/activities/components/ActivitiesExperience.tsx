"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaCheck } from "react-icons/fa6";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/app/context/AppContext";
import { CITIES } from "@/app/components/ActivityCombinations/core/cities.data";
import type { VibeKey } from "@/app/components/ActivityCombinations/core/activities.functions";
import { SearchIcon } from "@/app/start/components/icons";
import { FilterDropdown } from "@/app/map/components/FilterDropdown";
import { VIBES } from "@/app/map/components/mapData";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
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
  const { openActivity, openModal } = useApp();
  const cityId = params.get("city");
  const city = getCityById(cityId) ?? CITIES[0];

  const [filters, setFilters] = useState<ActivityListFilters>(DEFAULT_ACT_FILTERS);
  const [open, setOpen] = useState<OpenMenu>(null);
  // Checked activities (by name) — marked for a future "Make Trip".
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-800 sm:text-3xl">
              Activities in {city.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <FilterDropdown
              label="Sorted by"
              active={filters.sortBy !== DEFAULT_ACT_FILTERS.sortBy}
              summary={ACT_SORT_LABELS[filters.sortBy]}
              open={open === "sort"}
              onToggle={() => toggleMenu("sort")}
            >
              <div className="flex flex-col gap-1">
                {(Object.keys(ACT_SORT_LABELS) as ActSortKey[]).map((k) => (
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

            {/* Live once at least one activity is checked: opens the centered
                trip-search modal (dates/travelers; destination = this city)
                whose Search builds a plan that MUST include the selection. */}
            <button
              type="button"
              disabled={selected.size === 0}
              title={selected.size === 0 ? "Select activities first" : undefined}
              onClick={() =>
                openModal(
                  <MakeTripModal city={city} selectedNames={[...selected]} />
                )
              }
              className={`${buttonStyles.primary} shrink-0 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Make Trip{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)]">
          {/* Left filter sidebar. */}
          <FilterSidebar
            city={city}
            filters={filters}
            priceMax={priceMax}
            areaOpen={open === "area"}
            onAreaToggle={() => toggleMenu("area")}
            onAreaSelect={(areaId) => {
              set({ areaId });
              setOpen(null);
            }}
            onChange={set}
            onToggleVibe={toggleVibe}
          />

          {/* Main column. */}
          <div className="min-w-0">
            {/* Search input (matches the Cities page search). */}
            <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3.5 shadow-lg shadow-orange-900/5 ring-1 ring-inset ring-white/60 backdrop-blur-md focus-within:ring-emerald-200">
              <SearchIcon className="h-6 w-6 shrink-0 text-zinc-400" />
              <input
                type="text"
                value={filters.query}
                onChange={(e) => set({ query: e.target.value })}
                placeholder="Search activities"
                className="w-full bg-transparent text-base text-zinc-800 outline-none placeholder:text-zinc-400"
              />
            </div>

            {/* Activity cards grid. */}
            {results.length === 0 ? (
              <p className="mt-10 text-sm text-zinc-400">
                {city.activities.length === 0
                  ? `No activities for ${city.name} yet.`
                  : "No activities match your filters."}
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2">
                {results.map((a, i) => (
                  <ActivityCard
                    key={a.name}
                    activity={a}
                    index={i}
                    selected={selected.has(a.name)}
                    onToggleSelect={(act) => toggleSelect(act.name)}
                    onSeeMore={openActivity}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
