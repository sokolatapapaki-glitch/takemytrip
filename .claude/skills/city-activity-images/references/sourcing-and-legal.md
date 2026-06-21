# Sourcing images legally + finding the exact id/title

The whole point of this pipeline is **accurate AND legal**. Two sources are allowed,
both verified free for this use. Nothing else is permitted — not Google Images, not
stock sites, not an attraction's own website, not social media, not AI-generated stand-ins
unless the user explicitly asks. If you can't find a good image in these two sources,
substitute a representative one (with a `note:`) rather than break the rule.

## Source A — Unsplash (preferred for landmarks)

- **Licence:** Unsplash License — free for commercial use, **no attribution legally
  required.** We still record the photographer for provenance (done automatically).
- **Best for:** famous landmarks, building exteriors, skylines, beaches, parks, squares —
  anything photogenic and widely shot.
- **How to get the id you put in the curated file:**
  1. Find the photo on `https://unsplash.com`. Confirm it actually shows the activity.
  2. The page URL looks like
     `https://unsplash.com/photos/a-cathedral-at-dusk-EUed6ZoHYfg`.
     The **id is the last hyphen-delimited chunk**: `EUed6ZoHYfg`.
  3. Use: `{ folder, name, source: "unsplash", id: "EUed6ZoHYfg" }`.
- Verify it's a real, current photo page before trusting the id — a 404 or a search/topic
  URL is not a photo id. When unsure, open the page and read the description.

## Source B — Wikimedia Commons (for what Unsplash lacks)

- **Licence:** various free licences (CC-BY, CC-BY-SA, public domain…). **Attribution is
  required.** The engine fetches the author + licence from the Commons API and writes them
  into `_credits.json` and `doc/<id>-activity-image-sources.md`, so credit is handled — but
  only if the file resolves. If the author comes back "Unknown" or licence "see file page",
  treat the pick as unsafe and choose another file.
- **Best for:** museums, branded/ticketed attractions, interiors, local or niche sights,
  and anything Unsplash doesn't cover accurately.
- **How to get the `file` title:**
  1. Find the file page on `https://commons.wikimedia.org`. Confirm it depicts the activity.
  2. Copy the title exactly as shown after `File:` — e.g. `Casa Batlló 01.jpg`
     (spaces, capitalization, and extension as-is; `.JPG` vs `.jpg` matters).
  3. Always add a `query:` fallback — a short, specific search ("Place Name City facade")
     so the engine can still find a good image if the exact title was renamed/deleted.
  4. Use: `{ folder, name, source: "commons", file: "Casa Batlló 01.jpg",
     query: "Casa Batlló Barcelona dragon roof facade" }`.
- The engine already skips logos, icons, flags, coats of arms, seals, diagrams, locator
  maps, and non-bitmap files — but still pick a real, representative photo, not a sign,
  ticket, or detail shot.

## Verifying accuracy (the failure mode this skill prevents)

The auto-fetcher's mistake was trusting a search's top hit. Don't repeat it:

- Read the file/photo description and check it names the right place.
- When the right subject is ambiguous (common names, museums with similar names, places
  that share a name across cities), **view the candidate image** before committing:
  fetch the thumbnail and open it with the image-reading tool, or open the page. A few
  seconds of looking beats installing the wrong building.
- Cross-check the obvious distinguishing features (the dragon roof, the specific facade,
  the known silhouette). If you can't confirm it's the right place, it's the wrong pick.

## When no accurate free photo exists

Some activities (a 4-D cinema, an escape room, a specific branded tour) simply have no
good free photo. Then:

- Choose the closest legitimate representative image from an allowed source (e.g. the
  building it's housed in, the wider attraction, the relevant landmark), and
- Add a `note:` on that entry explaining the substitution, e.g.
  `note: "No free photo of the venue exists; the host building is used. Swap if a licensed photo is obtained."`

That keeps the result honest and legal. Never pull from a disallowed source to force a
pixel-perfect match.
