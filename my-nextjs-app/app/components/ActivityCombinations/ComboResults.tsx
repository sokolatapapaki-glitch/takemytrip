import type { Activity } from "./activities";
import { Filter, Selection, comboScore, optionValue } from "./filters";

// Per-filter readout for one combo: the selected options and their values.
function filterSummary(
  filter: Filter,
  filterIndex: number,
  combo: Activity[],
  selection: Selection
): string {
  const picked = selection[filterIndex] ?? [];
  if (picked.length === 0) return `${filter.name}: any`;

  const parts = picked.map((i) => {
    const option = filter.options[i];
    if (!option) return "";
    if (filter.multi) {
      return `${option.name} ${optionValue(filter, option)(combo).toFixed(1)}`;
    }
    // Single-select: prefer the real-world label (e.g. "12h", "€80").
    return filter.format
      ? filter.format(combo)
      : optionValue(filter, option)(combo).toFixed(1);
  });

  return `${filter.name}: ${parts.filter(Boolean).join(", ")}`;
}

// The ranked list of activity combinations for the current filter selection.
export function ComboResults({
  filters,
  combinations,
  selection,
}: {
  filters: Filter[];
  combinations: Activity[][];
  selection: Selection;
}) {
  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
        Combinations ({combinations.length})
      </h2>
      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
        Ranked for your filters:{" "}
        {filters
          .map((f, fi) => {
            const picked = selection[fi] ?? [];
            const names = picked.length
              ? picked.map((i) => f.options[i]?.name).filter(Boolean).join(" / ")
              : "any";
            return `${f.name} — ${names}`;
          })
          .join(" · ")}
        .
      </p>
      <div className="flex flex-col gap-2">
        {combinations.map((combo, index) => {
          const score = comboScore(combo, selection, filters);
          return (
            <div
              key={index}
              className="rounded-xl border border-black/[.08] bg-white px-5 py-3 dark:border-white/[.145] dark:bg-zinc-900"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-zinc-400 dark:text-zinc-500">
                  {filters
                    .map((f, fi) => filterSummary(f, fi, combo, selection))
                    .join(" · ")}
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  score {score.toFixed(2)}
                </span>
              </div>
              <p className="text-zinc-800 dark:text-zinc-100">
                {combo.map((a) => a.name).join(" + ")}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
