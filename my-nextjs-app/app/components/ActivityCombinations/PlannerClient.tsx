"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

// A layout-stable loading state for the planner: it reserves the SAME container,
// sidebar and content widths the real planner uses, so nothing shifts when the
// interactive page swaps in. Greek copy + soft pulsing skeletons.
function PlanLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-8 sm:py-8">
      {/* Heading + spinner */}
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span
          className="h-9 w-9 animate-spin rounded-full border-[3px] border-orange-200 border-t-orange-500"
          aria-hidden
        />
        <div>
          <p className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
            Φτιάχνουμε το ιδανικό σου ταξίδι…
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Συνδυάζουμε δραστηριότητες, ωράρια και αποστάσεις για κάθε ημέρα.
          </p>
        </div>
      </div>

      {/* Skeleton: sidebar + trip cards, mirroring the planner grid. */}
      <div className="lg:flex lg:items-start lg:gap-8">
        <div className="hidden lg:block lg:w-72 lg:shrink-0">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/80 bg-white/70 p-5 shadow-xl shadow-orange-900/10">
            <div className="h-5 w-24 animate-pulse rounded bg-zinc-200/80" />
            <div className="h-9 w-full animate-pulse rounded-lg bg-zinc-200/70" />
            <div className="h-9 w-full animate-pulse rounded-lg bg-zinc-200/70" />
            <div className="h-32 w-full animate-pulse rounded-xl bg-zinc-200/60" />
            <div className="h-9 w-full animate-pulse rounded-lg bg-zinc-200/70" />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex gap-4 rounded-3xl border border-white/80 bg-white/70 p-4 shadow-xl shadow-orange-900/10"
            >
              <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-zinc-200/70" />
              <div className="flex min-w-0 flex-1 flex-col gap-3 py-1">
                <div className="h-3 w-20 animate-pulse rounded bg-zinc-200/80" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-200/70" />
                <div className="h-4 w-24 animate-pulse rounded bg-zinc-200/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// The planner is fully interactive and depends on client-only runtime values
// (today's date for the calendar, search timing). Rendering it on the server
// would (a) cause hydration mismatches and (b) run the multi-second trip search
// during SSR — so we load it CLIENT-ONLY via `ssr: false`. (`ssr: false` is only
// valid inside a Client Component, hence this wrapper.)
const ActivityCombinations = dynamic(() => import("./index"), {
  ssr: false,
  loading: () => <PlanLoading />,
});

export default function PlannerClient() {
  // Suspense boundary for the planner's useSearchParams (reads the /start hand-off).
  return (
    <Suspense fallback={<PlanLoading />}>
      <ActivityCombinations />
    </Suspense>
  );
}
