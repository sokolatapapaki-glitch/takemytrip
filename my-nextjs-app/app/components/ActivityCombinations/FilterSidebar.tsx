import Link from "next/link";
import { ACTIVITIES, DAYS } from "./core/activities.data";
import { formatTime } from "./core/activities.functions";
import { Filter, Selection, isTripLevel } from "./core/filters.functions";
import { mondayIndex } from "./core/calendar.functions";
import { Calendar } from "./Calendar";
import { RequiredActivities } from "./RequiredActivities";

// Hours the day can start at (whole hours, 06:00–18:00).
const START_HOUR_CHOICES = Array.from({ length: 13 }, (_, i) => 6 + i);

// Short label for a chosen date, e.g. "Wed 3".
const dateLabel = (d: Date) => `${DAYS[mondayIndex(d)]} ${d.getDate()}`;

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${active
        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-300"
        : "border-black/[.08] text-zinc-700 hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
        }`}
    >
      {children}
    </button>
  );
}

// Filter sidebar — the date picker, the per-day filter tabs + their controls, and
// the hard "must include" filter.
export function FilterSidebar({
  filters,
  selection,
  onChoose,
  required,
  onToggleRequired,
  startHour,
  onStartHourChange,
  rangeStart,
  rangeEnd,
  onRangeChange,
  minDate,
  maxDays,
  dates,
  activeDay,
  onActiveDayChange,
}: {
  filters: Filter[];
  selection: Selection;
  onChoose: (filterIndex: number, optionIndex: number) => void;
  required: Set<string>;
  onToggleRequired: (name: string) => void;
  startHour: number;
  onStartHourChange: (hour: number) => void;
  rangeStart: Date;
  rangeEnd: Date | null;
  onRangeChange: (start: Date, end: Date | null) => void;
  minDate?: Date;
  maxDays: number;
  dates: Date[]; // the chosen dates, in order
  activeDay: number; // which day tab is selected (0..dates.length-1)
  onActiveDayChange: (slot: number) => void;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:w-64 lg:self-start lg:overflow-y-auto lg:pr-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          Filters
        </h2>
        <Link
          href="/filters"
          className="rounded-lg border border-black/[.08] px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Edit filters
        </Link>
      </div>

      {/* Date picker — click a start date, then an end date (up to maxDays). Each
          chosen date's weekday drives that day's opening hours. */}
      <div className="flex flex-col gap-2">
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
        <Calendar
          start={rangeStart}
          end={rangeEnd}
          onChange={onRangeChange}
          maxDays={maxDays}
          minDate={minDate}
        />
      </div>

      {/* Day tabs — one per chosen date. The active tab's filters/start time/
          required are what the controls below edit, and the active day ranks the
          combos list. */}
      <div className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Per-day filters
        </h3>
        <div className="flex flex-wrap gap-1.5">
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
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Editing{" "}
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            {dates[activeDay] ? dateLabel(dates[activeDay]) : "—"}
          </span>{" "}
          {activeDay === 0 ? "(first day)" : `(day ${activeDay + 1})`} — applies to this
          day in the combos and the trip.
        </p>
      </div>

      {/* Day start time — the hour THIS day's itinerary begins at. */}
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Start time
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            When {dates[activeDay] ? dateLabel(dates[activeDay]) : "this day"} begins
          </p>
        </div>
        <select
          value={startHour}
          onChange={(e) => onStartHourChange(Number(e.target.value))}
          className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-zinc-700 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-300"
        >
          {START_HOUR_CHOICES.map((h) => (
            <option key={h} value={h}>
              {formatTime(h)}
            </option>
          ))}
        </select>
      </div>

      {filters.map((filter, fi) =>
        // Trip-level filters (e.g. "Use every activity") have no per-option
        // choice — they're tuned in the editor and applied to the whole trip, so
        // they're not shown here. Returning null keeps `fi` aligned with the
        // selection.
        isTripLevel(filter) ? null : (
          <div key={filter.name} className="flex flex-col gap-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {filter.name}
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {filter.hint ?? (filter.multi ? "Pick any" : "Pick one")}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              {filter.options.map((opt, i) => (
                <FilterButton
                  key={opt.name}
                  active={(selection[fi] ?? []).includes(i)}
                  onClick={() => onChoose(fi, i)}
                >
                  {opt.name}
                </FilterButton>
              ))}
            </div>
          </div>
        )
      )}

      <RequiredActivities
        activities={ACTIVITIES}
        required={required}
        onToggle={onToggleRequired}
      />
    </aside>
  );
}
