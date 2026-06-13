"use client";

import { useState } from "react";
import { DAYS } from "./core/activities.data";
import type { Activity } from "./core/activities.functions";
import type { Area } from "./core/cities.data";
import { Filter, Selection } from "./core/filters.functions";
import { mondayIndex } from "./core/calendar.functions";
// Reuse the EXACT calendar from the homepage trip search (the "main filters"),
// so the plan-page date picker behaves and looks identical.
import { CalendarModal } from "@/app/start/components/CalendarModal";
import type { DateRange } from "@/app/start/data/types";
import { PerDayFilters } from "./PerDayFilters";
import { buttonStyles } from "@/app/components/ui/buttonStyles";

// Short label for a chosen date, e.g. "Wed 3".
const dateLabel = (d: Date) => `${DAYS[mondayIndex(d)]} ${d.getDate()}`;

// Filter sidebar — the date picker (collapsed behind "Change dates"), the start
// area, and the filter controls. Filters set here are the DEFAULT applied to
// EVERY day; per-day overrides are made in the advanced (per-day) filters modal,
// opened from the button at the bottom.
export function FilterSidebar({
  filters,
  selection,
  onChoose,
  required,
  onToggleRequired,
  startHour,
  onStartHourChange,
  circular,
  onToggleCircular,
  activities,
  areas,
  area,
  areaNoun,
  onAreaChange,
  rangeStart,
  rangeEnd,
  onRangeChange,
  maxDays,
  dates,
  onOpenAdvanced,
  mobile,
}: {
  filters: Filter[];
  selection: Selection;
  onChoose: (filterIndex: number, optionIndex: number) => void;
  required: Set<string>;
  onToggleRequired: (name: string) => void;
  startHour: number;
  onStartHourChange: (hour: number) => void;
  circular: boolean;
  onToggleCircular: () => void;
  activities: Activity[]; // the selected city's catalogue (for "must include")
  areas: Area[]; // the selected city's start areas
  area: Area; // the chosen start area (trip-wide anchor)
  areaNoun: string; // "area" for cities, "city" for regions
  onAreaChange: (area: Area) => void;
  rangeStart: Date;
  rangeEnd: Date | null;
  onRangeChange: (start: Date, end: Date | null) => void;
  minDate?: Date;
  maxDays: number;
  dates: Date[]; // the chosen dates, in order (for the date summary)
  onOpenAdvanced: () => void; // open the advanced (per-day) filters modal
  mobile?: boolean;
}) {
  // The calendar is hidden by default and revealed by "Change dates".
  const [showCalendar, setShowCalendar] = useState(false);

  const wrapperClass = mobile
    ? // In the drawer: bare content only — no card chrome (the drawer panel
      // already provides the white surface + shadow).
      "flex h-full w-full flex-col gap-6 p-5"
    : "flex w-full shrink-0 flex-col gap-6 rounded-3xl border border-white/80 bg-white/80 p-5 shadow-xl shadow-orange-900/10 ring-1 ring-black/5 backdrop-blur-md lg:sticky lg:top-8 lg:w-72 lg:self-start";

  return (
    <aside className={wrapperClass}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          Φίλτρα
        </h2>
      </div>

      {/* Dates — collapsed by default. "Change dates" reveals the calendar; each
          chosen date's weekday drives that day's opening hours. */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Ημερομηνίες
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {rangeEnd === null
                ? "Διάλεξε ημερομηνία λήξης"
                : `${dates.length} ${dates.length === 1 ? "ημέρα" : "ημέρες"}: ${dateLabel(dates[0])} → ${dateLabel(dates[dates.length - 1])}`}
              {" "}· έως {maxDays}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCalendar((s) => !s)}
            aria-expanded={showCalendar}
            className="relative shrink-0 text-xs font-medium text-zinc-700 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-zinc-700 after:transition-transform after:duration-300 after:ease-out after:content-[''] hover:after:scale-x-100 dark:text-zinc-300 dark:after:bg-zinc-300"
          >
            {showCalendar ? "Έγινε" : "Αλλαγή ημερομηνιών"}
          </button>
        </div>
        {showCalendar && (
          // Force the calendar to fill the sidebar width (its own sm:w-80 would
          // otherwise overflow the narrow column).
          <div className="[&>div]:!w-full">
            <CalendarModal
              value={{ start: rangeStart, end: rangeEnd } as DateRange}
              onChange={(r) => onRangeChange(r.start ?? rangeStart, r.end)}
            />
          </div>
        )}
      </div>

      {/* Start area — trip-wide. The chosen area is where every day's distance
          score starts from (and where a circular trip returns to). */}
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Σημείο εκκίνησης ({areaNoun})
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Από εδώ μετριέται η διαδρομή κάθε ημέρας
          </p>
        </div>
        <select
          value={area.id}
          onChange={(e) => {
            const next = areas.find((a) => a.id === e.target.value);
            if (next) onAreaChange(next);
          }}
          className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-zinc-700 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-300"
        >
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Filters set here apply to ALL days by default; override a specific day in
          the advanced (per-day) modal opened below. */}
      <div className="border-t border-black/[.08] pt-4 dark:border-white/[.145]">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Αυτά τα φίλτρα ισχύουν για όλες τις ημέρες. Άλλαξε μια συγκεκριμένη
          ημέρα στα σύνθετα φίλτρα.
        </p>
      </div>

      {/* The filter controls (shared with the advanced modal). Edits here are
          broadcast to every day by the parent. */}
      <PerDayFilters
        filters={filters}
        selection={selection}
        onChoose={onChoose}
        required={required}
        onToggleRequired={onToggleRequired}
        startHour={startHour}
        onStartHourChange={onStartHourChange}
        circular={circular}
        onToggleCircular={onToggleCircular}
        activities={activities}
        areaName={area.name}
      />

      {/* Open the same controls, per day, in a roomier modal with day tabs. */}
      <button
        type="button"
        onClick={onOpenAdvanced}
        className={buttonStyles.secondary}
      >
        Σύνθετα φίλτρα (ανά ημέρα)
      </button>
    </aside>
  );
}
