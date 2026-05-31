import type { ReactNode } from "react";
import Link from "next/link";
import { Filter, Selection } from "./filters";

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
        active
          ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-300"
          : "border-black/[.08] text-zinc-700 hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

// Filter sidebar — rendered straight from the (possibly edited) filters.
export function FilterSidebar({
  filters,
  selection,
  onChoose,
}: {
  filters: Filter[];
  selection: Selection;
  onChoose: (filterIndex: number, optionIndex: number) => void;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 lg:sticky lg:top-8 lg:w-64 lg:self-start">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          Filters
        </h2>
        <Link
          href="/filters"
          className="rounded-lg border border-black/[.08] px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Edit filters
        </Link>
      </div>

      {filters.map((filter, fi) => (
        <div key={filter.name} className="flex flex-col gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {filter.name}
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {filter.hint ?? (filter.multi ? "Pick any" : "Pick one")}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {filter.options.map((opt, i) => (
              <FilterButton
                key={opt.name}
                active={(selection[fi] ?? []).includes(i)}
                onClick={() => onChoose(fi, i)}
              >
                {opt.name}
              </FilterButton>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
