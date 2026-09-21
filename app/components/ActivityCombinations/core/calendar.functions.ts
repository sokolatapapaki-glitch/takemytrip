// -----------------------------------------------------------------------------
// Small date helpers for the day-picker calendar
// -----------------------------------------------------------------------------
// The planner only cares about each chosen date's WEEKDAY (for opening hours),
// so these convert/compare calendar dates and map them onto the app's weekday
// index (Monday = 0 … Sunday = 6, matching DAYS in activities.data).

// Midnight (local) of the given date — strips the time so day math is exact.
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// The date `n` days after `d` (n may be negative).
export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

// Whole days from `a` to `b` (b − a). Negative if b is before a.
export function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

// Same calendar day?
export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Weekday as Monday = 0 … Sunday = 6 (JS getDay() is Sunday = 0).
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}
