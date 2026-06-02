import Link from "next/link";
import { ACTIVITIES, DAYS } from "./core/activities.data";
import { formatTime } from "./core/activities.functions";
import { Filter, Selection, isTripLevel } from "./core/filters.functions";
import { RequiredActivities } from "./RequiredActivities";

// Hours the day can start at (whole hours, 06:00–18:00).
const START_HOUR_CHOICES = Array.from({ length: 13 }, (_, i) => 6 + i);

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

// Filter sidebar — the scoring filters plus the hard "must include" filter.
export function FilterSidebar({
  filters,
  selection,
  onChoose,
  required,
  onToggleRequired,
  startHour,
  onStartHourChange,
  day,
  onDayChange,
  daysAfter,
  onDaysAfterChange,
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
  day: number;
  onDayChange: (day: number) => void;
  daysAfter: number;
  onDaysAfterChange: (n: number) => void;
  activeDay: number; // which day tab is selected (0..daysAfter)
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

      {/* Day of the week — picks each activity's opening hours for that day. */}
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Day
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Which day of the week
          </p>
        </div>
        <select
          value={day}
          onChange={(e) => onDayChange(Number(e.target.value))}
          className="w-full rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm text-zinc-700 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-300"
        >
          {DAYS.map((name, i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* How many days AFTER the selected day to also lay out each combo for.
          Total itineraries per combo = daysAfter + 1 (0 = just the selected day). */}
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Days after
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Extra days after the selected to show
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onDaysAfterChange(n)}
              aria-pressed={daysAfter === n}
              className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                daysAfter === n
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-300"
                  : "border-black/[.08] text-zinc-700 hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Day tabs — one per day the trip spans (selected day + daysAfter). The
          active tab's filters/start time/required are what the controls below
          edit, and the active day ranks the combos list. */}
      <div className="flex flex-col gap-2 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Per-day filters
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: daysAfter + 1 }, (_, slot) => {
            const weekday = (day + slot) % 7;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onActiveDayChange(slot)}
                aria-pressed={activeDay === slot}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  activeDay === slot
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-300"
                    : "border-black/[.08] text-zinc-700 hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {DAYS[weekday]}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Editing <span className="font-medium text-zinc-600 dark:text-zinc-300">{DAYS[(day + activeDay) % 7]}</span>
          {activeDay === 0 ? " (selected day)" : ` (day ${activeDay + 1})`} — applies to
          this day in the combos and the trip.
        </p>
      </div>

      {/* Day start time — the hour THIS day's itinerary begins at. */}
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Start time
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            When {DAYS[(day + activeDay) % 7]} begins
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
