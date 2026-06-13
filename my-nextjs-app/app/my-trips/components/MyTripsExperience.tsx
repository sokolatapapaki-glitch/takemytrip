"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useApp } from "@/app/context/AppContext";
import { TripCard } from "@/app/components/ActivityCombinations/TripCard";
import {
  addActivityToTrip,
  deleteSavedTrip,
  getSavedTripsSnapshot,
  getServerSavedTrips,
  removeActivityFromTrip,
  replaceActivityInTrip,
  subscribeSavedTrips,
} from "@/app/components/ActivityCombinations/core/trips.storage";
import {
  dayHours,
  formatTime,
  isClosedDay,
  type Activity,
} from "@/app/components/ActivityCombinations/core/activities.functions";
import { DAYS } from "@/app/components/ActivityCombinations/core/activities.data";
import { CITIES } from "@/app/components/ActivityCombinations/core/cities.data";
import type { Trip } from "@/app/components/ActivityCombinations/core/trip.functions";
import { ActivityCard } from "@/app/activities/components/ActivityCard";
import { buttonStyles } from "@/app/components/ui/buttonStyles";

// Every activity in the trip, deduped across days (an activity is used at most
// once per trip, but dedupe defensively) — feeds the strip under each card.
function activitiesOf(trip: Trip): Activity[] {
  const seen = new Map<string, Activity>();
  for (const d of trip.days)
    for (const a of d.activities) if (!seen.has(a.name)) seen.set(a.name, a);
  return [...seen.values()];
}

// What the strip is currently picking for: a swap of one scheduled slot
// ("replace"), or an insertion into a free-time window ("add"). Both turn the
// strip into wiggling, hours-filtered candidates.
type StripMode =
  | { kind: "replace"; tripId: string; day: number; name: string; start: number; end: number }
  | { kind: "add"; tripId: string; day: number; winStart: number; winEnd: number; placeLate: boolean };

// A replacement must be open through the ENTIRE slot on that weekday and not
// need more hours than the slot offers.
function fitsSlot(a: Activity, m: StripMode & { kind: "replace" }): boolean {
  const h = dayHours(a, m.day);
  return (
    !isClosedDay(h) &&
    h.open <= m.start &&
    h.close >= m.end &&
    a.hours <= m.end - m.start + 1e-9
  );
}

// An addition fits if the activity can sit somewhere inside the free window
// while open: latest of (window start, opening) + duration must end before the
// earliest of (window end, closing).
function fitsWindow(a: Activity, m: StripMode & { kind: "add" }): boolean {
  const h = dayHours(a, m.day);
  if (isClosedDay(h)) return false;
  return Math.max(m.winStart, h.open) + a.hours <= Math.min(m.winEnd, h.close) + 1e-9;
}

// The concrete slot an added activity gets: anchored to the window's end when
// placeLate (the before-first-item button), else as early as possible.
function slotFor(a: Activity, m: StripMode & { kind: "add" }): { start: number; end: number } {
  const h = dayHours(a, m.day);
  if (m.placeLate) {
    const end = Math.min(m.winEnd, h.close);
    return { start: end - a.hours, end };
  }
  const start = Math.max(m.winStart, h.open);
  return { start, end: start + a.hours };
}

