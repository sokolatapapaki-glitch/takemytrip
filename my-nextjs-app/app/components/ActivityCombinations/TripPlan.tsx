"use client";

import { useState } from "react";
import type { Area } from "./core/cities.data";
import type { Filter, Selection } from "./core/filters.functions";
import type { Trip } from "./core/trip.functions";
import { TripCard } from "./TripCard";

// Pager over the states the planner kept: the best-scoring arrangement and its
// ranked runner-ups (the next-best states the algorithm found, up to TOP_K). Note
// the proof line's "N states" is the total the search EVALUATED — only the top
// distinct ones by score are retained, and those are what this pager walks. Shows
// ONE state card at a time with Previous / Next controls below it. Index 0 is the
// best match (with its proof + description). Mounted with a key tied to the best
// result, so a recomputation resets the pager back to the first state.
function StatePager({
  states,
  exact,
  cityName,
  areaName,
  selections,
  startHours,
  endHours,
  circulars,
  area,
  filters,
}: {
  states: Trip[]; // [best, ...ranked runner-up states]
  exact: boolean;
  cityName?: string;
  areaName?: string;
  selections: Selection[];
  startHours: number[];
  endHours: number[];
  circulars: boolean[];
  area: Area;
  filters: Filter[];
}) {
  const [index, setIndex] = useState(0);
  const total = states.length;
  const current = states[index];
  const isBest = index === 0;

  const pagerBtn =
    "inline-flex items-center gap-1.5 rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <section className="flex flex-col gap-4">
      {/* The state currently being viewed. Keyed by index so navigating remounts
          the card and it opens expanded by default. */}
      <TripCard
        key={index}
        trip={current}
        title={`State ${index + 1}${isBest ? " · best match" : ""}`}
        description={
          isBest
            ? "Every activity used once, assigned to maximize the average of the days' combo scores. Same scheduling rules as the combos above."
            : undefined
        }
        showProof={isBest}
        defaultOpen
        cityName={cityName}
        areaName={areaName}
        selections={selections}
        startHours={startHours}
        endHours={endHours}
        circulars={circulars}
        area={area}
        filters={filters}
      />

      {/* Previous / Next pager — step through the states the algorithm kept. */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className={pagerBtn}
        >
          ← Previous state
        </button>
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
          State {index + 1} of {total}
        </span>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
          disabled={index >= total - 1}
          className={pagerBtn}
        >
          Next state →
        </button>
      </div>

      {total === 1 ? (
        <p className="text-center text-xs text-zinc-400">
          {exact
            ? "No other states at this day count."
            : "More states aren't available in fast mode (try fewer days)."}
        </p>
      ) : null}
    </section>
  );
}

// The multi-day trip: each pooled activity used once, assigned so the AVERAGE of
// the days' combo scores is the highest possible. The best-scoring state and its
// ranked runner-ups are browsed one at a time with the Previous / Next pager
// below the card.
export function TripPlan({
  trip,
  area,
  cityName,
  selections,
  filters,
  startHours,
  endHours,
  circulars,
}: {
  trip: Trip;
  area: Area; // the selected start area (map start marker)
  cityName?: string; // for the "City – Area" line on each card
  selections: Selection[]; // per day slot (each day's filter choices)
  filters: Filter[];
  startHours: number[]; // per day slot
  endHours: number[]; // per day slot
  circulars: boolean[]; // per day slot — circular (loop) trip toggle
}) {
  // Identity of the current best result — when it changes, remount the pager so
  // it resets to the first (best) state.
  const tripKey =
    trip.days.map((d) => d.activities.map((a) => a.name).join("·")).join("|") +
    ":" +
    trip.score.toFixed(3);

  return (
    <StatePager
      key={tripKey}
      states={[trip, ...trip.alternatives]}
      exact={trip.exact}
      cityName={cityName}
      areaName={area.name}
      selections={selections}
      startHours={startHours}
      endHours={endHours}
      circulars={circulars}
      area={area}
      filters={filters}
    />
  );
}
