// -----------------------------------------------------------------------------
// Scheduling constants (the data)
// -----------------------------------------------------------------------------
// Defaults + the lunch-slot window. The scheduling logic lives in
// schedule.functions.
export const DEFAULT_START_HOUR = 10; // default: plans begin at 10:00
export const DEFAULT_DAY = 0; // default: Monday (index 0 in DAYS)

export const LUNCH_HOURS = 3; // length of the generic lunch break
export const LUNCH_OPEN = 13; // PREFERRED start of the lunch slot (1 PM)
export const LUNCH_CLOSE = 16; // HARD latest the lunch slot may start (4 PM)
// The lunch break is REQUIRED in every 2+ activity combo. It prefers the 13:00
// ideal but may slide a little earlier (down to LUNCH_EARLIEST) so it still
// fits; it may never start after LUNCH_CLOSE (4 PM).
export const LUNCH_EARLIEST = 11.5; // earliest a flexed lunch may start (11:30)
export const LUNCH_NAME = "Διάλειμμα για φαγητό";
