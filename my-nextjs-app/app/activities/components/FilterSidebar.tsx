"use client";

import type { City } from "@/app/components/ActivityCombinations/core/cities.data";
import type { VibeKey } from "@/app/components/ActivityCombinations/core/activities.functions";
import { VIBES } from "@/app/map/components/mapData";
import { FilterDropdown } from "@/app/map/components/FilterDropdown";
import type { ActivityListFilters } from "./activitiesData";
import { VIBE_ICONS } from "./vibeStyle";

// The left "Filters" panel from the board: a Price slider, a multi-select Vibe
// picker, and a "Distance from" area dropdown (the reference point for the
// "Distance from center" sort; defaults to the city centre).
//
// NOTE: the vibe multi-select here and the header "Select Vibe" dropdown edit the
// SAME `filters.vibes` set — they're two entry points for one filter (as the
// wireframe shows vibe in both places). Drop one if it ever feels redundant.
export function FilterSidebar({
  city,
  filters,
  priceMax,
  areaOpen,
  onAreaToggle,
  onAreaSelect,
  onChange,
  onToggleVibe,
}: {
  city: City;
  filters: ActivityListFilters;
  priceMax: number;
  areaOpen: boolean;
  onAreaToggle: () => void;
  onAreaSelect: (areaId: string) => void;
  onChange: (patch: Partial<ActivityListFilters>) => void;
  onToggleVibe: (vibe: VibeKey) => void;
}) {
  const centerId = city.areas[0].id;
  const currentAreaId = filters.areaId ?? centerId;
  const currentAreaName =
    city.areas.find((a) => a.id === currentAreaId)?.name ?? "Centre";

  return (
    <aside className="h-fit shrink-0 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-orange-900/5 backdrop-blur-md lg:w-72">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Filters
      </h2>

      {/* Price — max-price slider (actual euro cost). */}
      <div className="mt-5">
        <label className="flex items-center justify-between text-sm font-medium text-zinc-700">
          <span>Price</span>
          <span className="text-zinc-400">
            {filters.priceMax != null ? `≤ €${filters.priceMax}` : "Any"}
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={priceMax}
          value={filters.priceMax ?? priceMax}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange({ priceMax: v >= priceMax ? null : v });
          }}
          className="mt-2 w-full accent-orange-500"
        />
      </div>

      {/* Vibe — multiple select. */}
      <div className="mt-6">
        <p className="text-sm font-medium text-zinc-700">Vibe</p>
        <p className="text-xs text-zinc-400">Select one or more</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {VIBES.map((v) => {
            const on = filters.vibes.includes(v.key);
            const Icon = VIBE_ICONS[v.key];
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => onToggleVibe(v.key)}
                aria-pressed={on}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  on
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-900/10"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Distance from — pick the reference area (default = centre). */}
      <div className="mt-6">
        <p className="text-sm font-medium text-zinc-700">Distance from</p>
        <p className="text-xs text-zinc-400">Used by the “Distance from center” sort</p>
        <div className="mt-2">
          <FilterDropdown
            label="Area"
            active={currentAreaId !== centerId}
            summary={currentAreaName}
            open={areaOpen}
            onToggle={onAreaToggle}
          >
            <div className="flex flex-col gap-1">
              {city.areas.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onAreaSelect(a.id)}
                  className={`rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                    currentAreaId === a.id
                      ? "bg-orange-50 text-orange-700"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {a.name}
                  {a.id === centerId ? " (centre)" : ""}
                </button>
              ))}
            </div>
          </FilterDropdown>
        </div>
      </div>
    </aside>
  );
}
