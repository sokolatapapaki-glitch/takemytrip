"use client";

import { useState } from "react";
import { DAYS } from "./core/activities.data";
import type { Filter, Selection } from "./core/filters.functions";
import type { LeftoverReason, Trip } from "./core/trip.functions";
import { DayItinerary } from "./ComboResults";
import { TripDashboard } from "./TripDashboard";

const ORDINALS = [
  "", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th",
];
const ordinal = (n: number) => ORDINALS[n] ?? `${n}th`;

function leftoverText(reason: LeftoverReason): string {
  return reason === "closed"
    ? "closed on all selected days"
    : reason === "no-room"
      ? "no room within the time budget"
      : "would lower the average score";
}

// Renders ONE trip: a titled score header, the per-day itineraries, the leftovers,
// and (for the best trip) a collapsible "Why this trip?" proof. Reused for the
// best trip and every revealed runner-up.
function TripView({
  trip,
  title,
  description,
  showProof,
  selections,
  startHours,
  endHours,
  filters,
}: {
  trip: Trip;
  title: string;
  description?: string;
  showProof: boolean;
  selections: Selection[];
  startHours: number[];
  endHours: number[];
  filters: Filter[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
          {title}
        </h3>
        <span className="font-mono text-sm font-medium text-green-600 dark:text-green-400">
          trip score {trip.score.toFixed(2)}
        </span>
      </div>
      {showProof ? (
        <p className="mb-2 font-mono text-xs text-zinc-400 dark:text-zinc-500">
          {trip.exact ? "exhaustive" : "heuristic"} ·{" "}
          {trip.evaluated.toLocaleString()} states ·{" "}
          {trip.elapsedMs < 1 ? "<1" : Math.round(trip.elapsedMs).toLocaleString()} ms
        </p>
      ) : null}
      {description ? (
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      ) : null}

      <div className="flex flex-col gap-3">
        {trip.days.map((td) => (
          <div
            key={td.day}
            className="rounded-xl border border-black/[.08] bg-white px-5 py-3 dark:border-white/[.145] dark:bg-zinc-900"
          >
            {td.activities.length === 0 ? (
              <>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {DAYS[td.day]}
                </h4>
                <p className="mt-1 text-xs italic text-zinc-400 dark:text-zinc-500">
                  No activities placed.
                </p>
              </>
            ) : (
              <DayItinerary
                plan={td.plan}
                day={td.day}
                note={`score ${td.score.toFixed(2)} · ${td.load.toFixed(1)}h · incl. lunch`}
              />
            )}
          </div>
        ))}
      </div>

      {trip.leftover.length > 0 ? (
        <div className="mt-4">
          <h4 className="mb-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Not scheduled ({trip.leftover.length})
          </h4>
          <ul className="flex flex-col gap-1">
            {trip.leftover.map(({ activity, reason }) => (
              <li
                key={activity.name}
                className="flex items-baseline gap-2 text-xs text-zinc-500 dark:text-zinc-400"
              >
                <span className="text-zinc-700 dark:text-zinc-200">{activity.name}</span>
                <span className="text-zinc-400 dark:text-zinc-500">· {leftoverText(reason)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showProof ? (
        <>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="rounded-lg border border-black/[.08] px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {open ? "Hide breakdown ▲" : "Why this trip? ▼"}
            </button>
          </div>
          {open ? (
            <TripDashboard
              trip={trip}
              selections={selections}
              filters={filters}
              startHours={startHours}
              endHours={endHours}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

// Progressive "show next-best trip" reveal. Each click reveals one more ranked
// runner-up (2nd-best, 3rd-best, …). Mounted with a key tied to the best trip, so
// switching the best trip resets the reveal back to none.
function TripAlternatives({
  alternatives,
  exact,
  selections,
  startHours,
  endHours,
  filters,
}: {
  alternatives: Trip[];
  exact: boolean;
  selections: Selection[];
  startHours: number[];
  endHours: number[];
  filters: Filter[];
}) {
  const [shown, setShown] = useState(0);

  if (alternatives.length === 0) {
    return (
      <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
        {exact
          ? "No alternative trips at this day count."
          : "Alternative trips aren't available in fast mode (try fewer days)."}
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
      {alternatives.slice(0, shown).map((alt, i) => (
        <TripView
          key={i}
          trip={alt}
          title={`${ordinal(i + 2)}-best trip`}
          showProof={false}
          selections={selections}
          startHours={startHours}
          endHours={endHours}
          filters={filters}
        />
      ))}
      {shown < alternatives.length ? (
        <button
          type="button"
          onClick={() => setShown((s) => s + 1)}
          className="self-start rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Show {ordinal(shown + 2)}-best trip
        </button>
      ) : (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">No more trips to show.</p>
      )}
    </div>
  );
}

// The multi-day trip: each pooled activity used once, assigned so the AVERAGE of
// the days' combo scores is the highest possible. Below the best trip, a button
// reveals the next-best trips one at a time.
export function TripPlan({
  trip,
  selections,
  filters,
  startHours,
  endHours,
}: {
  trip: Trip;
  selections: Selection[]; // per day slot (each day's filter choices)
  filters: Filter[];
  startHours: number[]; // per day slot
  endHours: number[]; // per day slot
}) {
  // Identity of the current best trip — when it changes, remount the reveal so it
  // resets to showing none.
  const tripKey =
    trip.days.map((d) => d.activities.map((a) => a.name).join("·")).join("|") +
    ":" +
    trip.score.toFixed(3);

  return (
    <section>
      <TripView
        trip={trip}
        title={`Best ${trip.days.length}-day trip`}
        description="Every activity used once, assigned to maximize the average of the days' combo scores. Same scheduling rules as the combos above."
        showProof
        selections={selections}
        startHours={startHours}
        endHours={endHours}
        filters={filters}
      />
      <TripAlternatives
        key={tripKey}
        alternatives={trip.alternatives}
        exact={trip.exact}
        selections={selections}
        startHours={startHours}
        endHours={endHours}
        filters={filters}
      />
    </section>
  );
}
