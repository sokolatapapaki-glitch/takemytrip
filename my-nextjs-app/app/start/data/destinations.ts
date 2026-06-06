// -----------------------------------------------------------------------------
// Destinations data (standalone /start page)
// -----------------------------------------------------------------------------
// Re-exported from the SINGLE shared source in the planner core, so the /start
// input and the main planner always offer the same cities/areas (now with
// coordinates). See core/destinations.data.ts for the data itself.
export type { Destination } from "../../components/ActivityCombinations/core/destinations.data";
export { DESTINATIONS } from "../../components/ActivityCombinations/core/destinations.data";

// Back-compat alias: the /start page historically called a sub-destination an
// `Area` (id + name). The shared `DestArea` adds coords, which the input ignores.
export type { DestArea as Area } from "../../components/ActivityCombinations/core/destinations.data";
