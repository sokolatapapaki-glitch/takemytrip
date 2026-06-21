---
name: city-activity-images
description: >-
  Find, download, and install accurate, legally-usable, properly-credited photos
  for a city's travel activities in the ttk_app / my-nextjs-app project, following
  the curated Unsplash + Wikimedia Commons pipeline (one hand-picked image per
  activity). Use this whenever the user wants to get, generate, fetch, fix, replace,
  or refresh images/photos for a destination's activities — e.g. "find images for
  Rome's activities", "get photos for Paris", "the Madrid activity images are wrong,
  redo them", "add an image for the Colosseum and the Pantheon". Also trigger when
  the user names one or more specific activities and wants images only for those.
  Legal usage and correct attribution/credits are the top priority — only Unsplash
  and Wikimedia Commons are allowed as sources.
---

# City activity images

Install **one accurate, legally-usable, credited photo per activity** for a city in
this project — the same hand-picked approach proven on Barcelona, generalized to any
city, for the whole city or just specific activities.

Why this skill exists: the project already has a fully-automatic fetcher
(`scripts/gen-activity-images.mjs`), but it picked inaccurate photos (a generic
skyline for a museum, the wrong building, etc.). This skill replaces that with
human-verified picks. **The machinery (download, manifest, credits, attribution) is
already written — your job is the judgment: choosing the one correct, free image for
each activity and recording where it came from.**

All commands run from `my-nextjs-app/` and need network access.

## The two modes

- **Whole city** — "find images for Rome's activities" → cover every activity for that city.
- **Specific activities** — "get an image for the Colosseum and the Pantheon" → cover
  only those, leaving every other activity's image untouched.

## Workflow

Create one todo per step so nothing is skipped.

### 1. Resolve the city id and the target activities

The city **id** is the folder name under `public/destinations/` (lowercase, e.g.
`rome`, `paris`, `madrid`). Map whatever the user typed to that id.

List the city's activities — this is the source of truth for the exact `name` and the
canonical image `folder`, so they never drift from the app:

```bash
node scripts/list-activities.mjs --city=<id>          # table: <folder>\t<name>
node scripts/list-activities.mjs --city=<id> --json   # same, as JSON
```

- Whole-city mode → every listed activity is a target.
- Specific-activities mode → match the user's wording to entries in that list and keep
  only those. If a name is ambiguous, ask the user which one they mean rather than guess.

### 2. Pick one accurate, legal image per target activity

This is the part only you can do. For each target activity, find **one** photo that
genuinely depicts it, from an allowed source only. Read
[references/sourcing-and-legal.md](references/sourcing-and-legal.md) for the full rules
and exactly how to find an Unsplash id or a Wikimedia Commons `File:` title. In short:

- **Famous landmarks, exteriors, cityscapes → Unsplash first.** Unsplash License: free
  for commercial use, no attribution legally required (we still record the photographer).
- **Museums, branded attractions, niche/local sights Unsplash lacks → Wikimedia Commons.**
  Free, but **attribution is required** — the engine fetches author + licence from the
  Commons API automatically and writes them into the credits files.
- **Accuracy is non-negotiable.** The photo must show *this* place. Verify before
  committing (see the references file — view the candidate image when unsure).
- **No accurate free photo exists?** Pick the closest legitimate representative image and
  add a `note:` explaining the substitution (as Barcelona did for the Gaudí Experience).
  Never reach for a non-allowed source to force a "perfect" match.

### 3. Write the curated data file

The per-city picks live in `scripts/curated/<id>.mjs`. Copy the shape from
`scripts/curated/_template.mjs` (and see `scripts/curated/barcelona.mjs` for a full
worked example). Each entry:

```js
// Unsplash: just the photo id (the slug at the end of unsplash.com/photos/<id>)
{ folder: "11-villa-borghese", name: "Villa Borghese", source: "unsplash", id: "AbC123XyZ" },

// Commons: exact File: title + a fallback search query (used if the title was renamed)
{ folder: "13-galleria-borghese", name: "Galleria Borghese",
  source: "commons", file: "Galleria Borghese Rome 2011.jpg",
  query: "Galleria Borghese Rome facade museum" },
```

Rules that keep it wired to the app correctly:
- `name` **must exactly match** the catalogue name from step 1 (accents, Greek, parens
  and all) — it's the key in the generated image map.
- `folder` **must match** the folder slug from step 1.
- Whole-city mode → write/replace the full `activities` array for the city.
- Specific-activities mode → make sure the file contains correct entries for the targets.
  Keeping the full list is fine; the engine only touches the folders you pass in step 4.

### 4. Run the engine to download + wire everything up

```bash
# Whole city (wipes the city's activity folders, keeps cover.*, rebuilds all):
node scripts/gen-city-images.mjs --city=<id>

# Specific activities only (leaves all other activities' images/credits intact):
node scripts/gen-city-images.mjs --city=<id> --only=<folder1>,<folder2>
```

`--only` takes the ASCII `folder` slug(s), comma-separated — robust even when names
contain accents/Greek. The engine downloads each image to
`public/destinations/<id>/<folder>/1.<ext>`, rewrites the manifest +
`activityImages.generated.ts`, and writes credits to
`public/destinations/<id>/_credits.json` and `doc/<id>-activity-image-sources.md`.

### 5. Verify and report

- Check the console for any `✗` lines (a pick that failed to download) and re-run, or fix
  that entry's `file`/`id`/`query` and re-run `--only=<that-folder>`.
- Confirm the credits files were written and that every Commons image has a real author +
  licence (not "Unknown"/"see file page"). If attribution is missing, the pick is not
  safe to use — replace it.
- Tell the user: how many images installed, the source split (Unsplash vs Commons), any
  substitutions you noted, and where the credits live.

## Legal guardrails (do not compromise these)

- **Only Unsplash and Wikimedia Commons.** Never Google Images, stock sites, social media,
  official-site photos, or any image without a clear free licence — even if it looks
  perfect. Legality and correct credit outrank accuracy.
- **Commons attribution is mandatory** and is captured automatically; never strip or fake
  it. If the API can't resolve an author/licence, choose a different file.
- Keep the recorded provenance honest — if you substitute a representative image, say so
  in `note:`.
