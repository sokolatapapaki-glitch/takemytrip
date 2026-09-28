import type { Credit, EditorImage } from "./types";

// The same rule the planner's generator applies (my-nextjs-app/scripts/
// gen-activities.lib.mjs → collectImages): a local /public path needs no credit;
// a remote image is shown only with every field below. Kept in step with it.
export const REQUIRED_CREDIT: (keyof Credit)[] = ["source", "photoUrl", "author", "license", "licenseUrl"];

export const imageUrl = (im: EditorImage): string => (typeof im === "string" ? im : im.url);
export const isLocal = (url: string) => url.startsWith("/");

// The credit fields a remote image is missing ([] = shown in the app).
export function missingCredit(im: EditorImage): (keyof Credit)[] {
  const url = imageUrl(im);
  if (!url || isLocal(url)) return [];
  const credit = typeof im === "string" ? undefined : im.credit;
  return REQUIRED_CREDIT.filter((k) => !credit || !credit[k]);
}

// Merge saved images and not-yet-approved candidates into one pool, saved first,
// dropping candidates whose URL is already saved.
export function imagePool(saved: EditorImage[] = [], candidates: EditorImage[] = []): EditorImage[] {
  const seen = new Set(saved.map(imageUrl));
  return [...saved, ...candidates.filter((c) => !seen.has(imageUrl(c)))];
}
