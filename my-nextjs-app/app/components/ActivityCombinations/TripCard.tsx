"use client";

import { useState } from "react";
import { FaChevronDown, FaChevronUp, FaRoute, FaTrashCan } from "react-icons/fa6";
import { DAYS } from "./core/activities.data";
import { activityPrice } from "./core/activities.functions";
import { CITIES, type Area } from "./core/cities.data";
import { DESTINATION_IMAGES } from "@/app/cities/components/destinationImages.generated";
import type { Filter, Selection } from "./core/filters.functions";
import type { LeftoverReason, Trip } from "./core/trip.functions";
import type { ScheduledItem } from "./core/schedule.functions";
import { DayItinerary, type AddWindow } from "./ComboResults";
import { TripDashboard } from "./TripDashboard";
import { printTrip } from "./tripPrint";
import { buttonStyles } from "@/app/components/ui/buttonStyles";

function leftoverText(reason: LeftoverReason): string {
  return reason === "closed"
    ? "κλειστό όλες τις επιλεγμένες ημέρες"
    : reason === "no-room"
      ? "δεν χωράει στον διαθέσιμο χρόνο"
      : reason === "removed"
        ? "αφαιρέθηκε από το πλάνο"
        : reason === "bumped"
          ? "έκανε χώρο για μια υποχρεωτική δραστηριότητα"
          : "θα χαμήλωνε τη μέση βαθμολογία";
}

