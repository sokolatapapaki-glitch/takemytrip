// App-wide UI feature flags (toggle by hand).
//
// SINGLE_ACTIVITY_IMAGE:
//   true  → the activity modal shows ONLY ONE image per activity, and the
//           thumbnail tabs below the image are hidden.
//   false → the activity modal keeps its full gallery (multiple images +
//           thumbnail tabs) — the current behaviour.
export const SINGLE_ACTIVITY_IMAGE = true;

// SHOW_ACTIVITY_STARS:
//   true  → the star rating shows in the activity cards and the activity modal,
//           exactly like now.
//   false → the star rating is hidden everywhere. In addition, on MOBILE the
//           horizontal activity cards also hide the price and show the activity
//           description in its place.
export const SHOW_ACTIVITY_STARS = false;

// HIDE_ACTIVITY_PRICES:
//   true  → prices are hidden everywhere (cards, modal, map panels, trip card,
//           PDF), and cost is dropped from the filters/sorting (the plan-page
//           "Κόστος" filter, the price slider, and the price sort option), so
//           cost is not accounted for at all.
//   false → prices and the cost filter behave like now.
export const HIDE_ACTIVITY_PRICES = true;

// SHOW_ACTIVITY_FILTERS:
//   Controls the city Activities page ONLY, and is independent of
//   SHOW_ACTIVITY_STARS.
//   true  → the left filter sidebar and the "Ταξινόμηση" (sort) button show,
//           exactly like now.
//   false → both are hidden (kept in the code, just not rendered): no inline
//           sidebar, no sort chip/button, and no mobile "Φίλτρα" drawer button.
export const SHOW_ACTIVITY_FILTERS = false;
