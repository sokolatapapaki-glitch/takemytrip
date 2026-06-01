"use client";

import { useMemo, useState } from "react";
import { ACTIVITIES } from "./core/activities.data";
import { buildCombinations, defaultSelection, Selection } from "./core/filters.functions";
import { scheduleCombo, scheduleEndHour } from "./core/schedule.functions";
import { toEffective, useFilterEdits } from "./core/filterStore.functions";
import { FilterSidebar } from "./FilterSidebar";
import { ActivityList } from "./ActivityList";
import { ComboResults } from "./ComboResults";
import { filterByRequired } from "./RequiredActivities";
import { DEFAULT_DAY, DEFAULT_START_HOUR } from "./core/schedule.data";

export default function ActivityCombinations() {
  const [edits] = useFilterEdits();
  const filters = useMemo(() => toEffective(edits), [edits]);

  // The filter set never changes shape (only field values), so the selection
  // keys stay valid. Stale option indexes after an edit are simply ignored by
  // comboScore, so no reset is needed.
  const [selection, setSelection] = useState<Selection>(() =>
    defaultSelection(filters)
  );

  // Hard "must include" filter: a set of activity names every shown combo must
  // contain. Independent of the scoring filters above.
  const [required, setRequired] = useState<Set<string>>(() => new Set());

  // The hour the day starts at (user-set in the sidebar). The itinerary of each
  // combo is laid out from here.
  const [startHour, setStartHour] = useState<number>(DEFAULT_START_HOUR);

  // The day of the week the trip is on (0=Mon..6=Sun). Picks each activity's
  // opening hours for that day.
  const [day, setDay] = useState<number>(DEFAULT_DAY);

  // Build + score, then apply the hard filters on top: drop any combo that
  // can't be scheduled without an activity falling outside its opening window
  // (closed all day, or pushed past its closing time), then keep only those
  // with the required activities. Combos that merely run past the day budget
  // stay (shown with the amber "doesn't fit" note).
  const combinations = useMemo(() => {
    const scored = buildCombinations(ACTIVITIES, selection, filters);
    const endHour = scheduleEndHour(filters, selection, startHour);
    const open = scored.filter(
      (combo) => scheduleCombo(combo, day, startHour, endHour).withinHours
    );
    return filterByRequired(open, required);
  }, [selection, filters, required, day, startHour]);

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

  const toggleRequired = (name: string) =>
    setRequired((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-8 lg:flex-row">
      <FilterSidebar
        filters={filters}
        selection={selection}
        onChoose={choose}
        required={required}
        onToggleRequired={toggleRequired}
        startHour={startHour}
        onStartHourChange={setStartHour}
        day={day}
        onDayChange={setDay}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <ActivityList day={day} />
        <ComboResults
          filters={filters}
          combinations={combinations}
          selection={selection}
          startHour={startHour}
          day={day}
        />
      </div>
    </div>
  );
}
