# Reels

Automated 1080×1920 / 30fps vertical reels that show, on a phone-sized screen,
how someone actually creates a trip in this app. A synthetic cursor moves,
clicks the **real** UI, and Greek captions narrate each action.

```bash
npm run reel:font                    # once — fetches the bundled Greek font
npm run reel -- create-trip          # → reels/out/create-trip.mp4
npm run reel -- create-trip-zoom     # the same flow, with a camera move
npm run reel -- --all
```

| flag | what it does |
|---|---|
| `--all` | render every reel |
| `--no-build` | skip `next build` (the app is already built) |
| `--dev` | render against `next dev` instead of a production build — see [The app under the camera](#the-app-under-the-camera) |
| `--reuse-frames` | skip PASS A and recomposite the cached capture. Seconds instead of a minute — use it while tuning captions or a camera move |
| `--keep-frames` | keep the intermediate caption/camera frames for inspection |

`npm run reel:check` typechecks the toolchain (it is excluded from the Next
build, so `next build` never sees it).

---

## Pipeline

Three passes. The split exists for exactly one reason: **the camera zoom must
not scale the captions.** If the captions were burned into the app capture,
zooming would blow them up too.

```
PASS A — capture        Playwright drives the real app in a 432×768 CSS
  capture.ts            viewport at deviceScaleFactor 5 (→ 2160×3840 real
                        pixels), injects a cursor overlay, and writes one
                        image per frame plus timeline.json.

PASS B — overlay        A standalone transparent-background page renders the
  overlay/render.ts     caption stack + title, screenshotted per frame with
                        alpha (omitBackground), at 1080×1920.

PASS C — composite      ffmpeg applies the camera (crop from the 2× source →
  compose.ts            1080×1920), overlays the caption frames, and encodes
                        H.264 yuv420p.
```

### Why capture at 2×

The camera zoom is a **crop**, so zooming into a 1080-wide source would upscale
and soften the picture. A 2160×3840 capture means a 2.0× zoom still crops
1080×1920 of *real* pixels. `MAX_ZOOM` in `config.ts` caps the zoom at exactly
that point; `capture()` refuses to run if the configured source is thinner than
2× the output.

### Why the CSS viewport is 432px, not 1080px

1080 **real** pixels is the output width; 1080 **CSS** pixels is a desktop
layout. At that width Tailwind's `lg:` breakpoints fire and the plan page
renders its desktop sidebar — not the phone flow a reel is supposed to show.
432×768 is a phone at exactly 9:16, and ×5 lands back on 2160×3840.

Both numbers are per-reel (`Reel.capture`), with the defaults in `config.ts`.

### Why per-frame screenshots instead of `page.video()`

`page.video` records WebM at an uncontrolled, load-dependent frame rate; it
drops frames and cannot be locked to exactly 30fps. A deterministic screenshot
loop gives exactly `duration × 30` frames — which matters when you re-render a
reel after tweaking one caption.

Determinism has three parts, all in `capture.ts`:

1. **`page.clock`** — JS timers (and `requestAnimationFrame`) only advance when
   the loop says so, and wall clock is pinned to `REEL_EPOCH`. Without the pin
   the plan page's real dates would re-render the reel differently every day.
2. **`__reel.step(dt)`** — every running CSS animation is paused and advanced by
   exactly one frame. The app's entrance pops and dropdown transitions run on
   wall-clock time, so a naive screenshot loop samples them unevenly.
3. **The cursor** is positioned per frame, never by a CSS transition.

If some future animation resists step 2, the documented fallback is a real-time
CDP `Page.startScreencast` capture normalised by ffmpeg `fps=30` — lower
fidelity, but no app changes.

### The app under the camera

Reels render against a **production build** (`next build` + `next start`), not
`next dev`. Two reasons, both found by trying:

- React StrictMode's double-invoked effects break the homepage's typewriter
  placeholder in dev — `destTypingDone` never fires, the destination field never
  becomes a writable input, and the flow a reel drives does not exist there.
- The dev server's HMR socket and error overlay inject their own timers and DOM,
  which is precisely the nondeterminism PASS A is built to avoid.

`--dev` opts back in for a quick loop when the reel being tuned touches neither.

---

## Writing a reel

A reel is a typed TS file in `reels/reels/`. Captions and camera moves attach to
steps, so the timeline is *derived* rather than hand-synced.

```ts
import { click, goto, hold, hook, type } from "../actions.js";
import type { Reel } from "../types.js";

export default {
  name: "my-reel",
  title: "ΤΟ ΤΙΤΛΟΣ ΜΟΥ",
  viewport: { width: 1080, height: 1920 },
  fps: 30,
  steps: [
    goto("/", "ΑΡΧΙΚΗ ΣΕΛΙΔΑ"),
    type(hook("destination-input"), "Ρώμη", "ΔΙΑΛΕΞΕ ΠΡΟΟΡΙΣΜΟ"),
    click(hook("search"), "ΑΝΑΖΗΤΗΣΗ"),
    hold(600),
  ],
} satisfies Reel;
```

Then register it in the `REELS` map in `render.ts`.

Every timing has a default (`DEFAULTS` in `config.ts`) — set one on a step only
where that beat wants a different rhythm. A caption's `holdMs` is a **minimum**:
if its step finishes sooner the renderer pads the frame, so a fast click never
produces an unreadable flash.

### Hooks

Reels address the app **only** through `data-reel` attributes. The app had zero
`data-testid`s and 39 Greek `aria-label`s; selecting by visible Greek text would
break every reel on a copy tweak. The hooks are inert — no behaviour, no
styling, no bundle-size concern — and stable by contract. A reel that cannot
find one **fails loudly** rather than rendering a plausible-looking wrong video.

| hook | element | file |
|---|---|---|
| `destination` | the whole destination field | `app/start/components/StartTripSearch.tsx` |
| `destination-input` | its writable input | `app/start/components/StartTripSearch.tsx` |
| `destination-option` + `data-reel-id` | a city row in the picker | `app/start/components/DestinationModal.tsx` |
| `hero-title` | the homepage `<h1>` — a natural "tap outside" target | `app/start/components/TripSearchHero.tsx` |
| `days` | the trip-length input | `app/start/components/StartTripSearch.tsx` |
| `search` | the Αναζήτηση button | `app/start/components/StartTripSearch.tsx` |
| `close-hint` | the plan page's on-load hint ✕ | `app/components/ActivityCombinations/index.tsx` |
| `open-filters` | the mobile/tablet Φίλτρα button | `app/components/ActivityCombinations/index.tsx` |
| `close-filters` | the drawer's Έγινε | `app/components/ActivityCombinations/index.tsx` |
| `filter-<f>-<o>` | one filter option | `app/components/ActivityCombinations/PerDayFilters.tsx` |
| `start-hour` | the day's start-time select | `app/components/ActivityCombinations/PerDayFilters.tsx` |
| `circular` | the circular-trip toggle | `app/components/ActivityCombinations/PerDayFilters.tsx` |

Filter options are addressed **by index** (`filterHook(1, 2)` → `filter-1-2`),
not by their Greek labels, so renaming an option can never move a hook. The
buttons also carry `data-reel-filter` / `data-reel-option` with the human names,
so a failure message says *which* control went missing.

Selectors always resolve to the **first visible** match. The plan page renders
the filter controls twice — the desktop sidebar and the mobile drawer — and only
one of them is on screen at a time.

### Which three filters

The plan page shows exactly one option group today: **Χρόνος**, the day's time
budget (3ω / 6ω / 9ω / 12ω). **Κόστος** exists in `DEFAULT_FILTERS` but is
hidden while `HIDE_ACTIVITY_PRICES` is on, and the remaining controls are a
`<select>` and a checkbox. So `create-trip`'s three filter beats are three
options of that one group — which on video reads as a traveller trying budgets
and watching the itinerary re-plan, rather than as three unrelated toggles.
When more groups come back, `filterHook(f, o)` addresses them with no other
change.

---

## The camera

```ts
camera: [
  { at: 9,  scale: 1.8, target: "cursor", durationMs: 450, easing: "easeInOut" },
  { at: 12, scale: 1.0, target: "cursor", durationMs: 450, easing: "easeInOut" },
]
```

`at` is a **step index**, not a timestamp, so re-timing a step never
desynchronises the camera. Between keyframes the camera tracks its target
through an exponential follow (`CAMERA_FOLLOW`); without the damping a 1.8×
zoom twitches on every pixel of cursor movement, which is far more distracting
on video than a lazy camera. The crop is clamped to the frame, so the camera
can never show the void past the edge of the app.

`camera.ts` resolves this to one crop rectangle per frame. `compose.ts` then
takes one of two paths:

- **no camera** → one ffmpeg run; the whole sequence is scaled 2160→1080 and the
  captions are overlaid in the same filter graph.
- **camera** → the crop changes every frame, and ffmpeg cannot vary a crop
  rectangle across a batch without an expression hundreds of branches deep. So
  each frame is cropped by its own small ffmpeg run (8 at a time), then the
  overlay+encode runs once over the result. Exact, and cheap enough offline.

---

## Captions

Rendered in PASS B on a transparent page, so the camera never scales them.
Nothing in `overlay/` animates: every transition is computed per frame in JS and
written as an inline style, so a frame is a pure function of its state.

- **Title** — 4–8 Greek words, pinned to the top with safe-area padding, static
  for the whole reel, deliberately smaller than the captions.
- **Caption stack** — bottom centre, two visible slots: the current line at full
  size, the previous one below it at ~72% and ~45% opacity. On a change the new
  line rises into slot A, the outgoing current slides A→B while shrinking, and
  the outgoing previous slides out below B. Nothing upcoming is ever shown.
- **Type** — white fill with a black `-webkit-text-stroke` and
  `paint-order: stroke fill`, so the stroke sits outside the glyph instead of
  eating into it. Greek uppercase drops accents (ΑΝΑΖΗΤΗΣΗ, not ΑΝΑΖΉΤΗΣΗ), so
  `text-transform: uppercase` is correct here with no manual stripping.
- **Scrims** — soft dark gradients top and bottom. The app's surfaces run from a
  dark hero photo to a white filter drawer, and white-on-white needs more than a
  stroke. They live in the caption layer, so the camera cannot scale them
  either.

Most frames are visually identical to the one before (a caption only moves
during its 350ms transition), so PASS B renders one screenshot per distinct
state and hard-links the rest — ~40 screenshots for a 15s reel instead of ~450.

### The font

`overlay.css` `@font-face`s **Noto Sans Bold from
`reels/overlay/fonts/`** — bundled, not system-resolved. A headless container
has no guaranteed Greek-capable font, and a silent tofu fallback would only be
noticed after a whole batch had been encoded.

The font is **not committed** (545 KB of binary npm can fetch on demand):
`npm run reel:font` puts it in place. PASS B refuses to render without it, and
the guard is real coverage, not just "a family resolved" — tofu boxes are all
one width, so a Greek string that measures the same as the same number of
notdef characters means the glyphs are missing.

---

## Output

`-c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -r 30 +faststart`.
**yuv420p is non-negotiable** — Instagram and TikTok reject or silently
re-encode anything else. No audio track: reels are silent today, and adding
music is a new ffmpeg stage rather than a change to any of this.

`reels/out/` is gitignored — MP4s and frame caches never get committed.
`reels/out/.frames/<name>/` holds the PASS A capture and `timeline.json`, which
is what `--reuse-frames` reads.

A ~16s reel is ~480 frames; capture runs at roughly 6–8 frames/second, so PASS A
is about a minute, and PASS B + C together are well under that.