// Total price = what the chosen traveller party pays across every scheduled
// activity (each used once in a trip) — per-age prices with the cheaper family
// bundle when it matches; see activityPrice. Uses the engine's active party.
function totalPriceOf(trip: Trip): number {
  return trip.days.reduce(
    (sum, d) => sum + d.activities.reduce((s, a) => s + activityPrice(a), 0),
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
  onReplace,
  onRemove,
  onAdd,
  onSave,
  onDelete,
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
  // Opt-in (My Trips page): a "Replace" button on each activity row, left of
  // "See more". The handler gets the row's scheduled slot + day.
  onReplace?: (item: ScheduledItem, day: number) => void;
  // Opt-in (My Trips page): a "Remove" button on each activity row.
  onRemove?: (item: ScheduledItem, day: number) => void;
  // Opt-in (My Trips page): "+ Add" buttons in each day's free time.
  onAdd?: (win: AddWindow, day: number) => void;
  // Makes the "Save Trip" button live; omitted (e.g. on /my-trips, where the
  // trip IS the saved copy) the button is hidden.
  onSave?: () => void;
  // Renders a "Delete" button in the card header (My Trips page) — removes the
  // saved trip. Omitted elsewhere, so plan-page cards show no Delete.
  onDelete?: () => void;
  // The proof inputs — only needed when showProof is true (the plan page).
  // Saved trips can't carry them (filters hold functions), so they're optional.
  selections?: Selection[];
  startHours?: number[];
  endHours?: number[];
  circulars?: boolean[];
  area?: Area;
  filters?: Filter[];
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [proofOpen, setProofOpen] = useState(false);
  const [leftoverOpen, setLeftoverOpen] = useState(false);
  // Brief "Saved ✓" feedback on the Save Trip button.
  const [justSaved, setJustSaved] = useState(false);

  const totalPrice = totalPriceOf(trip);
  const cityArea = cityName
    ? areaName
      ? `${cityName} – ${areaName}`
      : cityName
    : title;
  // The destination's cover photo (cities are matched by name — TripCard only
  // receives cityName). Missing → the gradient + route-icon placeholder.
  const coverImage = cityName
    ? DESTINATION_IMAGES[CITIES.find((c) => c.name === cityName)?.id ?? ""] ?? null
    : null;

  const cardClass =
    "animate-card-pop overflow-hidden rounded-none sm:rounded-3xl border border-white/80 bg-white/80 shadow-xl shadow-orange-900/10 ring-1 ring-black/5 backdrop-blur-md transition duration-200 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/10";
  const imageClass =
    "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 via-rose-400 to-fuchsia-500 text-white";
  // Common button (see buttonStyles.ts) + the inline-flex layout for its arrow.
  const toggleBtn = `inline-flex items-center gap-1.5 ${buttonStyles.common}`;
  // The header looks identical whether the card is open or closed; only the
  // toggle's label/arrow flips. (The divider below it shows only when a body
  // follows, i.e. when open.)
  const header = (
    <header
      className={`flex items-start gap-4 p-3 ${open ? "border-b border-black/[.08] bg-white/55" : ""
        }`}
    >
      {/* Destination cover — a bigger square (height = width); falls back to
          the gradient + route icon when the city has no cover. */}
      <div className={`${imageClass} aspect-square h-24 w-24`} aria-hidden>
        <FaRoute className="h-9 w-9 drop-shadow" />
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {title}
        </span>
        <h3 className="mt-0.5 truncate text-lg font-semibold text-zinc-800">
          {cityArea}
        </h3>
        <p className="text-sm text-zinc-500">Συνολική τιμή: €{totalPrice}</p>
      </div>
      <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            title="Διαγραφή ταξιδιού"
            aria-label="Διαγραφή ταξιδιού"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/[.05] hover:text-red-600 dark:hover:bg-white/[.08] dark:hover:text-red-400"
          >
            <FaTrashCan className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex shrink-0 items-center gap-1.5 ${buttonStyles.underline}`}
        >
          {open ? "Απόκρυψη" : "Δες δραστηριότητες"}
          {open ? (
            <FaChevronUp className="h-3 w-3" />
          ) : (
            <FaChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>
    </header>
  );

  // -- Closed (compact) — just the shared header. ----------------------------
  if (!open) {
    return <article className={cardClass}>{header}</article>;
  }

  // -- Open (expanded) -------------------------------------------------------
  return (
    <article className={cardClass}>
      {header}

      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          Ταξίδι
          <div className="flex justify-end gap-3">
            {onSave ? (
              <button
                type="button"
                onClick={() => {
                  onSave();
                  setJustSaved(true);
                  setTimeout(() => setJustSaved(false), 2000);
                }}
                className={`${buttonStyles.common} whitespace-nowrap`}
              >
                {justSaved ? "Αποθηκεύτηκε ✓" : "Αποθήκευση ταξιδιού"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => printTrip(trip, cityArea)}
              className={`${buttonStyles.secondary} whitespace-nowrap`}
            >
              Λήψη PDF
            </button>
          </div>
        </div>

        {/* The day-by-day program (timeline reused as-is). */}
        <div className="flex flex-col gap-3">
          {trip.days.map((td) => (
            <div
              key={td.day}
              className="rounded-2xl border border-white/60 bg-white/70 px-4 py-0"
            >
              {td.activities.length === 0 ? (
                <>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {DAYS[td.day]}
                  </h4>
                  <p className="mt-1 text-xs italic text-zinc-400">
                    Δεν έχουν τοποθετηθεί δραστηριότητες.
                  </p>
                  {onAdd ? (
                    <button
                      type="button"
                      onClick={() => onAdd({ start: 9, end: 21 }, td.day)}
                      className={`mb-2 mt-1 ${buttonStyles.common}`}
                    >
                      + Προσθήκη (09:00–21:00)
                    </button>
                  ) : null}
                </>
              ) : (
                <DayItinerary
                  plan={td.plan}
                  day={td.day}
                  note={`βαθμός ${td.score.toFixed(2)} · ${td.load.toFixed(1)}ω · με μεσημεριανό`}
                  showSeeMore
                  onReplace={onReplace}
                  onRemove={onRemove}
                  onAdd={onAdd}
                  connectors
                />
              )}
            </div>
          ))}
        </div>

        {/* "Why this trip?" — BELOW the days (not inline with them). Needs the
            live proof inputs, which saved trips don't carry. */}
        {showProof && selections && startHours && endHours && circulars && area && filters ? (
          <div>
            <button
              type="button"
              onClick={() => setProofOpen((v) => !v)}
              aria-expanded={proofOpen}
              className={toggleBtn}
            >
              {proofOpen ? "Απόκρυψη ανάλυσης" : "Γιατί αυτό το ταξίδι;"}
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
                ? `Απόκρυψη μη προγραμματισμένων (${trip.leftover.length})`
                : `Μη προγραμματισμένες (${trip.leftover.length})`}
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
