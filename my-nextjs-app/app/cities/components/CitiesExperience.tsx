"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "@/app/start/components/icons";
import { FilterDropdown } from "@/app/map/components/FilterDropdown";
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
  const sortRef = useRef<HTMLDivElement>(null);

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
            Cities
          </h1>
          <div ref={sortRef}>
            <FilterDropdown
              label="Sorted by"
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
            placeholder="Search cities"
            className="w-full bg-transparent text-base text-zinc-800 outline-none placeholder:text-zinc-400"
          />
        </div>

        {/* Grid of city cards. */}
        {cities.length === 0 ? (
          <p className="mt-12 text-center text-sm text-zinc-400">
            No cities match “{query}”.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((c, i) => (
              <CityCard key={c.id} city={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