// The /my-trips page body: the trips saved from the plan page's "Save Trip"
// button (localStorage snapshots), each rendered with the SAME TripCard as the
// plan page — collapsed by default, no proof (saved trips can't carry the live
// filter functions) — plus a horizontal strip of the trip's activities.
//
// Replace flow: clicking "Replace" on a scheduled row scrolls to the strip and
// switches it to WIGGLING candidate cards — same-city activities, not already
// in the trip, that fit the slot's opening hours. "Use" on one swaps it into
// the trip (persisted); the slot's times are kept as they were.
export default function MyTripsExperience() {
  const { openActivity } = useApp();
  // The saved-trips store (localStorage-backed): server renders the empty list,
  // the client snapshot takes over on hydration and updates on every mutation.
  const trips = useSyncExternalStore(
    subscribeSavedTrips,
    getSavedTripsSnapshot,
    getServerSavedTrips
  );
  const [mode, setMode] = useState<StripMode | null>(null);
  const stripRefs = useRef(new Map<string, HTMLDivElement>());

  // Entering replace/add mode scrolls the trip's strip into view.
  useEffect(() => {
    if (!mode) return;
    stripRefs.current
      .get(mode.tripId)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [mode]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
      {/* Plain page title with a "Make Trip" CTA on the opposite side that
          sends the user to the homepage trip search. */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Τα ταξίδια μου</h1>
        {/* The header CTA only shows once there are saved trips; on the empty
            state the single button lives inside the empty-state card below. */}
        {trips.length > 0 ? (
          <Link href="/" className={`${buttonStyles.primary} shrink-0`}>
            Φτιάξε ταξίδι
          </Link>
        ) : null}
      </div>

      {trips.length === 0 ? (
        <div className="rounded-3xl border border-white/80 bg-white/80 p-8 text-center shadow-xl shadow-orange-900/10 ring-1 ring-black/5 backdrop-blur-md">
          <p className="text-sm text-zinc-500">
            Δεν έχεις αποθηκευμένα ταξίδια ακόμη. Σχεδίασε ένα και πάτησε
            «Αποθήκευση ταξιδιού».
          </p>
          <Link href="/" className={`mt-4 inline-flex ${buttonStyles.primary}`}>
            Φτιάξε ταξίδι
          </Link>
        </div>
      ) : null}

      <section className="flex flex-col gap-10">
        {trips.map((t) => {
          const inMode = mode?.tripId === t.id ? mode : null;
          const tripNames = new Set(
            t.trip.days.flatMap((d) => d.activities.map((a) => a.name))
          );
          // The trip's city — found via one of its activities (activity names
          // are unique across catalogues). Leftovers cover the all-days-empty
          // case (everything removed).
          const city = CITIES.find((c) =>
            c.activities.some(
              (a) =>
                tripNames.has(a.name) ||
                t.trip.leftover.some((l) => l.activity.name === a.name)
            )
          );
          const candidates = inMode
            ? (city?.activities ?? []).filter(
                (a) =>
                  !tripNames.has(a.name) &&
                  (inMode.kind === "replace"
                    ? fitsSlot(a, inMode)
                    : fitsWindow(a, inMode))
              )
            : null;
          const stripActivities = candidates ?? activitiesOf(t.trip);

          return (
            <div key={t.id} className="flex flex-col gap-3">
              <span className="text-sm text-zinc-500">
                Αποθηκεύτηκε{" "}
                {new Date(t.savedAt).toLocaleDateString("el-GR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>

              {/* The exact plan-page Trip component, collapsed by default. */}
              <TripCard
                trip={t.trip}
                title={`Ταξίδι ${t.trip.days.length} ${t.trip.days.length === 1 ? "ημέρας" : "ημερών"}`}
                cityName={t.cityName}
                areaName={t.areaName}
                showProof={false}
                onReplace={(item, day) =>
                  setMode((m) =>
                    m?.kind === "replace" &&
                    m.tripId === t.id &&
                    m.day === day &&
                    m.name === item.name
                      ? null // clicking the same Replace again cancels
                      : {
                          kind: "replace",
                          tripId: t.id,
                          day,
                          name: item.name,
                          start: item.start,
                          end: item.end,
                        }
                  )
                }
                onRemove={(item, day) => {
                  removeActivityFromTrip(t.id, day, item.name);
                  setMode(null);
                }}
                onAdd={(win, day) =>
                  setMode((m) =>
                    m?.kind === "add" &&
                    m.tripId === t.id &&
                    m.day === day &&
                    m.winStart === win.start &&
                    m.winEnd === win.end
                      ? null // clicking the same Add again cancels
                      : {
                          kind: "add",
                          tripId: t.id,
                          day,
                          winStart: win.start,
                          winEnd: win.end,
                          placeLate: win.placeLate ?? false,
                        }
                  )
                }
                onDelete={() => deleteSavedTrip(t.id)}
              />

              {/* Replace/Add banner: what's being picked for + how to cancel. */}
              {inMode ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm text-amber-950">
                  <span>
                    {inMode.kind === "replace" ? (
                      <>
                        Διάλεξε αντικαταστάτη για: <strong>{inMode.name}</strong> ·{" "}
                        {DAYS[inMode.day]} {formatTime(inMode.start)}–
                        {formatTime(inMode.end)}
                      </>
                    ) : (
                      <>
                        Διάλεξε δραστηριότητα για προσθήκη · {DAYS[inMode.day]}{" "}
                        {formatTime(inMode.winStart)}–{formatTime(inMode.winEnd)}
                      </>
                    )}{" "}
                    — εμφανίζονται μόνο δραστηριότητες ανοιχτές σε αυτό το διάστημα.
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    className={buttonStyles.underline}
                  >
                    Ακύρωση
                  </button>
                </div>
              ) : null}

              {/* "Activities" label above the trip's own activities (hidden in
                  replace/add mode, where the banner already explains the strip).
                  mt-2 nudges the strip a little lower for breathing room. */}
              {!inMode ? (
                <h3 className="mt-2 text-lg font-semibold text-zinc-800">
                  Δραστηριότητες
                </h3>
              ) : null}

              {/* The activities strip: the trip's own activities, or — in
                  replace mode — the wiggling candidates. py-3 gives the cards
                  top room so their hover lift/tilt isn't clipped. */}
              <div
                ref={(el) => {
                  if (el) stripRefs.current.set(t.id, el);
                  else stripRefs.current.delete(t.id);
                }}
                className="flex gap-4 overflow-x-auto py-3"
              >
                {inMode && stripActivities.length === 0 ? (
                  <p className="py-6 text-sm text-zinc-500">
                    Καμία άλλη δραστηριότητα δεν χωράει σε αυτό το διάστημα.
                  </p>
                ) : (
                  stripActivities.map((a, i) => (
                    <div
                      key={a.name}
                      className={`w-64 shrink-0 ${inMode ? "animate-wiggle" : ""}`}
                      style={inMode ? { animationDelay: `${(i % 5) * 90}ms` } : undefined}
                    >
                      <ActivityCard
                        activity={a}
                        index={i}
                        hideSelect
                        showUse={!!inMode}
                        onUse={
                          inMode
                            ? (act) => {
                                if (inMode.kind === "replace") {
                                  replaceActivityInTrip(
                                    t.id,
                                    inMode.day,
                                    inMode.name,
                                    act
                                  );
                                } else {
                                  addActivityToTrip(
                                    t.id,
                                    inMode.day,
                                    act,
                                    slotFor(act, inMode)
                                  );
                                }
                                setMode(null);
                              }
                            : undefined
                        }
                        onSeeMore={openActivity}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
