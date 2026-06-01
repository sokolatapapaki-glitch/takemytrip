"use client";

import { useState } from "react";
import { DAYS } from "./core/activities.data";
import { openingHoursFor, type Activity } from "./core/activities.functions";
import type { ScheduledItem } from "./core/schedule.functions";

// One scheduled row's label: the activity name plus, for real activities, a
// toggle that reveals its opening hours for every day of the week (the trip's
// current day highlighted). Lunch slots carry no activity, so they show just
// the name with no button. Each row owns its own open state.
export function ScheduledName({
  item,
  activity,
  day,
}: {
  item: ScheduledItem;
  activity: Activity | undefined;
  day: number;
}) {
  const [open, setOpen] = useState(false);
  const nameClass = item.closed
    ? "text-zinc-400 line-through dark:text-zinc-500"
    : item.lunch
      ? "italic text-zinc-500 dark:text-zinc-400"
      : undefined;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={nameClass}>{item.name}</span>
        {activity ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            title="Opening hours by day"
            className="shrink-0 rounded border border-black/[.08] px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {open ? "Hours ▲" : "Hours ▼"}
          </button>
        ) : null}
      </div>
      {open && activity ? (
        <ul className="flex flex-col gap-0.5 rounded-lg border border-black/[.08] bg-zinc-50 p-2 text-xs dark:border-white/[.145] dark:bg-zinc-800/50">
          {DAYS.map((d, i) => (
            <li
              key={d}
              className={`flex justify-between gap-4 ${
                i === day
                  ? "font-medium text-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <span>{d}</span>
              <span className="font-mono">{openingHoursFor(activity, i)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
