// -----------------------------------------------------------------------------
// Small date helpers for the calendar (Monday-first, no external deps)
// -----------------------------------------------------------------------------

export const MONTHS = [
  "Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος",
  "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος",
];

export const MONTHS_SHORT = [
  "Ιαν", "Φεβ", "Μάρ", "Απρ", "Μάι", "Ιούν",
  "Ιούλ", "Αύγ", "Σεπ", "Οκτ", "Νοέ", "Δεκ",
];

// Monday-first weekday labels (matches the rest of the app's Monday indexing).
export const WEEKDAYS = ["Δε", "Τρ", "Τε", "Πέ", "Πα", "Σά", "Κυ"];

export function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// First day of the month `n` months away (day component dropped).
export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

// Next date (today inclusive) falling on the given day-of-week (0=Sun..6=Sat).
export function nextDow(from: Date, dow: number): Date {
  const diff = (dow - from.getDay() + 7) % 7;
  return addDays(from, diff);
}

export function monthLabel(view: Date): string {
  return `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
}

export function formatShort(d: Date): string {
  // Greek order: day before month ("7 Ιουν").
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

// The cells of a month grid: leading nulls pad to the Monday-first start, then
// one Date per day of the month.
export function monthGrid(view: Date): (Date | null)[] {
  const year = view.getFullYear();
  const month = view.getMonth();
  const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first offset
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}
