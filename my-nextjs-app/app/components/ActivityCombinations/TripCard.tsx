"use client";

import { useState } from "react";
import { FaChevronDown, FaChevronUp, FaRoute } from "react-icons/fa6";
import { DAYS } from "./core/activities.data";
import type { Area } from "./core/cities.data";
import type { Filter, Selection } from "./core/filters.functions";
import type { LeftoverReason, Trip } from "./core/trip.functions";
import { DayItinerary } from "./ComboResults";
import { TripDashboard } from "./TripDashboard";

function leftoverText(reason: LeftoverReason): string {
  return reason === "closed"
    ? "closed on all selected days"
    : reason === "no-room"
      ? "no room within the time budget"
      : "would lower the average score";
}

// Total price = sum of every scheduled activity's cost across all days (each
// activity is used once in a trip). Display-only; the planner is untouched.
function totalPriceOf(trip: Trip): number {
  return trip.days.reduce(
    (sum, d) => sum + d.activities.reduce((s, a) => s + a.cost, 0),
    0
  );
}

// A reusable trip card with two states toggled within the SAME component:
//   • closed (default) — the compact summary: image, City – Area, total price,
//     total days, and a "See Activities" button that expands it.
//   • open — the full program: per-day timeline (reusing DayItinerary, so the
//     "Hours" view + per-day total hours are kept), then the "Why this trip?"
//     proof BELOW the days, and a "Not scheduled" toggle at the bottom.
// Glass styling matches the Cities / Map / Activities pages. The component is
// page-agnostic so it can be reused elsewhere; the Plan page opens the best trip
// by default via `defaultOpen`.
export function TripCard({
  trip,
  title,
  description,
  cityName,
  areaName,
  showProof,
  defaultOpen = false,
  selections,
  startHours,
  endHours,
  circulars,
  area,
  filters,
}: {
  trip: Trip;
  title: string;
  description?: string;
  cityName?: string; // for the "City – Area" line
  areaName?: string;
  showProof: boolean;
  defaultOpen?: boolean;
  selections: Selection[];
  startHours: number[];
  endHours: number[];
  circulars: boolean[];
  area: Area;
  filters: Filter[];
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [proofOpen, setProofOpen] = useState(false);
  const [leftoverOpen, setLeftoverOpen] = useState(false);

  const totalPrice = totalPriceOf(trip);
  const totalDays = trip.days.length;
  const cityArea = cityName
    ? areaName
      ? `${cityName} – ${areaName}`
      : cityName
    : title;

  const cardClass =
    "animate-card-pop overflow-hidden rounded-3xl border border-white/80 bg-white/80 shadow-xl shadow-orange-900/10 ring-1 ring-black/5 backdrop-blur-md";
  const imageClass =
    "flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-rose-400 to-fuchsia-500 text-white";
  // Borderless, intense, white-text toggle (matches the brighter button style).
  const toggleBtn =
    "inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-orange-900/10 transition-colors hover:bg-orange-600";
  const scoreChip = (
    <span className="rounded-full bg-emerald-500 px-2 py-0.5 font-mono text-xs font-medium text-white">
      score {trip.score.toFixed(2)}
    </span>
  );

  // -- Closed (compact) ------------------------------------------------------
  if (!open) {
    return (
      <article className={cardClass}>
        <div className="flex gap-4 p-4">
          <div className={`${imageClass} h-24 w-28`} aria-hidden>
            <FaRoute className="h-9 w-9 drop-shadow" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                {title}
              </span>
              {scoreChip}
            </div>
            <h3 className="mt-0.5 truncate text-lg font-semibold text-zinc-800">
              {cityArea}
            </h3>
            <p className="text-sm text-zinc-500">Total price: €{totalPrice}</p>
            <p className="text-sm text-zinc-500">
              Total days: {totalDays}
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-auto self-end rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-orange-900/10 transition-colors hover:bg-orange-600"
            >
              See Activities
            </button>
          </div>
        </div>
      </article>
    );
  }

  // -- Open (expanded) -------------------------------------------------------
  return (
    <article className={cardClass}>
      {/* Header — same summary, with a collapse control. */}
      <header className="flex items-start gap-4 border-b border-white/60 p-4">
        <div className={`${imageClass} h-16 w-20`} aria-hidden>
          <FaRoute className="h-7 w-7 drop-shadow" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              {title}
            </span>
            {scoreChip}
          </div>
          <h3 className="mt-0.5 truncate text-lg font-semibold text-zinc-800">
            {cityArea}
          </h3>
          <p className="text-sm text-zinc-500">
            Total price: €{totalPrice} · Total days: {totalDays}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-expanded
          className={`shrink-0 ${toggleBtn}`}
        >
          Hide <FaChevronUp className="h-3 w-3" />
        </button>
      </header>

      <div className="flex flex-col gap-3 p-4">
        {showProof ? (
          <p className="font-mono text-xs text-zinc-400">
            {trip.exact ? "exhaustive" : "heuristic"} ·{" "}
            {trip.evaluated.toLocaleString()} states ·{" "}
            {trip.elapsedMs < 1
              ? "<1"
              : Math.round(trip.elapsedMs).toLocaleString()}{" "}
            ms
          </p>
        ) : null}
        {description ? (
          <p className="text-sm text-zinc-500">{description}</p>
        ) : null}

        {/* The day-by-day program (timeline reused as-is). */}
        <div className="flex flex-col gap-3">
          {trip.days.map((td) => (
            <div
              key={td.day}
              className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3"
            >
              {td.activities.length === 0 ? (
                <>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {DAYS[td.day]}
                  </h4>
                  <p className="mt-1 text-xs italic text-zinc-400">
                    No activities placed.
                  </p>
                </>
              ) : (
                <DayItinerary
                  plan={td.plan}
                  day={td.day}
                  note={`score ${td.score.toFixed(2)} · ${td.load.toFixed(1)}h · incl. lunch`}
                  showSeeMore
                  connectors
                />
              )}
            </div>
          ))}
        </div>

        {/* "Why this trip?" — BELOW the days (not inline with them). */}
        {showProof ? (
          <div>
            <button
              type="button"
              onClick={() => setProofOpen((v) => !v)}
              aria-expanded={proofOpen}
              className={toggleBtn}
            >
              {proofOpen ? "Hide breakdown" : "Why this trip?"}
              {proofOpen ? (
                <FaChevronUp className="h-3 w-3" />
              ) : (
                <FaChevronDown className="h-3 w-3" />
              )}
            </button>
            {proofOpen ? (
              <TripDashboard
                trip={trip}
                selections={selections}
                filters={filters}
                startHours={startHours}
                endHours={endHours}
                circulars={circulars}
                area={area}
              />
            ) : null}
          </div>
        ) : null}

        {/* Not scheduled — a toggle at the bottom of the expanded card. */}
        {trip.leftover.length > 0 ? (
          <div className="border-t border-white/60 pt-3">
            <button
              type="button"
              onClick={() => setLeftoverOpen((v) => !v)}
              aria-expanded={leftoverOpen}
              className={toggleBtn}
            >
              {leftoverOpen
                ? `Hide not scheduled (${trip.leftover.length})`
                : `Not scheduled (${trip.leftover.length})`}
              {leftoverOpen ? (
                <FaChevronUp className="h-3 w-3" />
              ) : (
                <FaChevronDown className="h-3 w-3" />
              )}
            </button>
            {leftoverOpen ? (
              <ul className="mt-2 flex flex-col gap-1">
                {trip.leftover.map(({ activity, reason }) => (
                  <li
                    key={activity.name}
                    className="flex items-baseline gap-2 text-xs text-zinc-500"
                  >
                    <span className="text-zinc-700">{activity.name}</span>
                    <span className="text-zinc-400">· {leftoverText(reason)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
