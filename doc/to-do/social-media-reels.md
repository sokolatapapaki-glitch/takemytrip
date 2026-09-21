# Social Media Reels — Implementation Plan

Branch: `claude/social-reels-implementation-tt51s2` (from `mediaPosts`)
Status: **implemented** — see `reels/README.md` for the shipped system. This
file is kept as the design record; §13 below lists where the build deviated
from the plan and why.

Automated generation of 5–20s vertical reels that show, on a mobile-sized
screen, how a user creates a trip: a synthetic mouse moves, clicks real UI, and
Greek captions narrate each action.

---

## 1. Goals

- Produce 1080×1920, 30fps, bare-viewport MP4s (no phone mockup chrome).
- Drive the **real app** — real clicks, real routing, real animations.
- Define a reel's content declaratively in a **TypeScript reel file**, so reels
  are reusable, diff-able and type-checked.
- Support **zoom/pan** as a camera effect (e.g. zoom onto the cursor).
- Render a **caption stack** (current + previous) and a **top title**.
- First deliverable: one flow (home → create trip → select 3 filters), rendered
  **twice** — once with no zoom, once zooming only during filter selection.

## 2. Architecture

Three passes. The split exists for one reason: **the camera zoom must not scale
the captions.** If captions were burned into the app capture, zooming would
blow them up too.

```
PASS A — capture        Playwright drives the real app in a 2160×3840 viewport
  (app frames)          (deviceScaleFactor 2), injects a cursor overlay, and
                        writes one PNG per frame.

PASS B — overlay        A standalone transparent-background HTML page renders
  (caption frames)      the caption stack + title, screenshotted per frame with
                        alpha (omitBackground: true), at 1080×1920.

PASS C — composite      ffmpeg applies the camera (scale+crop from the 2× source
  (ffmpeg)              → 1080×1920), then overlays the caption frames, then
                        encodes H.264 yuv420p.
```

### Why capture at 2×

The camera zoom is a crop, so zooming into a 1080-wide source would upscale and
soften the image. Capturing at 2160×3840 means a 2.0× zoom still crops
1080×1920 of *real* pixels — pixel-perfect at the zoom level we care about.
Cost is ~4× the bytes per frame, which is fine at these durations.

### Why per-frame screenshots instead of Playwright video

`page.video` records WebM at an uncontrolled, variable frame rate; it drops
frames under load and cannot be locked to exactly 30fps. A deterministic
screenshot loop gives exactly `duration × 30` frames, byte-identical across
runs — which matters when you re-render a reel after tweaking one caption.

For a 20s reel that is 600 frames; at ~60–100ms per screenshot that is roughly
40–60s of capture. Acceptable for an offline generator.

**Determinism caveat (real risk, see §9):** the app's CSS animations (hero
entrance pops, dropdown transitions) run on wall-clock time, so a naive
screenshot loop samples them unevenly. The fix is to step them explicitly:

```ts
// advance every running CSS animation to the exact frame time
await page.evaluate((t) => {
  document.getAnimations().forEach((a) => { a.currentTime = t; });
}, frameIndex * (1000 / 30));
```

Combined with `page.clock` for JS timers. If a specific animation resists this,
the fallback is a real-time CDP `Page.startScreencast` capture normalized by
ffmpeg `fps=30` — lower fidelity, no code changes to the app.

## 3. Directory layout

```
reels/
  README.md
  types.ts              Reel, Step, Caption, CameraKeyframe type definitions
  actions.ts            reusable step builders: goto, click, type, wait, pause
  cursor.ts             synthetic cursor overlay: injection, easing, click pulse
  camera.ts             zoom keyframe resolution → per-frame crop rectangles
  capture.ts            PASS A — Playwright driver, frame loop, animation stepping
  overlay/
    template.html       transparent caption + title page
    overlay.css         white bold + black stroke, Greek, slot geometry
    render.ts           PASS B — per-frame alpha screenshots
  compose.ts            PASS C — ffmpeg invocation
  render.ts             CLI entry: `npm run reel -- <name>`
  reels/
    create-trip.ts           v1 — no zoom
    create-trip-zoom.ts      v2 — zoom during filter selection only
  out/                  generated MP4s + frame caches — gitignored
```

