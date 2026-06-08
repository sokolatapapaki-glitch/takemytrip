// -----------------------------------------------------------------------------
// Destinations (DATA ONLY)
// -----------------------------------------------------------------------------
// The selectable cities/regions + their areas (with coords) — the single shared
// list behind BOTH the /start trip-search input and the main planner. Types live
// in app/components/ActivityCombinations/core/destinations.data; the small
// `A`/`dest` builders only assemble these literals, so they stay with the data
// they build. core/destinations.data.ts re-exports DESTINATIONS so every existing
// import keeps working.
// Self-contained: this file imports NOTHING so it never participates in the
// planner's type/value module graph. The shared TYPES live in
// core/destinations.data.ts; the local aliases below mirror them structurally so
// the data is still type-checked here, and core re-exports DESTINATIONS as the
// canonical `Destination[]`.
type Coords = { lat: number; lng: number };
type DestArea = { id: string; name: string; coords: Coords };
type Destination = {
  id: string;
  name: string;
  country: string;
  kind: "city" | "region";
  subLabel: "Areas" | "Cities";
  center: Coords;
  areas: DestArea[];
};

// Build an area from a name + lat/lng (id is a kebab-cased slug of the name).
const A = (name: string, lat: number, lng: number): DestArea => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  name,
  coords: { lat, lng },
});

// Assemble a destination, deriving `center` from the first area.
function dest(
  id: string,
  name: string,
  country: string,
  kind: "city" | "region",
  areas: DestArea[]
): Destination {
  return {
    id,
    name,
    country,
    kind,
    subLabel: kind === "region" ? "Cities" : "Areas",
    center: areas[0].coords,
    areas,
  };
}

export const DESTINATIONS: Destination[] = [
  dest("rome", "Rome", "Italy", "city", [
    A("Centre", 41.8925, 12.4853),
    A("Trastevere", 41.8890, 12.4680),
    A("Vatican", 41.9039, 12.4549),
    A("Monti", 41.8946, 12.4920),
    A("Testaccio", 41.8730, 12.4760),
  ]),
  dest("paris", "Paris", "France", "city", [
    A("Centre", 48.8530, 2.3499),
    A("Montmartre", 48.8867, 2.3431),
    A("Le Marais", 48.8571, 2.3590),
    A("Latin Quarter", 48.8499, 2.3470),
    A("Champs-Élysées", 48.8698, 2.3078),
  ]),
  dest("barcelona", "Barcelona", "Spain", "city", [
    A("Centre", 41.3870, 2.1701),
    A("Gothic Quarter", 41.3833, 2.1777),
    A("Eixample", 41.3915, 2.1649),
    A("Gràcia", 41.4030, 2.1560),
    A("Barceloneta", 41.3797, 2.1894),
  ]),
  dest("amsterdam", "Amsterdam", "Netherlands", "city", [
    A("Centre", 52.3730, 4.8924),
    A("Jordaan", 52.3740, 4.8800),
    A("De Pijp", 52.3550, 4.8920),
    A("Oud-West", 52.3650, 4.8650),
  ]),
  dest("london", "London", "United Kingdom", "city", [
    A("Centre", 51.5074, -0.1278),
    A("Soho", 51.5137, -0.1340),
    A("Camden", 51.5390, -0.1426),
    A("Notting Hill", 51.5090, -0.1960),
    A("Shoreditch", 51.5265, -0.0780),
  ]),
  dest("sicily", "Sicily", "Italy", "region", [
    A("Palermo", 38.1157, 13.3615),
    A("Catania", 37.5079, 15.0830),
    A("Taormina", 37.8516, 15.2853),
    A("Syracuse", 37.0755, 15.2866),
    A("Agrigento", 37.3111, 13.5765),
  ]),
  dest("tuscany", "Tuscany", "Italy", "region", [
    A("Florence", 43.7696, 11.2558),
    A("Siena", 43.3188, 11.3308),
    A("Pisa", 43.7228, 10.4017),
    A("Lucca", 43.8430, 10.5076),
    A("San Gimignano", 43.4677, 11.0431),
  ]),
  dest("andalusia", "Andalusia", "Spain", "region", [
    A("Seville", 37.3891, -5.9845),
    A("Granada", 37.1773, -3.5986),
    A("Málaga", 36.7213, -4.4214),
    A("Córdoba", 37.8882, -4.7794),
  ]),
  dest("amalfi-coast", "Amalfi Coast", "Italy", "region", [
    A("Amalfi", 40.6340, 14.6027),
    A("Positano", 40.6280, 14.4850),
    A("Sorrento", 40.6263, 14.3757),
    A("Ravello", 40.6494, 14.6118),
  ]),
];
