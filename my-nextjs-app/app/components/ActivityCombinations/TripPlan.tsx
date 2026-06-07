"use client";

import { useState } from "react";
import type { Area } from "./core/cities.data";
import type { Filter, Selection } from "./core/filters.functions";
import type { Trip } from "./core/trip.functions";
import { TripCard } from "./TripCard";

const ORDINALS = [
  "", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th",
];
const ordinal = (n: number) => ORDINALS[n] ?? `${n}th`;

// Pager over the best trip and its ranked runner-ups: shows ONE trip card at a
// time with Previous / Next controls below it. Index 0 is the best trip (shown
// with its proof + description); later indexes are the 2nd-best, 3rd-best, … .
// Mounted with a key tied to the best trip, so a new best trip resets the pager
// back to the first card.
function TripPager({
  trips,
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
  trips: Trip[]; // [best, ...ranked alternatives]
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
  const total = trips.length;
  const current = trips[index];
  const isBest = index === 0;

  const pagerBtn =
    "inline-flex items-center gap-1.5 rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <section className="flex flex-col gap-4">
      {/* The trip currently being viewed. Keyed by index so navigating remounts
          the card and it opens expanded by default. */}
      <TripCard
        key={index}
        trip={current}
        title={isBest ? `Best ${current.days.length}-day trip` : `${ordinal(index + 1)}-best trip`}
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

      {/* Previous / Next pager — step through the best trip and its alternatives. */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className={pagerBtn}
        >
          ← Previous trip
        </button>
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
          Trip {index + 1} of {total}
        </span>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
          disabled={index >= total - 1}
          className={pagerBtn}
        >
          Next trip →
        </button>
      </div>

      {total === 1 ? (
        <p className="text-center text-xs text-zinc-400">
          {exact
            ? "No alternative trips at this day count."
            : "Alternative trips aren't available in fast mode (try fewer days)."}
        </p>
      ) : null}
    </section>
  );
}

// The multi-day trip: each pooled activity used once, assigned so the AVERAGE of
// the days' combo scores is the highest possible. The best trip and its ranked
// runner-ups are browsed one at a time with the Previous / Next pager below the
// card.
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
  // Identity of the current best trip — when it changes, remount the pager so it
  // resets to the first (best) trip.
  const tripKey =
    trip.days.map((d) => d.activities.map((a) => a.name).join("·")).join("|") +
    ":" +
    trip.score.toFixed(3);

  return (
    <TripPager
      key={tripKey}
      trips={[trip, ...trip.alternatives]}
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
