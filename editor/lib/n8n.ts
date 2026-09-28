import type { Credit, DayHours, EditorActivity, EditorImage, OpeningHours } from "./types";

// The Oracle VM n8n "Family Travel Activity Research (Greek)" workflow, exposed as
// a POST webhook that takes { name, city } and returns { ok, draft } (or ok:false).
// URL changes if the Cloudflare quick tunnel restarts — override via env.
export const N8N_WEBHOOK_URL =
  process.env.N8N_ACTIVITY_WEBHOOK ||
  "https://martial-bless-gibraltar-controls.trycloudflare.com/webhook/activity-draft";

// n8n's category taxonomy (4 values) -> the app's category presets.
const CATEGORY_MAP: Record<string, string> = {
  entertainment: "attraction",
  education: "museum",
  food: "restaurant",
  nature: "park",
};

// "2 ώρες" / "1.5h" / "90 min" -> a number of hours (or undefined to let the
// category preset decide). Minutes are converted when the unit looks like minutes.
function parseHours(duration: unknown): number | undefined {
  if (typeof duration === "number" && isFinite(duration)) return duration;
  if (typeof duration !== "string") return undefined;
  const m = duration.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return undefined;
  let n = Number(m[1].replace(",", "."));
  if (!isFinite(n)) return undefined;
  if (/min|λεπτ/i.test(duration)) n = n / 60;
  return Math.round(n * 2) / 2; // snap to nearest 0.5h
}

// A draft is a normal EditorActivity plus transient UI hints (stripped on save).
export type ActivityDraft = EditorActivity & {
  __requested: string; // the name the user typed (to show name corrections)
  __notFound?: boolean;
  // Images the workflow suggested. Never saved as-is: the reviewer ticks the ones
  // to keep, which copies them into `images` (see ImagesEditor).
  __imageCandidates?: EditorImage[];
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const isUrl = (v: unknown) => typeof v === "string" && /^https?:\/\//.test(v);

// One workflow image -> an EditorImage, keeping whatever credit it came with.
// v2 of the workflow sends { url, credit: {...} }; v1 sent flat fields
// ({ url, source, license, … }) with no author, which leaves the credit
// incomplete — the editor then flags it and the planner won't show it.
export function toEditorImage(im: unknown): EditorImage | null {
  if (typeof im === "string") return im || null;
  if (!im || typeof im !== "object") return null;
  const o = im as Record<string, unknown>;
  const url = str(o.url);
  if (!url) return null;
  const c = (o.credit && typeof o.credit === "object" ? o.credit : o) as Record<string, unknown>;
  const credit: Credit = {
    // v1's `source` is sometimes the photo's page URL rather than a name.
    source: isUrl(c.source) ? "Wikimedia Commons" : str(c.source),
    photoUrl: str(c.photoUrl) || str(c.pageUrl) || str(c.descriptionUrl) || (isUrl(c.source) ? str(c.source) : ""),
    author: str(c.author) || str(c.artist),
    license: str(c.license),
    licenseUrl: str(c.licenseUrl),
    attributionRequired: c.attributionRequired === false ? false : true,
  };
  if (str(c.file)) credit.file = str(c.file);
  return { url, credit };
}

// v2's `openingPeriods`: 7 days Mon→Sun, each {open, close} or null. Anything
// malformed is dropped (the reviewer sets hours by hand) rather than guessed.
export function toOpeningHours(p: unknown): OpeningHours | undefined {
  if (!Array.isArray(p) || p.length !== 7) return undefined;
  const days: DayHours[] = [];
  for (const d of p) {
    if (d === null) { days.push(null); continue; }
    const o = d as { open?: unknown; close?: unknown };
    if (typeof o?.open !== "number" || typeof o?.close !== "number") return undefined;
    if (o.open < 0 || o.close > 24 || o.open >= o.close) return undefined;
    days.push({ open: o.open, close: o.close });
  }
  return days;
}

export function mapDraft(requested: string, r: any): ActivityDraft {
  if (!r || r.ok === false || !r.draft) {
    return {
      id: null, name: requested, description: "", category: "attraction",
      prices: {}, notes: [], tags: [], images: [],
      __requested: requested, __notFound: true,
    };
  }
  const d = r.draft;
  const coords = d.coordinates && d.coordinates.latitude != null
    ? { lat: Number(d.coordinates.latitude), lng: Number(d.coordinates.longitude) }
    : undefined;
  const notes: string[] = Array.isArray(d.importantNotes)
    ? d.importantNotes.filter((s: unknown) => typeof s === "string" && s)
    : [];
  const oh: string[] = Array.isArray(d.openingHours) ? d.openingHours : [];
  if (oh.length) notes.push("Ωράριο (Google): " + oh.join(" · "));
  return {
    id: null,
    name: d.name || requested,
    description: d.description || "",
    category: CATEGORY_MAP[d.category] || "attraction",
    duration_hours: parseHours(d.duration),
    location: coords,
    website: d.officialWebsite || "",
    notes,
    tags: [],
    // Structured hours only when the workflow sends them (v2); until then the
    // category default applies and Google's text stays in the notes above.
    opening_hours: toOpeningHours(d.openingPeriods),
    // Nothing is pre-approved: suggestions wait in __imageCandidates.
    images: [],
    __imageCandidates: Array.isArray(d.images)
      ? d.images.map(toEditorImage).filter((x: EditorImage | null): x is EditorImage => x !== null)
      : [],
    prices: {},
    best_time: null,
    restaurant: null,
    cafe: null,
    __requested: requested,
  };
}

// Call the workflow once per activity name. Never throws for a single failure —
// a failed name comes back as a not-found draft so the batch still returns.
export async function generateDrafts(city: string, names: string[]): Promise<ActivityDraft[]> {
  const out: ActivityDraft[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city }),
        // The workflow does Places + Commons + Gemini; give it room.
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) { out.push(mapDraft(name, { ok: false })); continue; }
      const json = await res.json();
      out.push(mapDraft(name, json));
    } catch {
      out.push(mapDraft(name, { ok: false }));
    }
  }
  return out;
}

// Strip transient UI-only fields before persisting a draft into the JSON.
export function cleanDraft(d: ActivityDraft): EditorActivity {
  const { __requested, __notFound, __imageCandidates, ...activity } = d;
  void __requested; void __notFound; void __imageCandidates;
  return activity;
}
