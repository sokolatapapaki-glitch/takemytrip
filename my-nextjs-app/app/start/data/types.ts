// -----------------------------------------------------------------------------
// Shared selection types for the /start trip-search page
// -----------------------------------------------------------------------------

// A map point (WGS84) for the chosen personal start point.
export type Coords = { lat: number; lng: number };

// Which destination the user picked, plus their personal START POINT within it
// (an address / hotel searched in the destination modal, or the city centre by
// default). `pointName` is the label shown; `coords` is the route anchor handed
// to the planner.
export type DestinationSelection = {
  destinationId: string;
  pointName: string;
  coords: Coords;
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
