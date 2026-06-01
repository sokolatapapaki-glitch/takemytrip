import { ACTIVITIES, DAYS, VIBES } from "./core/activities.data";
import { openingHoursFor } from "./core/activities.functions";

// The catalogue of available activities. Opening hours are shown for the
// currently selected day.
export function ActivityList({ day }: { day: number }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
        Activities <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">· hours for {DAYS[day]}</span>
      </h2>
      <div className="flex flex-col gap-2">
        {ACTIVITIES.map((activity) => (
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
    </section>
  );
}
