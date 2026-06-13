"use client";

import { useState } from "react";
import type { Activity } from "./core/activities.functions";
import { CheckRow } from "./CheckRow";
import { buttonStyles } from "@/app/components/ui/buttonStyles";

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
          Υποχρεωτικές δραστηριότητες
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Το ταξίδι σου θα τις περιλαμβάνει πάντα
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {shown.map((activity) => (
          <CheckRow
            key={activity.name}
            active={required.has(activity.name)}
            onClick={() => onToggle(activity.name)}
          >
            {activity.name}
          </CheckRow>
        ))}
      </div>
      {activities.length > COLLAPSED_COUNT ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={`self-start ${buttonStyles.underline}`}
        >
          {expanded ? "Δες λιγότερα" : `Δες περισσότερα (${hiddenCount})`}
        </button>
      ) : null}
    </div>
  );
}
