# Activity Images (Rome) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every Rome activity a small gallery of real, free-licensed photos that render on the activity cards and in the detail modal, with a gradient fallback so a missing or broken image never shows a broken `<img>`.

**Architecture:** Mirror the existing city-image pattern. Activity photos live in a new parallel map `ACTIVITY_IMAGES` keyed by the activity's unique `name` (Wikimedia Commons thumbnail URLs, 2–5 per activity), exposed via `activityImages(activity)`. The catalogue literals in `data/activities.data.ts` are NOT touched. The card and modal render a plain `<img loading="lazy">` over the existing vibe gradient and hide it on load error, so offscreen images don't block page load and bad URLs can never display broken.

**Tech Stack:** Next.js (App Router), Tailwind CSS v4, React. Remote images are served via a plain browser `<img>` (NOT `next/image`), exactly like the city images — so no `next.config` image-domain changes are needed.

**Verification reality:** This repo's only test runner is Vitest, restricted by `vitest.config.mts` to `**/*.planner.test.ts` (planner property tests). There is no component test harness, and the trivial `activityImages()` lookup isn't worth contorting that config for. So per-task verification is: `npx tsc --noEmit -p tsconfig.json` (types/JSX), a per-URL HTTP check (`curl`) for the data tasks (this is the real correctness risk — images that don't load), and a final visual check in `npm run dev`.

**Reference pattern to copy:** `app/cities/components/citiesData.ts` — `CITY_IMAGES: Record<string, string>` of Wikimedia Commons 800px thumbnails + `cityImage(c)` returning URL-or-null, with the card falling back to a gradient.

---

## Image-sourcing procedure (P1–P5)

The data tasks (Tasks 4–7) each populate part of `ACTIVITY_IMAGES`. For EVERY activity, follow these exact steps. (Repeated here once in full; each data task references P1–P5 and lists its own activities + disambiguation.)

- **P1 — Identify the real place.** Use the activity name and the disambiguation note in the task. For Greek names, the place is the Latin name in parentheses or the obvious landmark (e.g. `Πάνθεον` = the Pantheon, Rome; `Βατικανό` = St. Peter's Basilica / Vatican).

- **P2 — Find Commons images.** Fetch the English Wikipedia REST summary, which returns Commons-hosted image URLs:
  `WebFetch https://en.wikipedia.org/api/rest_v1/page/summary/<Page_Title>` (e.g. `Trevi_Fountain`, `Pantheon,_Rome`, `Galleria_Borghese`). Use the `originalimage`/`thumbnail` `source` URL. For more than one photo, also fetch the Commons MediaSearch JSON:
  `WebFetch https://commons.wikimedia.org/w/index.php?search=<place>&title=Special:MediaSearch&type=image` and pick clear, relevant photos (avoid maps, logos, or low-quality shots).

- **P3 — Build an 800px thumbnail URL** in the same shape the city images use:
  `https://upload.wikimedia.org/wikipedia/commons/thumb/<a>/<ab>/<File>.<ext>/800px-<File>.<ext>`
  (If the Wikipedia summary already returns an `upload.wikimedia.org/.../<width>px-...` URL, just swap the width segment to `800px-`.)

- **P4 — Verify each URL loads (THE important check).** Run:
  ```bash
  curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "<url>"
  ```
  Expected: `200 image/jpeg` (or `image/png`, `image/webp`). If you get `400`/`404`, the width or filename is wrong — try the original width from the summary, a different file, or `1280px-`. NEVER add a URL you haven't seen return `200 image/*`.

- **P5 — Record 2–5 verified URLs per activity** in `ACTIVITY_IMAGES`, keyed by the activity's EXACT name string (copy it verbatim, including Greek text and punctuation). If Commons has no suitable free image for an activity, omit that activity entirely — it keeps the gradient. Aim for 2–5; fewer is fine.

---

### Task 1: Create the activity-images map + helper

**Files:**
- Create: `app/activities/components/activityImages.ts`

- [ ] **Step 1: Create the module**

```ts
// -----------------------------------------------------------------------------
// Activity images — single source of truth
// -----------------------------------------------------------------------------
// Wikimedia Commons thumbnails (free-licensed, hotlinkable via a plain browser
// <img>, like the city images in app/cities/components/citiesData.ts), a small
// gallery per activity keyed by the activity's UNIQUE name (Paris catalogue
// entries have id: null, so name is the only stable key). An activity with no
// entry — or whose URLs fail to load — falls back to the vibe gradient. Every
// URL here has been verified to return HTTP 200 with an image/* content type
// before being added (see the activity-images plan, procedure P4).
import type { Activity } from "@/app/components/ActivityCombinations/core/activities.functions";

export const ACTIVITY_IMAGES: Record<string, string[]> = {
  // Populated by the data tasks (Rome first). Example shape:
  // "Fontana di Trevi": [
  //   "https://upload.wikimedia.org/wikipedia/commons/thumb/.../800px-....jpg",
  //   "https://upload.wikimedia.org/wikipedia/commons/thumb/.../800px-....jpg",
  // ],
};

// The photo gallery for an activity (possibly empty → gradient fallback in UI).
export const activityImages = (a: Activity): string[] =>
  ACTIVITY_IMAGES[a.name] ?? [];
```

- [ ] **Step 2: Typecheck**

Run: `cd "c:/Users/kopot/OneDrive/Desktop/Dimitris/CODING/WORKING-ON/ttk_app/my-nextjs-app" && npx tsc --noEmit -p tsconfig.json`
Expected: no output (exit 0).

- [ ] **Step 3: Commit**

```bash
git add app/activities/components/activityImages.ts
git commit -m "feat: add ACTIVITY_IMAGES map + activityImages() helper"
```

---

### Task 2: Render the first image on the activity card

**Files:**
- Modify: `app/activities/components/ActivityCard.tsx` (imports near the top; the image placeholder `<div>`)

**Why:** The card shows a vibe-gradient placeholder with an icon. Overlay the first gallery image when one exists; on load error, hide the `<img>` so the gradient + icon show through. `loading="lazy"` keeps offscreen cards from blocking page load. This card is reused on the activities grid, the My Trips strip, and the modal's related strip — so all of them get real images at once.

- [ ] **Step 1: Add the import**

Find the existing import block (it already imports from `./vibeStyle`). Add this line directly under that import:

```tsx
import { VIBE_GRADIENT, VIBE_ICONS } from "./vibeStyle";
import { activityImages } from "./activityImages";
```

- [ ] **Step 2: Render the image over the gradient**

Find this exact element (the image placeholder):

```tsx
      {/* Image placeholder — bright gradient coloured by the activity's vibe. */}
      <div
        className={`flex ${imageClass} items-center justify-center bg-gradient-to-br ${VIBE_GRADIENT[vibe.key]}`}
      >
        <VibeIcon className="h-12 w-12 text-white drop-shadow" />
      </div>
```

Replace it with (adds `relative overflow-hidden` so the absolute image clips to the rounded card, plus the image overlay):

```tsx
      {/* Image placeholder — bright gradient coloured by the activity's vibe,
          with the first real photo (if any) layered over it. A load failure
          hides the <img> so the gradient + icon show through. */}
      <div
        className={`relative flex ${imageClass} items-center justify-center overflow-hidden bg-gradient-to-br ${VIBE_GRADIENT[vibe.key]}`}
      >
        <VibeIcon className="h-12 w-12 text-white drop-shadow" />
        {activityImages(activity)[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activityImages(activity)[0]}
            alt={activity.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (exit 0).

- [ ] **Step 4: Commit**

```bash
git add app/activities/components/ActivityCard.tsx
git commit -m "feat: show first activity photo on the card (gradient fallback)"
```

---

### Task 3: Drive the detail-modal gallery off the real images

**Files:**
- Modify: `app/components/ActivityDetail/index.tsx` (import; derive `images`; big image overlay + arrow gating; thumbnail row)

**Why:** The modal's big image + 5 thumbnails + prev/next arrows currently cycle over a fixed `THUMB_COUNT` of gradient placeholders. Drive them off `activityImages(current)`: show real photos when present (arrows only when there's more than one), and keep the existing 5 gradient thumbs when an activity has no images. `activeImage` already resets to 0 when `current` changes, which keeps the index valid across activities.

- [ ] **Step 1: Add the import**

Find this exact line:

```tsx
import { ActivityCard } from "@/app/activities/components/ActivityCard";
```

Add directly under it:

```tsx
import { ActivityCard } from "@/app/activities/components/ActivityCard";
import { activityImages } from "@/app/activities/components/activityImages";
```

- [ ] **Step 2: Derive the gallery array**

Find this exact line:

```tsx
  const stars = starsOf(current);
```

Replace it with:

```tsx
  const stars = starsOf(current);
  // The activity's photo gallery (Wikimedia Commons; empty → gradient fallback).
  const images = activityImages(current);
```

- [ ] **Step 3: Overlay the big image + gate the arrows**

Find this exact block (the big image container and its two arrow buttons):

```tsx
          <div
            className={`group relative flex h-56 w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${VIBE_GRADIENT[vibe.key]} md:h-72`}
          >
            <VibeIcon className="h-16 w-16 text-white drop-shadow" />

            {/* Hover-only, low-opacity prev/next arrows that cycle the gallery. */}
            <button
              type="button"
              onClick={() => setActiveImage((i) => (i - 1 + THUMB_COUNT) % THUMB_COUNT)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-200 hover:bg-black/60 group-hover:opacity-60"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveImage((i) => (i + 1) % THUMB_COUNT)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-200 hover:bg-black/60 group-hover:opacity-60"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
```

Replace it with:

```tsx
          <div
            className={`group relative flex h-56 w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${VIBE_GRADIENT[vibe.key]} md:h-72`}
          >
            <VibeIcon className="h-16 w-16 text-white drop-shadow" />

            {/* Real photo over the gradient when available; a load failure hides
                it (gradient + icon show through). key forces a fresh element per
                src so a previous failure's display:none can't carry over. */}
            {images[activeImage] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={images[activeImage]}
                src={images[activeImage]}
                alt={current.name}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            {/* Hover-only, low-opacity prev/next arrows — only when there's more
                than one image to cycle through. */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImage((i) => (i - 1 + images.length) % images.length)
                  }
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-200 hover:bg-black/60 group-hover:opacity-60"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-200 hover:bg-black/60 group-hover:opacity-60"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
```

- [ ] **Step 4: Render real thumbnails (fall back to the 5 gradient thumbs)**

Find this exact block:

```tsx
          <div className="flex justify-center gap-2">
            {Array.from({ length: THUMB_COUNT }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`Image ${i + 1}`}
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${VIBE_GRADIENT[vibe.key]} transition ${i === activeImage
                  ? "opacity-100 ring-2 ring-orange-400 ring-offset-2 dark:ring-offset-zinc-900"
                  : "opacity-60 hover:opacity-80"
                  }`}
              />
            ))}
          </div>
```

Replace it with:

```tsx
          <div className="flex justify-center gap-2">
            {(images.length > 0
              ? images
              : (Array.from({ length: THUMB_COUNT }) as undefined[])
            ).map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`Image ${i + 1}`}
                className={`relative h-12 w-12 overflow-hidden rounded-xl bg-gradient-to-br ${VIBE_GRADIENT[vibe.key]} transition ${i === activeImage
                  ? "opacity-100 ring-2 ring-orange-400 ring-offset-2 dark:ring-offset-zinc-900"
                  : "opacity-60 hover:opacity-80"
                  }`}
              >
                {src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
```

(`THUMB_COUNT` is still used for the no-images fallback, so its declaration stays.)

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (exit 0). In particular this confirms the `string[] | undefined[]` map in Step 4 narrows `src` correctly.

- [ ] **Step 6: Commit**

```bash
git add app/components/ActivityDetail/index.tsx
git commit -m "feat: real photo gallery in the activity detail modal"
```

---

### Task 4: Populate Rome images — batch A (activities #1–7)

**Files:**
- Modify: `app/activities/components/activityImages.ts` (add entries to `ACTIVITY_IMAGES`)

**Activities (exact `name` keys) + disambiguation:**
1. `Castello Orsini-Odescalchi (Bracciano)` — Odescalchi Castle, Bracciano (`Castello_Orsini-Odescalchi`)
2. `Santa Severa Castle` — Castle of Santa Severa (`Castle_of_Santa_Severa`)
3. `Welcome to Rome` — a private 3D show; likely NO free Commons photo → omit if none found
4. `Λόφος Gianicolo (Teatrino di Pulcinella)` — Janiculum hill, Rome (`Janiculum`)
5. `Parco degli Acquedotti` — Park of the Aqueducts (`Parco_degli_Acquedotti`)
6. `Museo Leonardo Da Vinci` — Leonardo da Vinci exhibition (use a da Vinci machine model image if a venue photo isn't free; otherwise omit)
7. `Quartiere Coppedè` — Coppedè district, Rome (`Quartiere_Coppedè`)

- [ ] **Step 1: Source + verify** — For each activity above, follow procedure **P1–P5** (top of this plan). Run the **P4** `curl` check on every candidate URL; keep only those that returned `200 image/*` (2–5 per activity; omit an activity with none).

- [ ] **Step 2: Add the verified entries** to `ACTIVITY_IMAGES` in `app/activities/components/activityImages.ts`, keyed by the EXACT name strings above, e.g.:

```ts
export const ACTIVITY_IMAGES: Record<string, string[]> = {
  "Castello Orsini-Odescalchi (Bracciano)": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/<…>/800px-<…>.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/<…>/800px-<…>.jpg",
  ],
  // …the rest of batch A…
};
```

- [ ] **Step 3: Re-verify every URL added in this batch** (paste each URL):

```bash
for u in "<url1>" "<url2>" "<url3>"; do curl -s -o /dev/null -w "%{http_code} %{content_type}  $u\n" "$u"; done
```
Expected: every line starts with `200 image/`. Remove/replace any that don't.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (exit 0).

- [ ] **Step 5: Commit**

```bash
git add app/activities/components/activityImages.ts
git commit -m "data: Rome activity images batch A (#1-7)"
```

---

### Task 5: Populate Rome images — batch B (activities #8–14)

**Files:**
- Modify: `app/activities/components/activityImages.ts`

**Activities (exact `name` keys) + disambiguation:**
8. `Η Τρύπα της Κλειδαριάς (Aventine Keyhole)` — Aventine Keyhole / Knights of Malta keyhole (`Priory_of_the_Knights_of_Malta`)
9. `Villa Carpegna` — Villa Carpegna park, Rome (omit if no free photo)
10. `Explora` — Explora children's museum, Rome (omit if no free venue photo)
11. `Museo delle Illusioni (Μουσείο Ψευδαισθήσεων)` — Museum of Illusions, Rome (omit if no free photo)
12. `Villa Borghese` — Villa Borghese gardens (`Villa_Borghese_gardens`)
13. `Bioparco di Roma` — Rome zoo / Bioparco (`Bioparco_di_Roma`)
14. `Galleria Borghese` — Galleria Borghese museum (`Galleria_Borghese`)

- [ ] **Step 1: Source + verify** — follow **P1–P5** for each activity above; keep only `200 image/*` URLs (2–5 each; omit if none).

- [ ] **Step 2: Add the verified entries** to `ACTIVITY_IMAGES`, keyed by the exact name strings above (same object literal shape as Task 4 Step 2).

- [ ] **Step 3: Re-verify every URL added in this batch:**

```bash
for u in "<url1>" "<url2>" "<url3>"; do curl -s -o /dev/null -w "%{http_code} %{content_type}  $u\n" "$u"; done
```
Expected: every line starts with `200 image/`.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add app/activities/components/activityImages.ts
git commit -m "data: Rome activity images batch B (#8-14)"
```

---

### Task 6: Populate Rome images — batch C (activities #15–20)

**Files:**
- Modify: `app/activities/components/activityImages.ts`

**Activities (exact `name` keys) + disambiguation:**
15. `Rome Gladiator School - Gruppo Storico Romano` — Gruppo Storico Romano gladiator school (use a Roman gladiator reenactment image if no venue photo; otherwise omit)
16. `Cinecittà World` — Cinecittà World theme park, Rome (`Cinecittà_World`)
17. `Luneur Park` — Luneur Park amusement park, Rome (omit if no free photo)
18. `Κολοσσαίο & Ρωμαϊκή Αγορά` — Colosseum & Roman Forum (`Colosseum`, `Roman_Forum`)
19. `Castel Sant'Angelo` — Castel Sant'Angelo (`Castel_Sant'Angelo`)
20. `Largo di Torre Argentina` — Largo di Torre Argentina (`Largo_di_Torre_Argentina`)

- [ ] **Step 1: Source + verify** — follow **P1–P5**; keep only `200 image/*` URLs (2–5 each; omit if none).

- [ ] **Step 2: Add the verified entries** to `ACTIVITY_IMAGES`, keyed by the exact name strings above.

- [ ] **Step 3: Re-verify every URL added in this batch:**

```bash
for u in "<url1>" "<url2>" "<url3>"; do curl -s -o /dev/null -w "%{http_code} %{content_type}  $u\n" "$u"; done
```
Expected: every line starts with `200 image/`.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add app/activities/components/activityImages.ts
git commit -m "data: Rome activity images batch C (#15-20)"
```

---

### Task 7: Populate Rome images — batch D (activities #21–26)

**Files:**
- Modify: `app/activities/components/activityImages.ts`

**Activities (exact `name` keys) + disambiguation:**
21. `Πάνθεον` — Pantheon, Rome (`Pantheon,_Rome`)
22. `Piazza Navona` — Piazza Navona (`Piazza_Navona`)
23. `Fontana di Trevi` — Trevi Fountain (`Trevi_Fountain`)
24. `San Giovanni in Laterano` — Archbasilica of St. John Lateran (`Archbasilica_of_Saint_John_Lateran`)
25. `Βατικανό` — St. Peter's Basilica / Vatican (`St._Peter's_Basilica`)
26. `Μουσεία Βατικανού και Καπέλα Σιστίνα` — Vatican Museums & Sistine Chapel (`Vatican_Museums`, `Sistine_Chapel`)

- [ ] **Step 1: Source + verify** — follow **P1–P5**; keep only `200 image/*` URLs (2–5 each; these are all famous, so aim for the full 5).

- [ ] **Step 2: Add the verified entries** to `ACTIVITY_IMAGES`, keyed by the exact name strings above.

- [ ] **Step 3: Re-verify every URL added in this batch:**

```bash
for u in "<url1>" "<url2>" "<url3>"; do curl -s -o /dev/null -w "%{http_code} %{content_type}  $u\n" "$u"; done
```
Expected: every line starts with `200 image/`.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add app/activities/components/activityImages.ts
git commit -m "data: Rome activity images batch D (#21-26)"
```

---

### Task 8: Final visual verification

**Files:** none (manual check)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` and open `http://localhost:3000/activities?city=rome`.

- [ ] **Step 2: Check the cards** — Rome activity cards that have images show a real photo filling the image area (object-cover); imaged but niche activities you omitted still show the gradient + icon. No broken-image glyphs anywhere.

- [ ] **Step 3: Check the modal** — Click "See more" on the Colosseum / Trevi / Pantheon. The big image shows the photo; hovering reveals prev/next arrows (only when >1 image) that cycle photos; the thumbnail row shows one thumb per real photo, the active one ringed. Open an omitted activity (e.g. one with no images) — it shows the gradient big image with the 5 gradient thumbs and NO arrows.

- [ ] **Step 4: Confirm no console errors** about images (a hidden `onError` image is expected to be silent; there should be no uncaught errors).

- [ ] **Step 5 (optional): commit a screenshot or notes** if you keep a changelog — otherwise nothing to commit; the feature is complete.

---

## Self-Review

**Spec coverage:**
- "put images in all the Rome activities, in the data" → Tasks 4–7 populate `ACTIVITY_IMAGES` for all 26 Rome activities (omitting only those with no free image). ✓
- "without the images not loading" (reliable loading, no broken images) → P4 `curl` 200-check on every URL (Tasks 4–7 Step 3), plus `onError` gradient fallback and `loading="lazy"` in Tasks 2 & 3. ✓
- "how could I use you to do it" → the agent executes Tasks 4–7 (WebFetch sourcing + curl verification) per P1–P5; Tasks 1–3 wire it into the type-safe map + UI. ✓
- Decisions honored: Wikimedia Commons (P2), parallel map keyed by name (Task 1), multiple images/real gallery (`string[]`, Task 3), Rome first (Tasks 4–7). ✓

**Placeholder scan:** No "TBD/handle edge cases/etc." The `<…>` tokens in the data tasks are the literal URLs the agent fills after the P4 check — not skipped work; the procedure to obtain them (P1–P5) is fully specified. Code tasks (1–3) show complete before/after blocks. ✓

**Type consistency:** `ACTIVITY_IMAGES: Record<string, string[]>` and `activityImages(a): string[]` (Task 1) are used identically in Task 2 (`activityImages(activity)[0]`) and Task 3 (`const images = activityImages(current)`, `images[activeImage]`, `images.length`). The Task 3 Step 4 fallback uses the same `THUMB_COUNT` constant already declared in the file. ✓
