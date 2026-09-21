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

// The photo gallery for an activity: its own unique photos, else its destination
// cover, else empty (gradient fallback in the UI).
export const activityImages = (a: Activity): string[] => {
  const own = ACTIVITY_IMAGES[a.name];
  if (own && own.length) return own;
  const cover = COVER_BY_NAME[a.name];
  return cover ? [cover] : [];
};
