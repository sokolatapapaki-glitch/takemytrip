// -----------------------------------------------------------------------------
// Shared selection types for the /start trip-search page
// -----------------------------------------------------------------------------

// Which destination + sub-area the user picked (ids reference DESTINATIONS).
export type DestinationSelection = {
  destinationId: string;
  areaId: string;
};

// The chosen trip dates. `start` is picked first; `end` stays null until the
// second click completes the range.
export type DateRange = {
  start: Date | null;
  end: Date | null;
};

// Who is travelling (rooms intentionally excluded — see Travelers modal note).
export type Travelers = {
  adults: number;
  children: number;
  // One entry per child; null until an age is chosen (each is required).
  childAges: (number | null)[];
};
