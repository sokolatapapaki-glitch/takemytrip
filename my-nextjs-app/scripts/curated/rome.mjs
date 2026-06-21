// -----------------------------------------------------------------------------
// Curated, accurate, fully-legal images for ROME activities.
// -----------------------------------------------------------------------------
// Data only — machinery lives in scripts/gen-city-images.mjs.
//   Whole city:  node scripts/gen-city-images.mjs --city=rome
//   A few only:  node scripts/gen-city-images.mjs --city=rome --only=18-castel-sant-angelo
//
// `name` must match the catalogue name from `node scripts/list-activities.mjs --city=rome`.
// `folder` must match that list's folder slug. See scripts/curated/_template.mjs.
// -----------------------------------------------------------------------------
export const cityName = "Rome";

// NOTE: this is a PARTIAL seed (3 activities, added as a skill test). Until the
// rest of Rome is curated here, run it ONLY in partial mode
// (`--only=<folder>`). A bare `--city=rome` (whole-city) run would wipe the other
// activities' images and drop them from the manifest — finish the list first.
export const activities = [
  { folder: "18-castel-sant-angelo", name: "Castel Sant'Angelo",
    source: "commons", file: "Castel Sant'Angelo, Rome - panoramio.jpg",
    query: "Castel Sant'Angelo Rome exterior fortress Tiber" },
  { folder: "11-villa-borghese", name: "Villa Borghese",
    source: "commons", file: "Laghetto and Tempio di Esculapio in Villa Borghese 02.jpg",
    query: "Villa Borghese Rome lake Temple of Aesculapius park" },
  { folder: "13-galleria-borghese", name: "Galleria Borghese",
    source: "commons", file: "Galleria borghese facade.jpg",
    query: "Galleria Borghese Rome museum facade building" },
];
