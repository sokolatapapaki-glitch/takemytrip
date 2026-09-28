// -----------------------------------------------------------------------------
// Activity images — single source of truth
// -----------------------------------------------------------------------------
// A small photo gallery per activity, keyed by the activity's UNIQUE name
// (names are unique across every catalogue). Values are public-folder paths
// (served from /public) or remote URLs — both work in a plain <img>. An
// activity with no entry, or whose image fails to load, falls back to the vibe
// gradient + icon in the UI.
import type { Activity } from "@/app/components/ActivityCombinations/core/activities.functions";
import { CITIES } from "@/app/components/ActivityCombinations/core/cities.data";
import { GENERATED_ACTIVITY_IMAGES } from "./activityImages.generated";
import { EDITOR_ACTIVITY_IMAGES } from "@/data/activities/_images";
import { DESTINATION_IMAGES } from "@/app/cities/components/destinationImages.generated";

// Hand-curated entries — these WIN over the auto-generated ones (so you can fix
// any bad auto-pick by adding the activity name here).
const ACTIVITY_IMAGES_MANUAL: Record<string, string[]> = {
  // Krakow — Auschwitz-Birkenau Memorial (local file under /public).
  Auschwitz: ["/destinations/krakow/Auschwitz/auschwitz.jpg"],
};

export const ACTIVITY_IMAGES: Record<string, string[]> = {
  ...GENERATED_ACTIVITY_IMAGES,
  ...ACTIVITY_IMAGES_MANUAL,
};

// Fallback: each activity's destination cover, keyed by activity name. Used only
// when an activity has no photos of its own yet, so a card/modal is never empty
// (the real per-activity photos override this as soon as they exist).
const COVER_BY_NAME: Record<string, string> = {};
for (const c of CITIES) {
  const cover = DESTINATION_IMAGES[c.id];
  if (cover) for (const a of c.activities) COVER_BY_NAME[a.name] ??= cover;
}

// The photo gallery for an activity, first match wins:
//   1. the hand-curated manual list above (by name) — the fix-anything override
//   2. images approved in the editor app (by `ref`, "<cityId>:<id>" — names can
//      change in the editor, the ref can't). Remote ones only exist here with a
//      credit, which the /credits page lists (see data/activities/_images.ts).
//   3. the auto-generated photos (by name)
//   4. the destination cover, else empty (gradient fallback in the UI)
// Saved trips are snapshots whose activities may predate `ref`; they simply skip
// step 2 and resolve by name as before.
export const activityImages = (a: Activity): string[] => {
  const manual = ACTIVITY_IMAGES_MANUAL[a.name];
  if (manual && manual.length) return manual;
  const editor = a.ref ? EDITOR_ACTIVITY_IMAGES[a.ref] : undefined;
  if (editor && editor.length) return editor;
  const generated = GENERATED_ACTIVITY_IMAGES[a.name];
  if (generated && generated.length) return generated;
  const cover = COVER_BY_NAME[a.name];
  return cover ? [cover] : [];
};
