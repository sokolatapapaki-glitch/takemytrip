"use client";

import { useEffect, useState } from "react";
import { ActivityCard } from "@/app/activities/components/ActivityCard";
import type { Activity } from "./core/activities.functions";

// How many activity cards to show before the "See more" toggle reveals the rest.
const COLLAPSED_COUNT = 3;

// The catalogue of available activities for the selected city, optionally
// filtered by a free-text `query` (matches name or description). Shown as a grid
// of ActivityCard tiles — the same card used on the Activities page, including
// its top-left select checkbox (inert here for now). Only the first
// COLLAPSED_COUNT cards are shown until "See more" is clicked. The section
// heading lives in the parent (next to the "Select activities" toggle).
export function ActivityList({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  day,
  activities,
  query = "",
}: {
  day: number;
  activities: Activity[];
  query?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  // Collapse back to the first few whenever the search query changes, so a new
  // search always starts collapsed.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpanded(false);
  }, [query]);

  const q = query.trim().toLowerCase();
  const shown = q
    ? activities.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      )
    : activities;

  const visible = expanded ? shown : shown.slice(0, COLLAPSED_COUNT);
  const hiddenCount = shown.length - visible.length;

  return (
    <div className="flex flex-col gap-4">
      {shown.length === 0 && (
        <p className="rounded-xl border border-black/[.08] px-5 py-3 text-sm text-zinc-400 dark:border-white/[.145] dark:text-zinc-500">
          No activities match &quot;{query}&quot;.
        </p>
      )}

      {visible.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((activity, i) => (
            <ActivityCard key={activity.name} activity={activity} index={i} />
          ))}
        </div>
      )}

      {shown.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mx-auto text-sm font-medium text-orange-600 underline-offset-2 transition-colors hover:underline dark:text-orange-400"
        >
          {expanded ? "See less" : `See more (${hiddenCount})`}
        </button>
      )}
    </div>
  );
}
