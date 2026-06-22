"use client";

import { useEffect, useRef, useState } from "react";
import type { Activity } from "@/app/components/ActivityCombinations/core/activities.functions";
import { SearchIcon } from "@/app/start/components/icons";
import {
  PRICE_MAX,
  SORT_LABELS,
  VIBES,
  type ActivityFilters,
  type SortKey,
} from "./mapData";
import { FilterDropdown } from "./FilterDropdown";
import { ActivityResultCard } from "./ActivityResultCard";
import { ClickedActivityPanel } from "./ClickedActivityPanel";
import { VIBE_UI_ENABLED } from "@/app/config/features";
import { HIDE_ACTIVITY_PRICES } from "@/app/config";

const DISTANCE_MAX = 10; // km from city centre (slider bound)
type FilterKey = "price" | "vibe" | "sort" | "distance";

// The top-left search panel from the Penpot board: a search input that reveals
// the results list on focus (and hides on outside-click), a row of four filter
// chips constrained to the input's width (overflow-x), the clicked-activity
// detail panel below the input, and the filtered results.
export function SearchSidebar({
  filters,
  onFiltersChange,
  results,
  selectedName,
  openActivities,
  onToggleActivity,
  onCloseActivity,
}: {
  filters: ActivityFilters;
  onFiltersChange: (next: ActivityFilters) => void;
  results: Activity[];
  selectedName: string | null;
  openActivities: Set<string>;
  onToggleActivity: (activity: Activity) => void;
  onCloseActivity: (activityName: string) => void;
}) {
  const [resultsOpen, setResultsOpen] = useState(false);
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Outside-click hides the results and closes any open filter popup.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setResultsOpen(false);
        setOpenFilter(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const set = (patch: Partial<ActivityFilters>) =>
    onFiltersChange({ ...filters, ...patch });
  const toggleFilter = (k: FilterKey) =>
    setOpenFilter((o) => (o === k ? null : k));

  return (
    <div ref={rootRef} className="flex h-auto w-full max-w-[calc(100vw-2rem)] flex-col sm:h-full sm:w-96">
      {/* Search input — its own raised glass bar (not joined to the results). */}
      <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3.5 h-14 shadow-lg shadow-orange-900/5 ring-1 ring-inset ring-white/60 backdrop-blur-md focus-within:ring-orange-200">
        <SearchIcon className="h-6 w-6 shrink-0 text-zinc-400" />
        <input
          type="text"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          onFocus={() => setResultsOpen(true)}
          placeholder="Αναζήτησε δραστηριότητες"
          className="h-full w-full bg-transparent text-base text-zinc-800 outline-none placeholder:text-zinc-400"
        />
        <button
          type="button"
          onClick={() => setResultsOpen(false)}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors ${resultsOpen ? "hover:bg-zinc-50 opacity-100" : "opacity-0 pointer-events-none"
            }`}
          aria-label="Κλείσιμο αποτελεσμάτων"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      {/* Filter chips — only while the results are open; a horizontal row that
          scrolls in x (no visible scrollbar). The popups use fixed positioning
          (see FilterDropdown) so this overflow doesn't clip them. */}
      {resultsOpen && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {!HIDE_ACTIVITY_PRICES && (
          <FilterDropdown
            label="Τιμή"
            active={filters.priceMax != null}
            summary={filters.priceMax != null ? `≤€${filters.priceMax}` : null}
            open={openFilter === "price"}
            onToggle={() => toggleFilter("price")}
          >
            <label className="block text-xs font-medium text-zinc-600">
              Μέγιστη τιμή: {filters.priceMax != null ? `€${filters.priceMax}` : "Χωρίς όριο"}
            </label>
            <input
              type="range"
              min={0}
              max={PRICE_MAX}
              value={filters.priceMax ?? PRICE_MAX}
              onChange={(e) => {
                const v = Number(e.target.value);
                set({ priceMax: v >= PRICE_MAX ? null : v });
              }}
              className="mt-2 w-full accent-orange-500"
            />
          </FilterDropdown>
          )}

          {/* Vibe chip — hidden while the vibe UI is off (#4). The underlying
              filters.vibe state stays (defaults to null = all vibes). */}
          {VIBE_UI_ENABLED && (
            <FilterDropdown
              label="Vibe"
              active={filters.vibe != null}
              summary={filters.vibe ? VIBES.find((v) => v.key === filters.vibe)?.label : null}
              open={openFilter === "vibe"}
              onToggle={() => toggleFilter("vibe")}
            >
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => set({ vibe: null })}
                  className={`rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${filters.vibe == null ? "bg-orange-50 text-orange-700" : "hover:bg-zinc-50 text-zinc-700"
                    }`}
                >
                  Όλα τα vibes
                </button>
                {VIBES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => set({ vibe: v.key })}
                    className={`rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${filters.vibe === v.key ? "bg-orange-50 text-orange-700" : "hover:bg-zinc-50 text-zinc-700"
                      }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <v.Icon className="h-3.5 w-3.5 shrink-0" />
                      {v.label}
                    </span>
                  </button>
                ))}
              </div>
            </FilterDropdown>
          )}

          <FilterDropdown
            label="Ταξινόμηση"
            active={filters.sortBy !== "priority"}
            summary={filters.sortBy !== "priority" ? SORT_LABELS[filters.sortBy] : null}
            open={openFilter === "sort"}
            onToggle={() => toggleFilter("sort")}
          >
            <div className="flex flex-col gap-1">
              {(Object.keys(SORT_LABELS) as SortKey[])
                .filter((k) => !HIDE_ACTIVITY_PRICES || k !== "price")
                .map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set({ sortBy: k })}
                  className={`rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${filters.sortBy === k ? "bg-orange-50 text-orange-700" : "hover:bg-zinc-50 text-zinc-700"
                    }`}
                >
                  {SORT_LABELS[k]}
                </button>
              ))}
            </div>
          </FilterDropdown>

          <FilterDropdown
            label="Απόσταση από το κέντρο"
            active={filters.maxDistanceKm != null}
            summary={filters.maxDistanceKm != null ? `≤${filters.maxDistanceKm} χλμ` : null}
            open={openFilter === "distance"}
            onToggle={() => toggleFilter("distance")}
          >
            <label className="block text-xs font-medium text-zinc-600">
              Έως: {filters.maxDistanceKm != null ? `${filters.maxDistanceKm} χλμ` : "Χωρίς όριο"}
            </label>
            <input
              type="range"
              min={0}
              max={DISTANCE_MAX}
              step={0.5}
              value={filters.maxDistanceKm ?? DISTANCE_MAX}
              onChange={(e) => {
                const v = Number(e.target.value);
                set({ maxDistanceKm: v >= DISTANCE_MAX ? null : v });
              }}
              className="mt-2 w-full accent-orange-500"
            />
          </FilterDropdown>
        </div>
      )}

      {/* Results — separate white cards (no shared panel), filling the remaining
          height, no visible scrollbar. */}
      {resultsOpen && (
        <div
          data-results-list
          className="mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {results.length === 0 ? (
            <p className="px-2 py-3 text-sm text-zinc-400">Καμία δραστηριότητα δεν ταιριάζει.</p>
          ) : (
            results.map((a, i) => (
              <div key={`${a.name}-${a.coords.lat}-${a.coords.lng}`} className="space-y-2">
                {/* When opened, the résumé card is replaced by the detail panel —
                    only the details show until "See less" collapses it back. */}
                {openActivities.has(a.name) ? (
                  <ClickedActivityPanel
                    activity={a}
                    onClose={() => onCloseActivity(a.name)}
                  />
                ) : (
                  <ActivityResultCard
                    activity={a}
                    active={selectedName === a.name}
                    index={i}
                    onClick={() => onToggleActivity(a)}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
