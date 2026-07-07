// -----------------------------------------------------------------------------
// Headless trip planner — runs the SAME filter/scoring/scheduling code the plan
// page uses, with the project's default filters, and prints the result as JSON.
// -----------------------------------------------------------------------------
// This is bundled by scripts/build-plan-engine.mjs into a single self-contained
// `plan-engine.cjs` (no node_modules needed) that the n8n container runs with
// plain node. Mirrors the compute in app/components/ActivityCombinations/index.tsx.
//
//   node plan-engine.cjs <cityId> <days> [adults] [vibes]
//   e.g. node plan-engine.cjs rome 3 2 cultural,foodie
// `vibes` is a comma-separated list of vibe keys (cultural, foodie,
// adventurous, relaxing). When given, the featured `topActivities` are ranked
// by the activities' average score across those vibes (priority as tiebreak)
// instead of by priority. The trip itself is still planned with the default
// filters — vibes only re-rank which activities get featured.
import { setActiveCity, setActiveParty, type Party } from "../app/components/ActivityCombinations/core/activities.functions";
import { VIBES } from "../app/components/ActivityCombinations/core/activities.data";
import { CITIES } from "../app/components/ActivityCombinations/core/cities.data";
import { toEffective } from "../app/components/ActivityCombinations/core/filterStore.functions";
import { DEFAULT_EDITS } from "../app/components/ActivityCombinations/core/filterStore.data";
import { costOptionsForParty } from "../app/components/ActivityCombinations/core/filters.data";
import { defaultSelection } from "../app/components/ActivityCombinations/core/filters.functions";
import { scheduleEndHour } from "../app/components/ActivityCombinations/core/schedule.functions";
import { DEFAULT_START_HOUR } from "../app/components/ActivityCombinations/core/schedule.data";
import { planTrip } from "../app/components/ActivityCombinations/core/trip.functions";
import { enforceRequired } from "../app/components/ActivityCombinations/core/trip.required";
import { mondayIndex, startOfDay, addDays } from "../app/components/ActivityCombinations/core/calendar.functions";
import { HIDE_ACTIVITY_PRICES } from "@/app/config";

const [, , cityArg, daysArg, adultsArg, vibesArg] = process.argv;
const cityId = (cityArg || "rome").toLowerCase();
const days = Math.max(1, Math.min(parseInt(daysArg || "3", 10) || 3, 14));
const adults = Math.max(1, parseInt(adultsArg || "2", 10) || 2);
const vibeKeys = VIBES.map((v) => v.key as string);
const vibes = (vibesArg || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter((s) => vibeKeys.includes(s));

const city = CITIES.find((c) => c.id === cityId);
if (!city) { console.error("plan-engine: unknown city id: " + cityId); process.exit(1); }
const area = city.areas[0];
const party: Party = { adults, childAges: [] };

// Point the scoring engine at this city + area + party (order matters), exactly
// like index.tsx does before planning.
setActiveCity(city, area.coords);
setActiveParty(party);

// Runtime filters = default edits merged on the code defaults, with the cost
// filter's buckets rebuilt for the party (identical to index.tsx).
const travelers = party.adults + party.childAges.length;
const filters = toEffective(DEFAULT_EDITS)
  .filter((f) => !HIDE_ACTIVITY_PRICES || f.name !== "Κόστος")
  .map((f) => (f.name === "Κόστος" ? { ...f, options: costOptionsForParty(travelers) } : f));

// `days` consecutive days from today → weekday indices (0=Mon…6=Sun).
const today = startOfDay(new Date());
const dayIndices = Array.from({ length: days }, (_, i) => mondayIndex(addDays(today, i)));
const selections = dayIndices.map(() => defaultSelection(filters));
const starts = dayIndices.map(() => DEFAULT_START_HOUR);
const ends = dayIndices.map((_, i) => scheduleEndHour(filters, selections[i], starts[i]));
const circ = dayIndices.map(() => false);

const planned = planTrip(city.activities, dayIndices, starts, ends, selections, filters, circ);
const trip = enforceRequired(planned, new Set<string>(), starts, ends);

const DAYS_FULL = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
type Row = { day: number; weekday: string | null; name: string; description: string; tags: string[]; priority: number; vibeScore: number };
const activities: Row[] = [];
trip.days.forEach((d, di) => {
  for (const a of d.activities) {
    activities.push({
      day: di + 1,
      weekday: DAYS_FULL[d.day] ?? null,
      name: a.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      description: (a as any).description || "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tags: Array.isArray((a as any).tags) ? (a as any).tags : [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      priority: (a as any).priority ?? 0,
      // Average of the selected vibes' 0–10 fields (0 when no vibe selected).
      vibeScore: vibes.length
        ? vibes.reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (s, k) => s + (Number((a as any)[k]) || 0),
            0,
          ) / vibes.length
        : 0,
    });
  }
});
// "Top 3": by the selected vibes' average score (priority as tiebreak) when
// vibes were passed; otherwise by planner priority as before.
const topActivities = [...activities]
  .sort((x, y) =>
    vibes.length
      ? y.vibeScore - x.vibeScore || y.priority - x.priority
      : y.priority - x.priority,
  )
  .slice(0, 3);

const out = {
  destination: city.name,                 // Greek display name, e.g. "Ρώμη"
  destinationEn: cityId.charAt(0).toUpperCase() + cityId.slice(1),
  cityId,
  days,
  adults,
  vibes,             // the vibe keys used to rank topActivities ([] = none)
  tripScore: Number((trip.score ?? 0).toFixed(3)),
  activityCount: activities.length,
  activities,        // every planned activity, in day/schedule order
  topActivities,     // best 3 (vibe-ranked when vibes given, else priority)
};
process.stdout.write(JSON.stringify(out));
