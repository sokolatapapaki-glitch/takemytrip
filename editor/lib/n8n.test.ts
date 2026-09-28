import { describe, it, expect } from "vitest";
import { cleanDraft, mapDraft, toEditorImage, toOpeningHours } from "./n8n";
import { imagePool, missingCredit } from "./images";

// Fixtures: no live workflow calls (free quota). v1 is rebuilt from the St Paul's
// Cathedral draft captured in testing — that draft was saved after mapping, so the
// raw image objects follow the shape lib/n8n.ts documents for v1 ({url, source,
// license, …}, no author). v2 follows the response contract in
// docs/plans/01-editor-planner-sync.md §8.
const v1 = {
  ok: true,
  draft: {
    name: "Καθεδρικός ναός Αγίου Παύλου",
    description: "Τα παιδιά θα εντυπωσιαστούν…",
    category: "education",
    duration: "2 ώρες",
    coordinates: { latitude: 51.5138453, longitude: -0.0983506 },
    officialWebsite: "https://www.stpauls.co.uk/",
    openingHours: ["Δευτέρα: 8:30 π.μ. – 4:30 μ.μ.", "Κυριακή: 8:00 π.μ. – 6:00 μ.μ."],
    importantNotes: ["Ο ναός είναι προσβάσιμος με καρότσι…"],
    images: [
      {
        url: "https://thumb.wikimedia.org/…/St_Paul%27s_Cathedral_West_Facade_Night_2020.jpg",
        source: "https://commons.wikimedia.org/wiki/File:St_Paul%27s_Cathedral_West_Facade_Night_2020.jpg",
        license: "CC BY-SA 4.0",
        match: 0.9,
      },
      "https://example.org/plain-string.jpg",
    ],
  },
};

const credit = {
  source: "Wikimedia Commons",
  photoUrl: "https://commons.wikimedia.org/wiki/File:Hundertwasserhaus.jpg",
  author: "Someone",
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  attributionRequired: true,
};
const MON_SAT_SUN_SHORT = [
  { open: 8.5, close: 16.5 }, { open: 8.5, close: 16.5 }, { open: 8.5, close: 16.5 },
  { open: 8.5, close: 16.5 }, { open: 8.5, close: 16.5 }, { open: 8.5, close: 16.5 }, null,
];
const v2 = {
  ok: true,
  draft: {
    name: "Hundertwasserhaus",
    description: "…",
    category: "entertainment",
    coordinates: { latitude: 48.2073, longitude: 16.3943, source: "wikidata" },
    officialWebsite: "http://www.hundertwasserhaus.info/",
    openingPeriods: MON_SAT_SUN_SHORT,
    images: [{ url: "https://upload.wikimedia.org/h.jpg", credit, match: 0.93 }],
  },
};

describe("mapDraft", () => {
  it("never pre-approves images: suggestions become candidates, images stay empty", () => {
    const d = mapDraft("St Paul's Cathedral", v1);
    expect(d.images).toEqual([]);
    expect(d.__imageCandidates).toHaveLength(2);
  });

  it("v1: keeps the partial credit, so the image is flagged instead of shown", () => {
    const d = mapDraft("St Paul's Cathedral", v1);
    const [first, second] = d.__imageCandidates!;
    expect(typeof first).toBe("object");
    expect(first).toMatchObject({
      credit: {
        source: "Wikimedia Commons",
        photoUrl: v1.draft.images[0] && (v1.draft.images[0] as { source: string }).source,
        license: "CC BY-SA 4.0",
      },
    });
    expect(missingCredit(first)).toEqual(["author", "licenseUrl"]);
    expect(missingCredit(second)).toEqual(["source", "photoUrl", "author", "license", "licenseUrl"]);
  });

  it("v1: no structured hours -> category default, Google's text kept as a note", () => {
    const d = mapDraft("St Paul's Cathedral", v1);
    expect(d.opening_hours).toBeUndefined();
    expect(d.notes!.some((n) => n.startsWith("Ωράριο (Google):"))).toBe(true);
  });

  it("v2: structured hours and a complete credit come through", () => {
    const d = mapDraft("Hundertwaserhaus", v2);
    expect(d.name).toBe("Hundertwasserhaus");
    expect(d.opening_hours).toEqual(MON_SAT_SUN_SHORT);
    expect(d.__imageCandidates).toEqual([{ url: "https://upload.wikimedia.org/h.jpg", credit }]);
    expect(missingCredit(d.__imageCandidates![0])).toEqual([]);
  });

  it("cleanDraft strips every transient field before saving", () => {
    const clean = cleanDraft(mapDraft("x", v2)) as Record<string, unknown>;
    expect(Object.keys(clean).filter((k) => k.startsWith("__"))).toEqual([]);
  });
});

describe("toOpeningHours / toEditorImage", () => {
  it("drops malformed hours instead of guessing", () => {
    expect(toOpeningHours([{ open: 9, close: 18 }])).toBeUndefined();
    expect(toOpeningHours(Array(7).fill({ open: 18, close: 9 }))).toBeUndefined();
    expect(toOpeningHours(Array(7).fill({ open: "9", close: 18 }))).toBeUndefined();
    expect(toOpeningHours(undefined)).toBeUndefined();
  });

  it("ignores images with no url", () => {
    expect(toEditorImage({ source: "x" })).toBeNull();
    expect(toEditorImage("")).toBeNull();
    expect(toEditorImage(null)).toBeNull();
  });
});

describe("images", () => {
  it("local /public paths never need a credit", () => {
    expect(missingCredit("/destinations/rome/1-a/1.jpg")).toEqual([]);
  });

  it("the pool lists saved images first and skips candidates already saved", () => {
    const pool = imagePool(["/a.jpg", "https://x/b.jpg"], ["https://x/b.jpg", "https://x/c.jpg"]);
    expect(pool).toEqual(["/a.jpg", "https://x/b.jpg", "https://x/c.jpg"]);
  });
});
