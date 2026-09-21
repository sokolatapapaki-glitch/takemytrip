// -----------------------------------------------------------------------------
// Saved trips — localStorage persistence for the "Save Trip" button
// -----------------------------------------------------------------------------
// A saved trip is a SNAPSHOT of the computed Trip exactly as the user saw it on
// the plan page (timed itinerary, scores, leftovers) — nothing is recomputed on
// load, so /my-trips shows what was approved when saving. `alternatives` (the
// nested runner-up trips) are stripped: they're large and meaningless to keep.
// The "Why this trip?" proof can't be saved (it needs live filter functions),
// so saved cards render with showProof={false}.
import type { Activity } from "./activities.functions";
import type { Trip } from "./trip.functions";

export type SavedTrip = {
  id: string;
  savedAt: string; // ISO timestamp
  cityName?: string;
  areaName?: string;
  trip: Trip;
};

const KEY = "ttk.savedTrips";

// Newest first. SSR-safe and resilient to corrupt/missing storage.
export function loadSavedTrips(): SavedTrip[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// --- useSyncExternalStore plumbing -------------------------------------------
// The list doubles as an external store so components can render it with
// useSyncExternalStore (no setState-in-effect). `cache` keeps the snapshot
// reference stable between mutations; mutations replace it and notify.
const EMPTY: SavedTrip[] = [];
let cache: SavedTrip[] | null = null;
const listeners = new Set<() => void>();

function write(next: SavedTrip[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  cache = next;
  listeners.forEach((l) => l());
}

export function subscribeSavedTrips(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSavedTripsSnapshot(): SavedTrip[] {
  if (cache === null) cache = loadSavedTrips();
  return cache;
}

// Server snapshot: localStorage doesn't exist there, render the empty list.
export function getServerSavedTrips(): SavedTrip[] {
  return EMPTY;
}

export function saveTrip(input: {
  trip: Trip;
  cityName?: string;
  areaName?: string;
}): SavedTrip {
  const saved: SavedTrip = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
    cityName: input.cityName,
    areaName: input.areaName,
    trip: { ...input.trip, alternatives: [] },
  };
  write([saved, ...getSavedTripsSnapshot()]);
  return saved;
}

export function deleteSavedTrip(id: string): void {
  write(getSavedTripsSnapshot().filter((t) => t.id !== id));
}

// Remove a scheduled activity from one day of a saved trip. The activity moves
// to the trip's "Not scheduled" list (reason "removed") so it stays visible and
// can be re-added via an Add button. The freed time shows up as a gap in the
// day, where /my-trips offers an Add button.
export function removeActivityFromTrip(
  tripId: string,
  day: number,
  name: string
): void {
  write(
    getSavedTripsSnapshot().map((t) => {
      if (t.id !== tripId) return t;
      const removed = t.trip.days
        .find((d) => d.day === day)
        ?.activities.find((a) => a.name === name);
      return {
        ...t,
        trip: {
          ...t.trip,
          leftover: removed
            ? [...t.trip.leftover, { activity: removed, reason: "removed" as const }]
            : t.trip.leftover,
          days: t.trip.days.map((d) =>
            d.day !== day
              ? d
              : {
                  ...d,
                  activities: d.activities.filter((a) => a.name !== name),
                  plan: {
                    ...d.plan,
                    items: d.plan.items.filter((i) => i.name !== name),
                  },
                }
          ),
        },
      };
    })
  );
}

// Insert an activity into one day of a saved trip at the given time slot (the
// Add → Use flow on /my-trips). The item is placed in start-time order; the
// activity leaves the "Not scheduled" list if it was there.
export function addActivityToTrip(
  tripId: string,
  day: number,
  activity: Activity,
  slot: { start: number; end: number }
): void {
  write(
    getSavedTripsSnapshot().map((t) => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        trip: {
          ...t.trip,
          leftover: t.trip.leftover.filter(
            (l) => l.activity.name !== activity.name
          ),
          days: t.trip.days.map((d) => {
            if (d.day !== day) return d;
            const item = {
              name: activity.name,
              start: slot.start,
              end: slot.end,
              closed: false,
              lunch: false,
            };
            const at = d.plan.items.findIndex((i) => i.start > slot.start);
            const items = [...d.plan.items];
            items.splice(at < 0 ? items.length : at, 0, item);
            return {
              ...d,
              activities: [...d.activities, activity],
              plan: { ...d.plan, items },
            };
          }),
        },
      };
    })
  );
}

// Swap one scheduled activity for another in a saved trip (the Replace → Use
// flow on /my-trips). The replacement takes over the OLD activity's time slot —
// nothing is re-scheduled. The new activity also leaves the "Not scheduled"
// list if it was there; day score/load are snapshot values and stay as saved.
export function replaceActivityInTrip(
  tripId: string,
  day: number,
  oldName: string,
  replacement: Activity
): void {
  write(
    getSavedTripsSnapshot().map((t) => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        trip: {
          ...t.trip,
          leftover: t.trip.leftover.filter(
            (l) => l.activity.name !== replacement.name
          ),
          days: t.trip.days.map((d) => {
            if (d.day !== day) return d;
            return {
              ...d,
              activities: d.activities.map((a) =>
                a.name === oldName ? replacement : a
              ),
              plan: {
                ...d.plan,
                items: d.plan.items.map((item) =>
                  item.name === oldName
                    ? { ...item, name: replacement.name }
                    : item
                ),
              },
            };
          }),
        },
      };
    })
  );
}
