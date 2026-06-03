"use client";

import { useState } from "react";
import { diffDays, mondayIndex, sameDay, startOfDay } from "./core/calendar.functions";

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// A booking.com-style month calendar that picks a DATE RANGE: first click sets
// the start, second click sets the end. Clicking again starts a new range.
// `end` is null while only the start is chosen. Days beyond `maxDays` from a
// pending start (and days before `minDate`) are disabled.
export function Calendar({
  start,
  end,
  onChange,
  maxDays,
  minDate,
}: {
  start: Date;
  end: Date | null;
  onChange: (start: Date, end: Date | null) => void;
  maxDays: number;
  minDate?: Date;
}) {
  const [view, setView] = useState(
    () => new Date(start.getFullYear(), start.getMonth(), 1)
  );
  const min = minDate ? startOfDay(minDate) : null;
  const rangeEnd = end ?? start;

  const firstOfMonth = new Date(view.getFullYear(), view.getMonth(), 1);
  const lead = mondayIndex(firstOfMonth); // empty cells before day 1
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  const inRange = (d: Date) => diffDays(start, d) >= 0 && diffDays(d, rangeEnd) >= 0;
  const isEdge = (d: Date) => sameDay(d, start) || sameDay(d, rangeEnd);

  const disabled = (d: Date) => {
    if (min && diffDays(min, d) < 0) return true; // before the earliest allowed
    // While choosing the end, gray out days that would exceed the max length.
    if (end === null && diffDays(start, d) > 0 && diffDays(start, d) + 1 > maxDays)
      return true;
    return false;
  };

  const click = (d: Date) => {
    if (disabled(d)) return;
    if (end !== null) {
      onChange(d, null); // a complete range exists → begin a new one
    } else if (diffDays(start, d) < 0) {
      onChange(d, null); // clicked before the start → restart there
    } else {
      onChange(start, d); // valid end (max length enforced by `disabled`)
    }
  };

  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++)
    cells.push(new Date(view.getFullYear(), view.getMonth(), day));

  const navClass =
    "rounded px-2 py-1 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <div className="rounded-lg border border-black/[.08] p-2 dark:border-white/[.145]">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          className={navClass}
        >
          ‹
        </button>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          className={navClass}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w} className="py-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`blank-${i}`} />;
          const off = disabled(d);
          const edge = isEdge(d);
          const sel = inRange(d);
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={off}
              onClick={() => click(d)}
              className={[
                "h-8 rounded text-xs transition-colors",
                off
                  ? "cursor-not-allowed text-zinc-300 dark:text-zinc-600"
                  : edge
                    ? "bg-blue-600 font-semibold text-white dark:bg-blue-500"
                    : sel
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
