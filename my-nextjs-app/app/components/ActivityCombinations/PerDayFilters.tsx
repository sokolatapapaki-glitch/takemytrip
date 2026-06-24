"use client";

import { Fragment, useState } from "react";
import { FaCircleInfo } from "react-icons/fa6";
import { formatTime, type Activity } from "./core/activities.functions";
import { Filter, Selection, isTripLevel } from "./core/filters.functions";
import { RequiredActivities } from "./RequiredActivities";
import { CheckRow } from "./CheckRow";
import { HIDE_REQUIRED_ACTIVITIES } from "@/app/config";

// Hours the day can start at (whole hours, 06:00–18:00).
const START_HOUR_CHOICES = Array.from({ length: 13 }, (_, i) => 6 + i);

// A filter section title with an info icon to its right. The hint is HIDDEN by
// default: on desktop it reveals on hover (group-hover); on mobile (no hover) it
// toggles when the icon is tapped. Both work together — tapping pins it open.
function HintTitle({ name, hint }: { name: string; hint?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="group">
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {name}
        </h3>
        {hint ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Περισσότερες πληροφορίες"
            aria-expanded={open}
            className="inline-flex shrink-0 items-center justify-center text-black transition-opacity hover:opacity-70 dark:text-white"
          >
            <FaCircleInfo className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {hint ? (
        <p
          className={`mt-0.5 text-xs text-zinc-400 dark:text-zinc-500 ${open ? "block" : "hidden"} group-hover:block`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// One option button in a filter group. Shared by the sidebar and the advanced
// (per-day) modal so both render identical controls.
export function FilterButton({
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

// The controls for a SINGLE day's filters: start time, the per-option filter
// groups, the circular-trip toggle (placed just below the "Cost budget" group),
// and the hard "must include" list. Rendered both in the sidebar and (per day,
// via tabs) in the advanced-filters modal — same props, same handlers, so editing
// in either place updates the same day's state.
export function PerDayFilters({
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
  dayLabel,
  areaName = "το κέντρο",
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
  dayLabel?: string; // e.g. "Wed 3" — for the start-time caption
  areaName?: string; // the chosen start area — for the circular-trip caption
}) {
  // Circular-trip toggle — when on, THIS day's route is scored as a loop that
  // starts AND returns to the centre, instead of a one-way route. Rendered just
  // below the "Cost budget" filter group (see the map below).
  const circularBlock = (
    <div className="flex flex-col gap-2">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={circular}
          onChange={onToggleCircular}
          className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
        />
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Κυκλική διαδρομή
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Ξεκινά και επιστρέφει στο {areaName}
          </span>
        </span>
      </label>
    </div>
  );

  // Fallback: if no "Cost budget" filter exists, render the circular toggle at
  // the end of the groups instead.
  const hasCostBudget = filters.some((f) => f.name === "Cost budget");

  return (
    <>
      {/* Day start time — the hour THIS day's itinerary begins at. */}
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Ώρα έναρξης
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Πότε ξεκινά {dayLabel ?? "η ημέρα"}
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
        // they're not shown here. Hidden filters (e.g. "Tourist priority", or
        // "Vibe" when its UI is off) are retired knobs we keep scoring but don't
        // render. Returning null in both cases keeps `fi` aligned with the
        // selection.
        isTripLevel(filter) || filter.hidden ? null : (
          <Fragment key={filter.name}>
            <div className="flex flex-col gap-2">
              <HintTitle
                name={filter.name}
                hint={filter.hint ?? (filter.multi ? "Διάλεξε όσα θες" : "Διάλεξε ένα")}
              />
              <div className="flex flex-col gap-1.5">
                {filter.options.map((opt, i) => {
                  const active = (selection[fi] ?? []).includes(i);
                  // The Vibe filter reads as a multi-select tick list (CheckRow);
                  // all other groups keep the bordered FilterButton.
                  return filter.name === "Vibe" ? (
                    <CheckRow
                      key={opt.name}
                      active={active}
                      onClick={() => onChoose(fi, i)}
                    >
                      {opt.name}
                    </CheckRow>
                  ) : (
                    <FilterButton
                      key={opt.name}
                      active={active}
                      onClick={() => onChoose(fi, i)}
                    >
                      {opt.name}
                    </FilterButton>
                  );
                })}
              </div>
              {/* Clarify what the budget covers — one day's activities for the
                  whole party, not per person (see activityPrice / sumPartyCost). */}
              {filter.name === "Κόστος" ? (
                <p className="text-xs italic text-zinc-400 dark:text-zinc-500">
                  Το ποσό αφορά μία ημέρα, για όλα τα άτομα μαζί.
                </p>
              ) : null}
            </div>
            {filter.name === "Cost budget" ? circularBlock : null}
          </Fragment>
        )
      )}
      {!hasCostBudget ? circularBlock : null}

      {!HIDE_REQUIRED_ACTIVITIES && (
        <RequiredActivities
          activities={activities}
          required={required}
          onToggle={onToggleRequired}
        />
      )}
    </>
  );
}