## 4. The reel DSL

A reel is a typed TS file. Captions and camera moves attach to steps, so the
timeline is derived rather than hand-synced.

```ts
export type Step =
  | { kind: "goto";  url: string;                    caption?: Caption }
  | { kind: "click"; target: string; settleMs?: number; caption?: Caption }
  | { kind: "type";  target: string; text: string;   caption?: Caption }
  | { kind: "wait";  ms: number;                     caption?: Caption }
  | { kind: "hold";  ms: number };   // let the UI breathe, no caption change

export type Caption = {
  text: string;            // 2–4 Greek words, uppercased at render
  holdMs?: number;         // default 1200
};

export type CameraKeyframe = {
  at: number;              // step index this keyframe starts on
  scale: number;           // 1 = full frame, 2 = 2× zoom
  target: string | "cursor";
  durationMs: number;      // transition length into this scale
  easing?: "easeInOut" | "linear";
};

export type Reel = {
  name: string;
  title: string;           // 4–8 Greek words, top of frame
  viewport: { width: 1080; height: 1920 };
  fps: 30;
  steps: Step[];
  camera?: CameraKeyframe[];   // omitted → static full-frame camera
};
```

### Example — v1, no zoom

```ts
export const createTrip: Reel = {
  name: "create-trip",
  title: "ΦΤΙΑΞΕ ΤΟ ΤΑΞΙΔΙ ΣΟΥ ΣΕ ΔΕΥΤΕΡΟΛΕΠΤΑ",
  viewport: { width: 1080, height: 1920 },
  fps: 30,
  steps: [
    { kind: "goto",  url: "/",                      caption: { text: "ΑΡΧΙΚΗ ΣΕΛΙΔΑ" } },
    { kind: "click", target: "[data-reel=destination]", caption: { text: "ΔΙΑΛΕΞΕ ΠΡΟΟΡΙΣΜΟ" } },
    { kind: "click", target: "[data-reel=search]",  caption: { text: "ΑΝΑΖΗΤΗΣΗ ΤΑΞΙΔΙΟΥ" } },
    { kind: "click", target: "[data-reel=filter-1]", caption: { text: "ΠΡΩΤΟ ΦΙΛΤΡΟ" } },
    { kind: "click", target: "[data-reel=filter-2]", caption: { text: "ΔΕΥΤΕΡΟ ΦΙΛΤΡΟ" } },
    { kind: "click", target: "[data-reel=filter-3]", caption: { text: "ΤΡΙΤΟ ΦΙΛΤΡΟ" } },
    { kind: "hold",  ms: 900 },
  ],
};
```

### Example — v2, zoom only on filters

Identical `steps`, plus:

```ts
camera: [
  { at: 3, scale: 1.8, target: "cursor", durationMs: 450, easing: "easeInOut" },
  { at: 6, scale: 1.0, target: "cursor", durationMs: 450, easing: "easeInOut" },
]
```

So the camera pushes in as filter selection starts (step 3) and pulls back out
after the third filter (step 6). Between keyframes it tracks the cursor with a
damped follow so it does not jitter on every pixel of mouse movement.

## 5. Cursor overlay

The real mouse pointer is not captured in screenshots, so the cursor is drawn.

- Injected via `page.addInitScript` as a fixed-position SVG in a top-layer div,
  `pointer-events: none`, so it never intercepts the clicks it illustrates.
- Movement between targets uses an ease-in-out curve over a configurable
  duration (default ~500ms), with a slight arc rather than a straight line —
  straight-line cursor motion reads as robotic on video.
- Click is a two-part tell: a quick scale-down of the cursor plus an expanding
  ring pulse, fired one frame *before* the real `page.click`, so the visual
  lands with the UI reaction.
- Position is advanced per frame by the capture loop, never by wall clock.

## 6. Caption system

