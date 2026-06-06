// -----------------------------------------------------------------------------
// Destinations data (standalone /start page)
// -----------------------------------------------------------------------------
// The concept is TRIPS, not just cities: a destination can be a single city
// (whose sub-selections are its areas/neighbourhoods, defaulting to the centre)
// or a whole region like Sicily (whose sub-selections are its cities). The FIRST
// entry in `areas` is always the default selection (a city's centre, or a
// region's main city).

export type Area = { id: string; name: string };

export type Destination = {
  id: string;
  name: string;
  country: string;
  kind: "city" | "region";
  // What the sub-selections represent, shown as the flyout heading.
  subLabel: "Areas" | "Cities";
  // Selectable sub-destinations; areas[0] is the default (centre / main city).
  areas: Area[];
};

const area = (name: string): Area => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name });

export const DESTINATIONS: Destination[] = [
  {
    id: "rome",
    name: "Rome",
    country: "Italy",
    kind: "city",
    subLabel: "Areas",
    areas: ["Centre", "Trastevere", "Vatican", "Monti", "Testaccio"].map(area),
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    kind: "city",
    subLabel: "Areas",
    areas: ["Centre", "Montmartre", "Le Marais", "Latin Quarter", "Champs-Élysées"].map(area),
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    kind: "city",
    subLabel: "Areas",
    areas: ["Centre", "Gothic Quarter", "Eixample", "Gràcia", "Barceloneta"].map(area),
  },
  {
    id: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    kind: "city",
    subLabel: "Areas",
    areas: ["Centre", "Jordaan", "De Pijp", "Oud-West"].map(area),
  },
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    kind: "city",
    subLabel: "Areas",
    areas: ["Centre", "Soho", "Camden", "Notting Hill", "Shoreditch"].map(area),
  },
  {
    id: "sicily",
    name: "Sicily",
    country: "Italy",
    kind: "region",
    subLabel: "Cities",
    areas: ["Palermo", "Catania", "Taormina", "Syracuse", "Agrigento"].map(area),
  },
  {
    id: "tuscany",
    name: "Tuscany",
    country: "Italy",
    kind: "region",
    subLabel: "Cities",
    areas: ["Florence", "Siena", "Pisa", "Lucca", "San Gimignano"].map(area),
  },
  {
    id: "andalusia",
    name: "Andalusia",
    country: "Spain",
    kind: "region",
    subLabel: "Cities",
    areas: ["Seville", "Granada", "Málaga", "Córdoba"].map(area),
  },
  {
    id: "amalfi-coast",
    name: "Amalfi Coast",
    country: "Italy",
    kind: "region",
    subLabel: "Cities",
    areas: ["Amalfi", "Positano", "Sorrento", "Ravello"].map(area),
  },
];
