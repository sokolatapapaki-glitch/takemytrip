"use client";

import { useState } from "react";
import { DAYS } from "./core/activities.data";
import { openingHoursFor, type Activity } from "./core/activities.functions";
import type { ScheduledItem } from "./core/schedule.functions";
import { buttonStyles } from "@/app/components/ui/buttonStyles";

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
    <div className="relative flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={nameClass}>{item.name}</span>
        {activity ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            title="Opening hours by day"
            className={`shrink-0 ${buttonStyles.underline}`}
          >
            {open ? "Hours ▲" : "Hours ▼"}
          </button>
        ) : null}
      </div>
      {open && activity ? (
        <ul className="absolute left-0 top-full z-30 mt-1 flex min-w-[12rem] flex-col gap-0.5 whitespace-nowrap rounded-lg border border-black/[.08] bg-white p-2 text-xs shadow-lg dark:border-white/[.145] dark:bg-zinc-900">
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
