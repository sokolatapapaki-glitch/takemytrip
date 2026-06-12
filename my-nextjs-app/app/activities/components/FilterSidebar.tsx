"use client";

import { FaChevronRight } from "react-icons/fa6";
import type { City } from "@/app/components/ActivityCombinations/core/cities.data";
import type { VibeKey } from "@/app/components/ActivityCombinations/core/activities.functions";
import { VIBES } from "@/app/map/components/mapData";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
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
  onOpenAreaModal,
  onChange,
  onToggleVibe,
  mobile = false,
}: {
  city: City;
  filters: ActivityListFilters;
  priceMax: number;
  // Opens the "Distance from" area picker as an app modal (the parent owns the
  // modal so it can list the destination's areas and set the chosen one).
  onOpenAreaModal: () => void;
  onChange: (patch: Partial<ActivityListFilters>) => void;
  onToggleVibe: (vibe: VibeKey) => void;
  // In the mobile drawer the panel chrome (card border/shadow/rounded corners +
  // the redundant "Filters" heading) is dropped — just the bare filter content.
  mobile?: boolean;
}) {
  const centerId = city.areas[0].id;
  const currentAreaId = filters.areaId ?? centerId;
  const currentAreaName =
    city.areas.find((a) => a.id === currentAreaId)?.name ?? "Κέντρο";

  return (
    <aside
      className={
        mobile
          ? "h-fit"
          : "h-fit shrink-0 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-orange-900/5 backdrop-blur-md lg:w-72"
      }
    >
      {!mobile && (
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Φίλτρα
        </h2>
      )}

      {/* Price — max-price slider (actual euro cost). */}
      <div className="mt-5 rounded-3xl">
        <label className="flex items-center justify-between text-sm font-medium text-zinc-700">
          <span>Τιμή</span>
          <span className="text-zinc-500">
            {filters.priceMax != null ? `≤ €${filters.priceMax}` : "Χωρίς όριο"}
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
          className="mt-4 w-full accent-emerald-500"
        />
      </div>

      {/* Vibe — multiple select. */}
      <div className="mt-6">
        <p className="text-sm font-medium text-zinc-700">Vibe</p>
        <p className="text-xs text-zinc-400">Διάλεξε ένα ή περισσότερα</p>
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
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${on
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-900/10"
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

      {/* Distance from — opens the area picker modal (reference point for the
          "Distance from center" sort; default = centre). */}
      <div className="mt-6">
        <p className="text-sm font-medium text-zinc-700">Απόσταση από</p>
        <p className="text-xs text-zinc-400">
          Χρησιμοποιείται από την ταξινόμηση «Απόσταση από το κέντρο»
        </p>
        <button
          type="button"
          onClick={onOpenAreaModal}
          className={`${buttonStyles.common} mt-2 flex w-full items-center justify-between gap-2 ${
            currentAreaId !== centerId ? "text-emerald-700" : ""
          }`}
        >
          <span className="truncate">{currentAreaName}</span>
          <FaChevronRight className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </div>
    </aside>
  );
}
