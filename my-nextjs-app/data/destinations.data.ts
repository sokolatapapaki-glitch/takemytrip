// -----------------------------------------------------------------------------
// Destinations (DATA ONLY)
// -----------------------------------------------------------------------------
// The selectable cities + their areas (with coords) — the single shared list
// behind BOTH the /start trip-search input and the main planner. The city list +
// names/countries mirror the takemytrip dataset (Greek names as in the source).
// takemytrip has no neighbourhoods, so cities that already had hand-authored areas
// keep them; the rest get a single "Centre" at the city centre. Types live in
// core/destinations.data; the `A`/`dest` builders only assemble these literals, so
// they stay with the data they build. core/destinations.data.ts re-exports
// DESTINATIONS so every existing import keeps working.
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
  dest("amsterdam", "Άμστερνταμ", "Ολλανδία", "city", [
    A("Centre", 52.3730, 4.8924),
    A("Jordaan", 52.3740, 4.8800),
    A("De Pijp", 52.3550, 4.8920),
    A("Oud-West", 52.3650, 4.8650),
  ]),
  dest("barcelona", "Barcelona", "Spain", "city", [
    A("Centre", 41.3870, 2.1701),
    A("Gothic Quarter", 41.3833, 2.1777),
    A("Eixample", 41.3915, 2.1649),
    A("Gràcia", 41.4030, 2.1560),
    A("Barceloneta", 41.3797, 2.1894),
  ]),
  dest("berlin", "Βερολίνο", "Γερμανία", "city", [
    A("Centre", 52.5200, 13.4050),
  ]),
  dest("bucharest", "Βουκουρέστι", "Ρουμανία", "city", [
    A("Centre", 44.4268, 26.1025),
  ]),
  dest("budapest", "Βουδαπέστη", "Ουγγαρία", "city", [
    A("Centre", 47.4979, 19.0402),
  ]),
  dest("istanbul", "Κωνσταντινούπολη", "Τουρκία", "city", [
    A("Centre", 41.0086, 28.9802),
  ]),
  dest("krakow", "Krakow", "Poland", "city", [
    A("Centre", 50.0647, 19.9450),
  ]),
  dest("lisbon", "Λισαβόνα", "Πορτογαλία", "city", [
    A("Centre", 38.7223, -9.1393),
  ]),
  dest("london", "Λονδίνο", "Ηνωμένο Βασίλειο", "city", [
    A("Centre", 51.5074, -0.1278),
    A("Soho", 51.5137, -0.1340),
    A("Camden", 51.5390, -0.1426),
    A("Notting Hill", 51.5090, -0.1960),
    A("Shoreditch", 51.5265, -0.0780),
  ]),
  dest("madrid", "Μαδρίτη", "Ισπανία", "city", [
    A("Centre", 40.4168, -3.7038),
  ]),
  dest("paris", "Παρίσι", "Γαλλία", "city", [
    A("Centre", 48.8530, 2.3499),
    A("Montmartre", 48.8867, 2.3431),
    A("Le Marais", 48.8571, 2.3590),
    A("Latin Quarter", 48.8499, 2.3470),
    A("Champs-Élysées", 48.8698, 2.3078),
  ]),
  dest("prague", "Πράγα", "Τσεχία", "city", [
    A("Centre", 50.0875, 14.4213),
  ]),
  dest("rome", "Ρώμη", "Ιταλία", "city", [
    A("Centre", 41.8925, 12.4853),
    A("Trastevere", 41.8890, 12.4680),
    A("Vatican", 41.9039, 12.4549),
    A("Monti", 41.8946, 12.4920),
    A("Testaccio", 41.8730, 12.4760),
  ]),
  dest("vienna", "Βιέννη", "Αυστρία", "city", [
    A("Centre", 48.2082, 16.3738),
  ]),
  dest("warsaw", "Warsaw", "Poland", "city", [
    A("Centre", 52.2297, 21.0122),
  ]),
];