Rendered in PASS B, on a transparent page, so the camera never scales them.

**Top title.** 4–8 Greek words, bottom-weight smaller than captions, bold,
white with black stroke, horizontally centered, fixed at the top with safe-area
padding. Static for the whole reel.

**Caption stack.** Bottom center, two visible slots:

| Slot | Content  | Size | Opacity |
|------|----------|------|---------|
| A (upper) | current  | 100% | 1.0 |
| B (lower) | previous | ~72% | ~0.45 |

Transition when a new caption arrives (~350ms, ease-out):

1. New text enters slot A, fading up from below.
2. The outgoing current slides A → B, shrinking and fading as it goes.
3. The outgoing previous slides down out of slot B and fades to 0.

Only two are ever visible — nothing upcoming is shown.

**Typography.** White fill, black stroke via `-webkit-text-stroke` plus a
`paint-order: stroke fill` so the stroke sits outside the glyph, bold weight,
uppercase Greek. Greek uppercase drops accents (ΑΝΑΖΗΤΗΣΗ, not ΑΝΑΖΉΤΗΣΗ), so
`text-transform: uppercase` in CSS is correct here and no manual stripping is
needed.

**Font.** Must be bundled, not system-resolved — a headless container may not
have a Greek-capable font, and a silent tofu fallback would ruin a batch. Plan
is to vendor a variable font with Greek coverage (Noto Sans or Roboto) into
`reels/overlay/fonts/` and `@font-face` it locally.

## 7. App changes required

The app currently has **zero `data-testid` attributes** (39 `aria-label`s, all
Greek). Selecting by Greek visible text would make reels break on every copy
tweak, so:

- Add stable `data-reel="..."` attributes to exactly the elements reels drive:
  destination field, search button, and the filter controls.
- These are inert attributes — no behavior change, no styling impact, no
  bundle-size concern.

Elements identified so far:

| Hook | Element | File |
|------|---------|------|
| `data-reel=destination` | destination field | `app/start/components/StartTripSearch.tsx` |
| `data-reel=search` | Αναζήτηση button | `app/start/components/StartTripSearch.tsx:417` |
| `data-reel=filter-*` | filter controls | `app/components/ActivityCombinations/FilterSidebar.tsx` |

**Open item:** the exact three filters to click still need to be picked. On a
1080-wide mobile viewport the planner's filters may live behind
`AdvancedFiltersModal` rather than the sidebar, which would add an extra
"open filters" click to the flow. To confirm against the running app.

## 8. Tooling and config

- `@playwright/test` (or bare `playwright`) as a devDependency, Chromium only.
- ffmpeg: prefer `ffmpeg-static` so renders do not depend on a system install.
- `npm run reel -- create-trip` → `reels/out/create-trip.mp4`.
- Reels render against `next dev` on a fixed port; the runner starts it if it
  is not already up, and waits for readiness before frame 0.
- `.gitignore`: add `/reels/out/`. Frame caches and MP4s never get committed.

Encoding settings: `-c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -r 30`,
plus `+faststart`. yuv420p is non-negotiable — Instagram and TikTok reject or
silently re-encode other pixel formats.

## 9. Risks

| Risk | Mitigation |
|------|-----------|
| CSS animations not steppable via `getAnimations()` | Fall back to real-time screencast + `fps=30` normalization |
| Zoom softness at high scale | Capture at 2× (§2); cap zoom at 2.0 |
| Greek font missing in headless | Bundle the font locally, assert glyph coverage on first run |
| Flow changes break selectors | `data-reel` hooks are stable by contract; a reel that cannot find a hook fails loudly rather than rendering a wrong video |
| Capture time grows with reel length | Frames are cached per reel; only re-composite when captions/camera change |

## 10. Phases

