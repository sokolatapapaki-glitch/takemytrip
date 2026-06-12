"use client";

// A simple, single-month range calendar. First click sets the start; hovering
// after that previews the range (connected band); the second click sets the end
// and closes. A "No dates decided yet?" button reveals quick trip-length presets
// that fill in example dates.

import { useState } from "react";
import type { DateRange } from "../data/types";
import {
  WEEKDAYS,
  addDays,
  addMonths,
  isSameDay,
  monthGrid,
  monthLabel,
  nextDow,
  startOfToday,
} from "../data/dateUtils";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

const PRESETS: { label: string; days: number }[] = [
  { label: "Σαββατοκύριακο", days: 2 },
  { label: "1 ημέρα", days: 1 },
  { label: "2 ημέρες", days: 2 },
  { label: "3 ημέρες", days: 3 },
  { label: "4 ημέρες", days: 4 },
  { label: "5 ημέρες", days: 5 },
];

export function CalendarModal({
  value,
  onChange,
  onClose,
  editing,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
  onClose?: () => void;
  // Which endpoint this picker edits (the mobile split From/To fields). When
  // set, a single tap updates THAT endpoint and closes — tapping "To" with a
  // full range no longer resets the start. Omitted (desktop): the classic
  // two-click range flow below.
  editing?: "start" | "end";
}) {
  const today = startOfToday();
  const [view, setView] = useState<Date>(() => value.start ?? today);
  const [hover, setHover] = useState<Date | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const { start, end } = value;
  // While only the start is set, the hovered day acts as the provisional end so
  // the band previews the range under the cursor.
  const previewEnd = start && !end ? hover : end;
  const lo = start && previewEnd ? (previewEnd < start ? previewEnd : start) : null;
  const hi = start && previewEnd ? (previewEnd < start ? start : previewEnd) : null;

  function pick(day: Date) {
    if (editing === "start") {
      // Keep the end only if it still comes after the new start.
      onChange({ start: day, end: end && end >= day ? end : null });
      onClose?.();
      return;
    }
    if (editing === "end") {
      // No start yet → the tap sets it (an end alone isn't a range).
      if (!start) onChange({ start: day, end: null });
      else if (day < start) onChange({ start: day, end: start });
      else onChange({ start, end: day });
      onClose?.();
      return;
    }
    if (!start || (start && end)) {
      onChange({ start: day, end: null });
      return;
    }
    // start set, end not yet — this click completes the range.
    if (day < start) onChange({ start: day, end: start });
    else onChange({ start, end: day });
    onClose?.();
  }

  function applyPreset(days: number) {
    const sat = nextDow(today, 6); // upcoming Saturday — example dates
    const startDay = sat;
    const endDay = days === 1 ? sat : addDays(sat, days - 1);
    onChange({ start: startDay, end: endDay });
    setView(startDay);
    onClose?.();
  }

  return (
    <div className="w-full h-full p-3 sm:w-80">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Προηγούμενος μήνας"
          onClick={() => setView(addMonths(view, -1))}
          className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
        >
          <FaChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-base font-semibold text-zinc-800 sm:text-sm">{monthLabel(view)}</span>
        <button
          type="button"
          aria-label="Επόμενος μήνας"
          onClick={() => setView(addMonths(view, 1))}
          className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
        >
          <FaChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-zinc-400">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7" onMouseLeave={() => setHover(null)}>
        {monthGrid(view).map((day, idx) => {
          if (!day) return <div key={idx} />;
          const past = day < today;
          const inBand = !!lo && !!hi && !isSameDay(lo, hi) && day >= lo && day <= hi;
          const isSelected =
            (!!start && isSameDay(day, start)) || (!!end && isSameDay(day, end));
          const isPreviewEnd = !!start && !end && !!hover && isSameDay(day, hover);
          return (
            <div
              key={idx}
              className={`flex justify-center ${inBand ? "bg-orange-100/70" : ""} ${
                inBand && !!lo && isSameDay(day, lo) ? "rounded-l-full" : ""
              } ${inBand && !!hi && isSameDay(day, hi) ? "rounded-r-full" : ""}`}
            >
              <button
                type="button"
                disabled={past}
                onMouseEnter={() => !past && setHover(day)}
                onClick={() => !past && pick(day)}
                className={`my-0.5 flex h-11 w-11 items-center justify-center rounded-full text-base transition-colors sm:h-9 sm:w-9 sm:text-sm ${
                  past ? "cursor-default text-zinc-300" : "text-zinc-700"
                } ${
                  isSelected
                    ? "bg-orange-500 font-semibold text-white"
                    : isPreviewEnd
                      ? "bg-orange-200 text-orange-900"
                      : !past
                        ? "hover:bg-orange-200"
                        : ""
                }`}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 border-t border-black/5 pt-3">
        <button
          type="button"
          onClick={() => setShowPresets((s) => !s)}
          className="text-sm font-medium text-orange-600 transition-colors hover:text-orange-700"
        >
          Δεν έχεις αποφασίσει ημερομηνίες;
        </button>
        {showPresets && (
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p.days)}
                className="rounded-full border border-orange-200 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-700 transition-colors hover:border-orange-400 hover:bg-orange-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
