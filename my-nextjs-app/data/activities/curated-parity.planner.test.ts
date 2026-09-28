// -----------------------------------------------------------------------------
// Rome/Paris parity: generated catalogue == the hand-curated one it replaced
// -----------------------------------------------------------------------------
// docs/plans/01-editor-planner-sync.md §6 step 4. Rome and Paris used to be
// hand-curated; their tuned engine values were snapshotted into
// scripts/curated-snapshot.json (by a one-off script, removed after use), moved
// into the JSON (scripts/migrate-curated-to-json.mjs), and both cities are now
// generated.
// This proves nothing the planner schedules or scores on changed in the move.
// Remove together with the snapshot once the migration is accepted (plan task 16).
import { describe, expect, test } from "vitest";
import snapshot from "../../scripts/curated-snapshot.json";
import { ROME_ACTIVITIES } from "./rome.data";
import { PARIS_ACTIVITIES } from "./paris.data";

type Row = { id: number | null; name: string };
const engine = (a: {
  hours: number;
  cost: number;
  program: { open: number; close: number }[];
  cultural: number;
  foodie: number;
  adventurous: number;
  relaxing: number;
  priority: number;
  is_lunch?: boolean;
}) => ({
  hours: a.hours,
  cost: a.cost,
  program: a.program.map((w) => ({ open: w.open, close: w.close })),
  vibes: [a.cultural, a.foodie, a.adventurous, a.relaxing],
  priority: a.priority,
  is_lunch: a.is_lunch === true,
});

describe("Rome: every activity regenerates exactly as curated", () => {
  test("same 26 activities, same ids and names", () => {
    expect(ROME_ACTIVITIES.map((a) => [a.id, a.name]).sort()).toEqual(
      snapshot.rome.map((r: Row) => [r.id, r.name]).sort()
    );
  });
  for (const row of snapshot.rome) {
    test(`#${row.id} ${row.name}`, () => {
      const gen = ROME_ACTIVITIES.find((a) => a.id === row.id)!;
      expect(engine(gen)).toEqual(engine(row));
    });
  }
});

// Paris is a different list now (the JSON's 22); only the overlaps carried their
// tuned values over — see PARIS_MAP in migrate-curated-to-json.mjs.
const PARIS_MAP: Record<string, { to: string; hours: boolean }> = {
  "Eiffel Tower": { to: "Πύργος του Άιφελ", hours: true },
  "Louvre Museum": { to: "Μουσείο του Λούβρου", hours: true },
  "Musée d'Orsay": { to: "Μουσείο Orsay", hours: true },
  "Sainte-Chapelle": { to: "Sainte-Chapelle", hours: true },
  "Luxembourg Gardens": { to: "Κήποι του Λουξεμβούργου", hours: true },
  "Montmartre & Sacré-Cœur": { to: "Sacré-Cœur (Θόλος)", hours: false },
};

describe("Paris: the overlaps kept their tuned values", () => {
  test("Paris is now the 22 activities of paris.json", () => {
    expect(PARIS_ACTIVITIES).toHaveLength(22);
  });
  for (const row of snapshot.paris.filter((r: Row) => PARIS_MAP[r.name])) {
    const { to, hours } = PARIS_MAP[row.name];
    test(`${row.name} -> ${to}`, () => {
      const gen = PARIS_ACTIVITIES.find((a) => a.name === to)!;
      expect(gen).toBeDefined();
      const g = engine(gen);
      const s = engine(row);
      expect(g.vibes).toEqual(s.vibes);
      expect(g.priority).toEqual(s.priority);
      if (hours) expect(g.program).toEqual(s.program);
    });
  }
});
