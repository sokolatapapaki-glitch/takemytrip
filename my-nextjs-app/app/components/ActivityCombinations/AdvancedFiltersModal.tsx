"use client";

import { DAYS } from "./core/activities.data";
import type { Activity } from "./core/activities.functions";
import { Filter, Selection } from "./core/filters.functions";
import { mondayIndex } from "./core/calendar.functions";
import { PerDayFilters } from "./PerDayFilters";
import { buttonStyles } from "@/app/components/ui/buttonStyles";

// Short label for a chosen date, e.g. "Wed 3".
const dateLabel = (d: Date) => `${DAYS[mondayIndex(d)]} ${d.getDate()}`;

// The "Advanced filters" modal: the SAME per-day filter controls as the sidebar,
// but laid out roomily with a day tab per chosen date. Switching tabs changes the
// active day (shared with the rest of the planner), and the controls below edit
// that day's filters. Opened from the sidebar's "Advanced Filters (per day)"
// button; closed via the X, the Done button, or the backdrop.
export function AdvancedFiltersModal({
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
  dates,
  activeDay,
  onActiveDayChange,
  onClose,
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
  activities: Activity[];
  dates: Date[];
  activeDay: number;
  onActiveDayChange: (slot: number) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Advanced filters"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-black/[.08] bg-white shadow-2xl dark:border-white/[.145] dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[.08] px-5 py-4 dark:border-white/[.145]">
          <div>
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              Advanced filters
            </h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Tune each day separately — pick a day below.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* Day tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-black/[.08] px-5 py-3 dark:border-white/[.145]">
          {dates.map((d, slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => onActiveDayChange(slot)}
              aria-pressed={activeDay === slot}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${activeDay === slot
                ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-300"
                : "border-black/[.08] text-zinc-700 hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
            >
              {dateLabel(d)}
            </button>
          ))}
        </div>

        {/* The active day's controls */}
        <div className="flex flex-col gap-6 overflow-y-auto px-5 py-4">
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
            dayLabel={dates[activeDay] ? dateLabel(dates[activeDay]) : undefined}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-black/[.08] px-5 py-3 dark:border-white/[.145]">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${buttonStyles.secondary}`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
