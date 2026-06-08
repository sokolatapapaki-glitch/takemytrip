"use client";

import { useState } from "react";
import Link from "next/link";
import { DAYS } from "./core/activities.data";
import type { Activity } from "./core/activities.functions";
import type { Area } from "./core/cities.data";
import { Filter, Selection } from "./core/filters.functions";
import { mondayIndex } from "./core/calendar.functions";
import { Calendar } from "./Calendar";
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
  minDate,
  maxDays,
  dates,
  onOpenAdvanced,
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
}) {
  // The calendar is hidden by default and revealed by "Change dates".
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 rounded-3xl border border-white/80 bg-white/80 p-5 shadow-xl shadow-orange-900/10 ring-1 ring-black/5 backdrop-blur-md lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:w-64 lg:self-start lg:overflow-y-auto [scrollbar-color:rgba(0,0,0,0.12)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/10 [&::-webkit-scrollbar-track]:bg-transparent">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          Filters
        </h2>
        <Link
          href="/filters"
          className="relative text-xs font-medium text-zinc-700 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-zinc-700 after:transition-transform after:duration-300 after:ease-out after:content-[''] hover:after:scale-x-100 dark:text-zinc-300 dark:after:bg-zinc-300"
        >
          Edit filters
        </Link>
      </div>

      {/* Dates — collapsed by default. "Change dates" reveals the calendar; each
          chosen date's weekday drives that day's opening hours. */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Dates
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {rangeEnd === null
                ? "Pick the end date"
                : `${dates.length} day${dates.length === 1 ? "" : "s"}: ${dateLabel(dates[0])} → ${dateLabel(dates[dates.length - 1])}`}
              {" "}· up to {maxDays}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCalendar((s) => !s)}
            aria-expanded={showCalendar}
            className="relative shrink-0 text-xs font-medium text-zinc-700 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-zinc-700 after:transition-transform after:duration-300 after:ease-out after:content-[''] hover:after:scale-x-100 dark:text-zinc-300 dark:after:bg-zinc-300"
          >
            {showCalendar ? "Done" : "Change dates"}
          </button>
        </div>
        {showCalendar && (
          <Calendar
            start={rangeStart}
            end={rangeEnd}
            onChange={onRangeChange}
            maxDays={maxDays}
            minDate={minDate}
          />
        )}
      </div>

      {/* Start area — trip-wide. The chosen area is where every day's distance
          score starts from (and where a circular trip returns to). */}
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Start {areaNoun}
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Where each day&apos;s route is measured from
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
          These filters apply to all days. Override a specific day in Advanced
          Filters.
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
      />

      {/* Open the same controls, per day, in a roomier modal with day tabs. */}
      <button
        type="button"
        onClick={onOpenAdvanced}
        className={buttonStyles.secondary}
      >
        Advanced Filters (per day)
      </button>
    </aside>
  );
}
