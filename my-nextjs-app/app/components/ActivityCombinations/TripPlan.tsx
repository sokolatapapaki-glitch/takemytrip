"use client";

import { useState } from "react";
import type { Area } from "./core/cities.data";
import type { Filter, Selection } from "./core/filters.functions";
import type { Trip } from "./core/trip.functions";
import { saveTrip } from "./core/trips.storage";
import { TripCard } from "./TripCard";
import { buttonStyles } from "@/app/components/ui/buttonStyles";

// Greek ordinal for the runner-up trips ("2η", "3η", … feminine, agreeing with
// "επιλογή"/"ταξίδι" labels below).
const ordinal = (n: number) => `${n}η`;

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
          ? "Δεν υπάρχουν εναλλακτικά ταξίδια για αυτόν τον αριθμό ημερών."
          : "Τα εναλλακτικά ταξίδια δεν είναι διαθέσιμα στη γρήγορη λειτουργία (δοκίμασε λιγότερες ημέρες)."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {alternatives.slice(0, shown).map((alt, i) => (
        <TripCard
          key={i}
          trip={alt}
          title={`${ordinal(i + 2)} καλύτερη επιλογή`}
          showProof={false}
          showLeftover={false}
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
        // The "Next best trip" reveal — prominent (primary CTA), centred under
        // the best trip. Each click reveals the next runner-up from the existing
        // ranking (trip.alternatives).
        <button
          type="button"
          onClick={() => setShown((s) => s + 1)}
          className={`mx-auto ${buttonStyles.primary}`}
        >
          {shown === 0
            ? "Επόμενο καλύτερο ταξίδι"
            : `Δες την ${ordinal(shown + 2)} καλύτερη επιλογή`}
        </button>
      ) : (
        <p className="text-center text-xs text-zinc-400">
          Δεν υπάρχουν άλλα ταξίδια για εμφάνιση.
        </p>
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
        title={`Πρόγραμμα ταξιδιου ${trip.days.length} ${trip.days.length === 1 ? "ημέρας" : "ημερών"}`}
        showProof={false}
        showLeftover={false}
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
