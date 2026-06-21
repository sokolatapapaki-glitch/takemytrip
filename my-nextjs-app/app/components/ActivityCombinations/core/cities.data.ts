// -----------------------------------------------------------------------------
// Cities (the planner's view of the shared destinations + their activities)
// -----------------------------------------------------------------------------
// Joins the shared destination list (./destinations.data → data/destinations.data)
// with each destination's activity catalogue. Rome and Paris use the hand-curated
// catalogues in data/activities.data.ts; the other 13 cities use the catalogues
// generated from takemytrip JSON in data/activities/<city>.data.ts (aggregated by
// data/activities/index.ts — see scripts/gen-activities.mjs). Any destination not
// found in either is scaffolded with an empty list.
//
// To regenerate the JSON-derived catalogues: `node scripts/gen-activities.mjs`.
// Curated Rome/Paris are listed explicitly below so they win over any generated
// entry of the same id.
import type { Activity } from "./activities.functions";
import { ROME_ACTIVITIES, PARIS_ACTIVITIES } from "../../../../data/activities.data";
import { GENERATED_ACTIVITIES_BY_DESTINATION } from "../../../../data/activities/index";
import { DESTINATIONS, type Destination, type DestArea, type CityPass } from "./destinations.data";

// A selectable start anchor (re-exported under the planner's historical name).
export type Area = DestArea;

// A "magic combo" (#10): a set of activities that, bought TOGETHER, cost less than
// buying each separately. `activityNames` are matched against the catalogue by name
// (names are unique); `discountPercent` is applied to the sum of those activities'
// party prices to show an indicative bundle price. INDICATIVE data — the UI labels
// it as such; swap in real provider offers when available.
export type MagicCombo = {
  name: string;
  activityNames: string[];
  discountPercent: number;
  description: string;
};

// A planner destination = the shared metadata + its activity catalogue + any
// indicative magic combos for it.
export type City = Destination & {
  activities: Activity[];
  magicCombos?: MagicCombo[];
};

// --- Indicative savings data (#10) ------------------------------------------
// City passes and magic combos for the curated cities. These are EXAMPLES so the
// "save money" suggestions the user missed are back; the UI clearly marks them as
// indicative. Keyed by destination id; merged into CITIES below.
const CITY_PASSES: Record<string, CityPass> = {
  rome: {
    name: "Roma Pass",
    description:
      "Δωρεάν είσοδος σε 1–2 μουσεία/αρχαιολογικούς χώρους, εκπτώσεις στα υπόλοιπα και δωρεάν ΜΜΜ.",
    discountPercent: 15,
    url: "https://www.romapass.it/",
  },
  paris: {
    name: "Paris Museum Pass",
    description:
      "Είσοδος χωρίς ουρά σε δεκάδες μουσεία & μνημεία του Παρισιού με μία κάρτα.",
    discountPercent: 15,
    url: "https://www.parismuseumpass.fr/",
  },
};

const CITY_MAGIC_COMBOS: Record<string, MagicCombo[]> = {
  rome: [
    {
      name: "Αρχαία Ρώμη",
      activityNames: ["Κολοσσαίο & Ρωμαϊκή Αγορά", "Castel Sant'Angelo"],
      discountPercent: 12,
      description: "Συνδυαστικό εισιτήριο για τα δύο εμβληματικά μνημεία.",
    },
    {
      name: "Τέχνη & Βατικανό",
      activityNames: ["Μουσεία Βατικανού και Καπέλα Σιστίνα", "Galleria Borghese"],
      discountPercent: 10,
      description: "Πακέτο για τις δύο μεγάλες πινακοθήκες/συλλογές.",
    },
  ],
  paris: [
    {
      name: "Μουσεία του Παρισιού",
      activityNames: ["Louvre Museum", "Musée d'Orsay"],
      discountPercent: 12,
      description: "Συνδυαστικό για Λούβρο και Μουσείο ντ' Ορσέ.",
    },
  ],
};

// Activity catalogues by destination id: the generated catalogues for the 13
// JSON-derived cities, with curated Rome/Paris layered on top. Destinations not
// present in either are scaffolded (empty) — selectable, with working area
// anchors, but no combos yet.
const ACTIVITIES_BY_DESTINATION: Record<string, Activity[]> = {
  ...GENERATED_ACTIVITIES_BY_DESTINATION,
  rome: ROME_ACTIVITIES,
  paris: PARIS_ACTIVITIES,
};

// The planner's destinations: the shared list, each with its activity catalogue
// and any indicative city pass / magic combos.
export const CITIES: City[] = DESTINATIONS.map((d) => ({
  ...d,
  cityPass: CITY_PASSES[d.id] ?? d.cityPass,
  magicCombos: CITY_MAGIC_COMBOS[d.id],
  activities: ACTIVITIES_BY_DESTINATION[d.id] ?? [],
}));

export const ROME: City = CITIES.find((c) => c.id === "rome")!;
export const PARIS: City = CITIES.find((c) => c.id === "paris")!;
export const DEFAULT_CITY: City = ROME;

// Every activity across all destinations — for name→coords / name→activity
// lookups (names are unique, so a single flat map is city-agnostic).
export const ALL_ACTIVITIES: Activity[] = CITIES.flatMap((c) => c.activities);
