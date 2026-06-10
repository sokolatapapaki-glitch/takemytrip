"use client";

import { useState } from "react";
import type { Area } from "./core/cities.data";
import type { Filter, Selection } from "./core/filters.functions";
import type { Trip } from "./core/trip.functions";
import { saveTrip } from "./core/trips.storage";
import { TripCard } from "./TripCard";
import { buttonStyles } from "@/app/components/ui/buttonStyles";

const ORDINALS = [
  "", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th",
];
const ordinal = (n: number) => ORDINALS[n] ?? `${n}th`;

// Progressive "show next-best trip" reveal. Each click reveals one more ranked
// runner-up (2nd-best, 3rd-best, …), each rendered as its own collapsed TripCard.
// Mounted with a key tied to the best trip, so switching the best trip resets the
// reveal back to none.
function TripAlternatives({
  alternatives,
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
  alternatives: Trip[];
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
  const [shown, setShown] = useState(0);

  if (alternatives.length === 0) {
    return (
      <p className="text-xs text-zinc-400">
        {exact
          ? "No alternative trips at this day count."
          : "Alternative trips aren't available in fast mode (try fewer days)."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {alternatives.slice(0, shown).map((alt, i) => (
        <TripCard
          key={i}
          trip={alt}
          title={`${ordinal(i + 2)}-best trip`}
          showProof={false}
          onSave={() => saveTrip({ trip: alt, cityName, areaName })}
          cityName={cityName}
          areaName={areaName}
          selections={selections}
          startHours={startHours}
          endHours={endHours}
          circulars={circulars}
          area={area}
          filters={filters}
        />
      ))}
      {shown < alternatives.length ? (
        <button
          type="button"
          onClick={() => setShown((s) => s + 1)}
          className={`self-start ${buttonStyles.secondary}`}
        >
          Show {ordinal(shown + 2)}-best trip
        </button>
      ) : (
        <p className="text-xs text-zinc-400">No more trips to show.</p>
      )}
    </div>
  );
}

// The multi-day trip: each pooled activity used once, assigned so the AVERAGE of
// the days' combo scores is the highest possible. The best trip is shown expanded
// by default; below it, a button reveals the next-best trips one at a time (each
// a collapsed TripCard).
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
  // Identity of the current best trip — when it changes, remount the reveal so it
  // resets to showing none.
  const tripKey =
    trip.days.map((d) => d.activities.map((a) => a.name).join("·")).join("|") +
    ":" +
    trip.score.toFixed(3);

  return (
    <section className="flex flex-col gap-4">
      <TripCard
        trip={trip}
        title={`Best ${trip.days.length}-day trip`}
        description="Every activity used once, assigned to maximize the average of the days' combo scores. Same scheduling rules as the combos above."
        showProof
        defaultOpen
        onSave={() => saveTrip({ trip, cityName, areaName: area.name })}
        cityName={cityName}
        areaName={area.name}
        selections={selections}
        startHours={startHours}
        endHours={endHours}
        circulars={circulars}
        area={area}
        filters={filters}
      />
      <TripAlternatives
        key={tripKey}
        alternatives={trip.alternatives}
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
    </section>
  );
}
