"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DEFAULT_EDITS } from "@/app/components/ActivityCombinations/core/filterStore.data";
import { useFilterEdits } from "@/app/components/ActivityCombinations/core/filterStore.functions";
import { FilterCard } from "./FilterCard";
import { makeEditorActions } from "./useEditorActions";

export default function FiltersEditor() {
  // Reads from + writes to the shared store (auto-persisted to localStorage).
  const [edits, setEdits] = useFilterEdits();
  const actions = useMemo(() => makeEditorActions(setEdits), [setEdits]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
          Edit filters
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEdits(DEFAULT_EDITS)}
            className="rounded-lg border border-black/[.08] px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Reset to defaults
          </button>
          <Link
            href="/"
            className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Done
          </Link>
        </div>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Changes save automatically and apply to the ranking on the results page.
      </p>

      {edits.map((filter, fi) => (
        <FilterCard key={fi} filter={filter} filterIndex={fi} actions={actions} />
      ))}
    </div>
  );
}
