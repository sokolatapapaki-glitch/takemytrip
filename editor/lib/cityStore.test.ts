import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Point JSON_DIR at a throwaway temp dir before importing cityStore.
let TMP: string;
vi.mock("./paths", () => ({ get JSON_DIR() { return TMP; }, NEXTAPP_DIR: "" }));

const sample = {
  city: "Τεστόπολη",
  activities: [
    { id: 1, name: "A", description: "d", category: "museum" },
    { id: 2, name: "B", description: "d", category: "park", archived: true },
  ],
};

describe("cityStore", () => {
  beforeEach(() => {
    TMP = mkdtempSync(join(tmpdir(), "citystore-"));
    writeFileSync(join(TMP, "testville.json"), JSON.stringify(sample), "utf8");
  });
  afterEach(() => rmSync(TMP, { recursive: true, force: true }));

  it("listCities counts active vs archived and uses the greek label", async () => {
    const { listCities } = await import("./cityStore");
    const list = await listCities();
    const row = list.find((c) => c.id === "testville")!;
    expect(row.label).toBe("Τεστόπολη");
    expect(row.count).toBe(1);
    expect(row.archivedCount).toBe(1);
  });

  it("writeCity round-trips UTF-8 and pretty-prints", async () => {
    const { readCity, writeCity } = await import("./cityStore");
    const city = await readCity("testville");
    city.activities[0].name = "Ακρόπολη";
    await writeCity("testville", city);
    const raw = readFileSync(join(TMP, "testville.json"), "utf8");
    expect(raw).toContain("Ακρόπολη");
    expect(raw.endsWith("\n")).toBe(true);
    expect(raw).toContain('\n  "city"'); // 2-space indent
  });

  it("round-trips the contract fields: per-day hours, vibes, credited images", async () => {
    const { readCity, writeCity } = await import("./cityStore");
    const city = await readCity("testville");
    const hours = [
      { open: 9, close: 18 }, null, { open: 9, close: 18 }, { open: 9, close: 18 },
      { open: 9, close: 21.75 }, { open: 9, close: 18 }, { open: 0, close: 24 },
    ];
    const image = {
      url: "https://upload.wikimedia.org/x.jpg",
      credit: {
        source: "Wikimedia Commons", photoUrl: "https://commons.wikimedia.org/wiki/File:X.jpg",
        author: "Someone", license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", attributionRequired: true,
      },
    };
    Object.assign(city.activities[0], {
      opening_hours: hours,
      vibes: { cultural: 10, foodie: 0, adventurous: 1, relaxing: 2 },
      priority: 10,
      images: ["/destinations/testville/1-a/1.jpg", image],
    });
    await writeCity("testville", city);
    const back = (await readCity("testville")).activities[0];
    expect(back.opening_hours).toEqual(hours);
    expect(back.vibes).toEqual({ cultural: 10, foodie: 0, adventurous: 1, relaxing: 2 });
    expect(back.priority).toBe(10);
    expect(back.images).toEqual(["/destinations/testville/1-a/1.jpg", image]);
  });
});
