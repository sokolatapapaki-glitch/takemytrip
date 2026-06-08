"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

// The planner is fully interactive and depends on client-only runtime values
// (today's date for the calendar, search timing). Rendering it on the server
// would (a) cause hydration mismatches and (b) run the multi-second trip search
// during SSR — so we load it CLIENT-ONLY via `ssr: false`. (`ssr: false` is only
// valid inside a Client Component, hence this wrapper.)
const ActivityCombinations = dynamic(() => import("./index"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-sm text-zinc-500 dark:text-zinc-400">Loading planner…</div>
  ),
});

export default function PlannerClient() {
  // Suspense boundary for the planner's useSearchParams (reads the /start hand-off).
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-zinc-500 dark:text-zinc-400">Loading planner…</div>
      }
    >
      <ActivityCombinations />
    </Suspense>
  );
}
