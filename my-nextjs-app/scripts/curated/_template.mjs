// -----------------------------------------------------------------------------
// TEMPLATE — copy this to scripts/curated/<city>.mjs and fill it in, then run:
//   node scripts/gen-city-images.mjs --city=<city>
// (<city> is the destination id, e.g. "rome", "paris", "krakow" — it must match a
//  folder name under public/destinations/ and a data file in data/activities/.)
// -----------------------------------------------------------------------------
// HOW TO CURATE ONE ACTIVITY:
//   1. Find a good, accurate, FREE photo of the place. Two legal sources:
//
//      A) Unsplash  (easiest, no attribution legally required)
//         - Open the photo on unsplash.com. The URL is like
//           https://unsplash.com/photos/a-castle-on-a-hill-EUed6ZoHYfg
//           → the id is the last chunk after the final "-":  EUed6ZoHYfg
//         - Use:  { source: "unsplash", id: "EUed6ZoHYfg" }
//
//      B) Wikimedia Commons  (use when Unsplash has nothing accurate; e.g.
//         museums or branded attractions — attribution is required but handled
//         for you automatically)
//         - Open the file page, copy the title after "File:" exactly, e.g.
//           "Casa Batlló 01.jpg"
//         - Always add a `query` fallback search in case the title was renamed.
//         - Use:  { source: "commons", file: "Casa Batlló 01.jpg",
//                   query: "Casa Batlló Barcelona dragon roof" }
//
//   2. `name` MUST exactly match the activity name key used in the app's
//      generated image map (the same string shown in the manifest). Copy it
//      verbatim, accents and all.
//
//   3. `folder` is where the image is saved: public/destinations/<city>/<folder>/1.jpg
//      Use "<id>-<slug>" matching the activity (see the barcelona.mjs example /
//      the folders the auto-fetcher already created under your city).
//
//   4. Optional `note`: a sentence explaining any compromise (e.g. "no free photo
//      of the venue exists; a representative image is used"). It is written into
//      the credits file.
// -----------------------------------------------------------------------------
export const cityName = "City Name";

export const activities = [
  // { folder: "1-example-landmark", name: "Example Landmark",
  //   source: "unsplash", id: "PHOTO_ID" },
  // { folder: "2-example-museum", name: "Example Museum",
  //   source: "commons", file: "Example Museum 01.jpg",
  //   query: "Example Museum City exterior facade" },
];
