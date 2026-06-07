"use client";

import { useState } from "react";
import type { Activity } from "./core/activities.functions";

// How many "Must include" options to show before the "See more" toggle reveals
// the rest. Keeps the list short by default in both the sidebar and the modal.
const COLLAPSED_COUNT = 5;

// A HARD filter (distinct from the scoring filters): keep only combinations that
// contain every selected activity. Selection is a set of activity names.
export function filterByRequired(
  combos: Activity[][],
  required: Set<string>
): Activity[][] {
  if (required.size === 0) return combos;
  return combos.filter((combo) => {
    const names = new Set(combo.map((a) => a.name));
    for (const name of required) {
      if (!names.has(name)) return false;
    }
    return true;
  });
}

// Sidebar section: multi-select list of activities to require. Selecting one
// narrows the results to combos that include it. Only the first COLLAPSED_COUNT
// are shown until "See more" is clicked.
export function RequiredActivities({
  activities,
  required,
  onToggle,
}: {
  activities: Activity[];
  required: Set<string>;
  onToggle: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? activities : activities.slice(0, COLLAPSED_COUNT);
  const hiddenCount = activities.length - shown.length;

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Must include
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Only show plans with these
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {shown.map((activity) => {
          const active = required.has(activity.name);
          return (
            <button
              key={activity.name}
              type="button"
              onClick={() => onToggle(activity.name)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? "border-amber-600 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-amber-950/50 dark:text-amber-300"
                  : "border-black/[.08] text-zinc-700 hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {activity.name}
            </button>
          );
        })}
      </div>
      {activities.length > COLLAPSED_COUNT ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="self-start text-xs font-medium text-orange-600 underline-offset-2 transition-colors hover:underline dark:text-orange-400"
        >
          {expanded ? "See less" : `See more (${hiddenCount})`}
        </button>
      ) : null}
    </div>
  );
}
