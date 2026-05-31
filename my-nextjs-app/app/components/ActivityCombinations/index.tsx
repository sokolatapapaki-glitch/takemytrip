"use client";

import { useMemo, useState } from "react";
import { ACTIVITIES } from "./activities";
import { buildCombinations, defaultSelection, Selection } from "./filters";
import { toEffective, useFilterEdits } from "./filterStore";
import { FilterSidebar } from "./FilterSidebar";
import { ActivityList } from "./ActivityList";
import { ComboResults } from "./ComboResults";

export default function ActivityCombinations() {
  const [edits] = useFilterEdits();
  const filters = useMemo(() => toEffective(edits), [edits]);

  // The filter set never changes shape (only field values), so the selection
  // keys stay valid. Stale option indexes after an edit are simply ignored by
  // comboScore, so no reset is needed.
  const [selection, setSelection] = useState<Selection>(() =>
    defaultSelection(filters)
  );

  const combinations = useMemo(
    () => buildCombinations(ACTIVITIES, selection, filters),
    [selection, filters]
  );

  const choose = (filterIndex: number, optionIndex: number) =>
    setSelection((prev) => {
      const current = prev[filterIndex] ?? [];
      if (filters[filterIndex]?.multi) {
        const next = current.includes(optionIndex)
          ? current.filter((i) => i !== optionIndex)
          : [...current, optionIndex];
        return { ...prev, [filterIndex]: next };
      }
      return { ...prev, [filterIndex]: [optionIndex] };
    });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-8 lg:flex-row">
      <FilterSidebar filters={filters} selection={selection} onChoose={choose} />
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <ActivityList />
        <ComboResults
          filters={filters}
          combinations={combinations}
          selection={selection}
        />
      </div>
    </div>
  );
}
