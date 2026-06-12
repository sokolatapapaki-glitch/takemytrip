"use client";

import { useEffect, useRef, useState } from "react";
import { FaSliders } from "react-icons/fa6";
import { SearchIcon } from "@/app/start/components/icons";
import { FilterDropdown } from "@/app/map/components/FilterDropdown";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
import { useScrollLock } from "@/app/components/ui/useScrollLock";
import { CityCard } from "./CityCard";
import {
  CITY_SORT_LABELS,
  filterAndSortCities,
  type CitySortKey,
} from "./citiesData";

// The /cities page from the Penpot "Cities" board: a glassmorphism grid of city
// cards over the app's soft orange→white→emerald backdrop, with a working search
// input and a "Sorted by" dropdown (Name / Price / Distance from Athens).
export default function CitiesExperience() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<CitySortKey>("name");
  const [sortOpen, setSortOpen] = useState(false);
  // Mobile/tablet only: sorting moves into a right-side slide-in drawer.
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Lock the page scroll while the mobile sort drawer is open.
  useScrollLock(showSort);

  // Outside-click closes the sort dropdown.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const cities = filterAndSortCities(query, sortBy);

  return (
    <section className="relative flex-1 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-emerald-50 px-4 py-10 sm:px-8">
      {/* Soft colour blobs give the glass surfaces something to blur over. */}
      <div
        aria-hidden
        className="animate-drift-slow pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-drift-slower pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl"
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        {/* Header: title + sort. */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-800">
            Πόλεις
          </h1>
          {/* Sorted-by chip — desktop only; on mobile sorting lives in the
              drawer opened by the button below the search. */}
          <div ref={sortRef} className="hidden lg:block">
            <FilterDropdown
              label="Ταξινόμηση"
              active={sortBy !== "name"}
              summary={sortBy !== "name" ? CITY_SORT_LABELS[sortBy] : null}
              open={sortOpen}
              onToggle={() => setSortOpen((o) => !o)}
            >
              <div className="flex flex-col gap-1">
                {(Object.keys(CITY_SORT_LABELS) as CitySortKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setSortBy(k);
                      setSortOpen(false);
                    }}
                    className={`rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                      sortBy === k
                        ? "bg-orange-50 text-orange-700"
                        : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {CITY_SORT_LABELS[k]}
                  </button>
                ))}
              </div>
            </FilterDropdown>
          </div>
        </div>

        {/* Search input. */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3.5 shadow-lg shadow-orange-900/5 ring-1 ring-inset ring-white/60 backdrop-blur-md focus-within:ring-orange-200">
          <SearchIcon className="h-6 w-6 shrink-0 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Αναζήτησε πόλεις"
            className="w-full bg-transparent text-base text-zinc-800 outline-none placeholder:text-zinc-400"
          />
        </div>

        {/* Sort — opens the right-side drawer (mobile/tablet only). */}
        <button
          type="button"
          onClick={() => setShowSort(true)}
          className={`mt-3 flex w-full items-center justify-center gap-2 lg:hidden ${buttonStyles.secondary}`}
        >
          <FaSliders className="h-4 w-4" />
          Ταξινόμηση
          {sortBy !== "name" ? `: ${CITY_SORT_LABELS[sortBy]}` : ""}
        </button>

        {/* Grid of city cards. */}
        {cities.length === 0 ? (
          <p className="mt-12 text-center text-sm text-zinc-400">
            Καμία πόλη δεν ταιριάζει με «{query}».
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {cities.map((c, i) => (
              <CityCard key={c.id} city={c} index={i} />
            ))}
          </div>
        )}

        {/* Mobile/tablet sort drawer — slides in from the right, fullscreen but
            BELOW the navbar (top-14). overflow-hidden clips the off-screen panel
            during the slide-in (no transient horizontal scrollbar). */}
        {showSort && (
          <div className="fixed inset-x-0 bottom-0 top-14 z-30 overflow-hidden lg:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowSort(false)}
            />
            <div className="animate-slide-in-right absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:max-w-[420px]">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
                <h2 className="text-lg font-semibold text-zinc-800">Ταξινόμηση</h2>
                <button
                  type="button"
                  onClick={() => setShowSort(false)}
                  className={buttonStyles.underline}
                >
                  Έγινε
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-1">
                  {(Object.keys(CITY_SORT_LABELS) as CitySortKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setSortBy(k);
                        setShowSort(false);
                      }}
                      className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortBy === k
                          ? "bg-orange-50 text-orange-700"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {CITY_SORT_LABELS[k]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
