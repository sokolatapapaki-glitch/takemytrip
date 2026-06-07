import { VIBES } from "./core/activities.data";
import { openingHoursFor, type Activity } from "./core/activities.functions";

// The catalogue of available activities for the selected city, optionally
// filtered by a free-text `query` (matches name or description). Opening hours
// are shown for the currently selected day. The section heading lives in the
// parent (it sits next to the "Select activities" toggle).
export function ActivityList({
  day,
  activities,
  query = "",
}: {
  day: number;
  activities: Activity[];
  query?: string;
}) {
  const q = query.trim().toLowerCase();
  const shown = q
    ? activities.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      )
    : activities;

  return (
    <div className="flex flex-col gap-2">
      {shown.length === 0 && (
        <p className="rounded-xl border border-black/[.08] px-5 py-3 text-sm text-zinc-400 dark:border-white/[.145] dark:text-zinc-500">
          No activities match “{query}”.
        </p>
      )}
      {shown.map((activity) => (
        <div
          key={activity.name}
          className="flex items-center justify-between gap-6 rounded-xl border border-black/[.08] bg-white px-5 py-3 dark:border-white/[.145] dark:bg-zinc-900"
        >
          <div className="min-w-0">
            <p className="font-medium text-zinc-800 dark:text-zinc-100">
              {activity.name}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {activity.description}
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              {VIBES.map((v) => `${v.name} ${activity[v.key]}`).join(" · ")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {activity.hours}h · €{activity.cost}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {openingHoursFor(activity, day)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