- [x] **P0 — Hooks.** `data-reel` attributes added; the real mobile filter flow confirmed against the running app (it goes through the drawer, not the sidebar — see §13.3).
- [x] **P1 — Capture.** `reels/capture.ts`: Playwright driver, cursor overlay, deterministic frame loop.
- [x] **P2 — Overlay.** `reels/overlay/`: caption stack + title, alpha frames, ffmpeg composite. Output: **v1 `create-trip`**.
- [x] **P3 — Camera.** `reels/camera.ts`: zoom keyframes, damped cursor tracking, crop math. Output: **v2 `create-trip-zoom`**.
- [x] **P4 — Polish.** `npm run reel`, `reels/README.md`. The second *flow* is not built: v2 reuses v1's steps by import, which proves the camera is reusable but not the step vocabulary. Left as the next obvious piece of work.

## 11. Decisions already made

- Branch `social-media`, reusing the flattened root layout (app at repo root).
- Pipeline: Playwright capture + ffmpeg post.
- Reel definition: TypeScript files.
- Output: 1080×1920, 30fps, bare viewport, no phone frame.

## 12. Still open

All four were settled during the build; change any of them in one line.

1. **Which three filters** → the three lower options of **Χρόνος** (έως 3ω / 6ω /
   9ω), because that is the only option group the plan page still shows — see
   §13.3. Addressed by index (`filterHook(1, 0..2)`), never by label.
2. **Destination** → **Ρώμη**, fixed. It has the fullest activity catalogue, so
   the itinerary the reel produces is dense rather than thin. Combined with the
   pinned `REEL_EPOCH` clock, the reel is reproducible.
3. **Music** → still silent. Adding it is a new ffmpeg input, not a change to
   any existing pass.
4. **Duration** → ~16s, inside the 5–20s goal. The 12–14s estimate was for the
   7-step sketch above; the shipped flow is 15 steps, because typing the
   destination, dismissing the picker and opening/closing the filter drawer are
   all beats the sketch had not yet accounted for. Retune from `DEFAULTS` in
   `reels/config.ts`.

---

## 13. Where the build deviated from this plan

Each of these was forced by the running app, not chosen for convenience.

1. **CSS viewport is 432×768, not 1080×1920.** 1080 *real* pixels is the output
   width; 1080 *CSS* pixels is a desktop layout — at that width Tailwind's
   `lg:` breakpoints fire and the plan page renders its desktop sidebar, not
   the phone flow the reel is about. 432×768 is a phone at exactly 9:16, and
   `deviceScaleFactor: 5` lands back on the planned 2160×3840 source.

2. **Reels render against `next build` + `next start`, not `next dev`.** In dev,
   React StrictMode's double-invoked effects stop the homepage typewriter ever
   finishing, so `destTypingDone` never fires and the destination field never
   becomes the writable input the flow types into. The dev server's HMR socket
   also injects its own timers. `--dev` opts back in.

3. **The mobile filter flow does go through the drawer** (§7's open item), so
   the flow has an extra "open filters" click and a "Έγινε" to close. And the
   drawer shows only ONE option group: `Κόστος` is hidden while
   `HIDE_ACTIVITY_PRICES` is on, leaving `Χρόνος` plus a `<select>` and a
   checkbox. Hence §12.1.

4. **Per-frame ffmpeg for the camera.** ffmpeg cannot vary a crop rectangle
   across a batch without an expression hundreds of branches deep, and
   `zoompan` rounds its offsets to integers and jitters. So a camera reel
   crops each frame in its own small ffmpeg run (8 at a time) and then encodes
   once. A reel with no camera still takes the single-pass path.

5. **Scrims were added to the caption layer.** The app's surfaces run from a
   dark hero photo to a white filter drawer; a black stroke alone is not enough
   for white text on white. They are painted in PASS B, so the camera cannot
   scale them either.

6. **The Greek font is fetched, not committed** (`npm run reel:font`). It is
   545 KB of binary; PASS B refuses to render without it, and the guard checks
   real glyph coverage rather than just "a family resolved".

7. **Two extra hooks** beyond §7's table: `hero-title` (the homepage `<h1>`, a
   natural "tap outside" target for dismissing the destination picker, which
   stays open on its optional accommodation step) and `close-hint` (the plan
   page's on-load hint, which otherwise covers the Φίλτρα button).
