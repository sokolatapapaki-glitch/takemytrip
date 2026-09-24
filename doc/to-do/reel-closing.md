# Reel Closing — Plan Preview + Globe Outro

Branch: `claude/travel-plan-globe-animation-ssjz6j`
Status: **implemented** — see `reels/README.md` §The ending for the shipped
system. §10 lists where the build deviated from this plan.
Scope: **reels only.** No user-visible change to the app. The one app-side
addition (§3) is inert unless a reel fires it.

Builds on the shipped reel pipeline — see `reels/README.md` and
`doc/to-do/social-media-reels.md`.

---

## 1. What changes

1. **Remove the top title** from every reel (`ΦΤΙΑΞΕ ΤΟ ΤΑΞΙΔΙ ΣΟΥ ΣΕ
   ΔΕΥΤΕΡΟΛΕΠΤΑ`). Bottom captions stay.
2. **Final plan preview.** After the last filter beat, the whole trip appears as
   a clean, static page — only the plan: no filters, no buttons, no navbar, no
   map. Held **3 s**.
3. **Globe outro.** The preview slides up and out of frame, revealing behind it:
   - a light orange/brown background with a faint particle pattern,
   - a 2D globe rotating,
   - an airplane flying an arc across the **front** of the globe, left → right,
     over half a rotation, leaving an **orange dotted trail**,
   - **TAKE MY TRIP** above the globe, each word popping in one at a time,
   - **ΟΡΓΑΝΩΣΕ ΤΟ ΤΑΞΙΔΙ ΜΕ 3 ΚΛΙΚ!** below the globe — longer phrase, smaller
     letters.

   All text: bold, white, all caps, black shadow.

## 2. Timeline of the ending

```
… last filter beat  ─┬─ caption fades out (350 ms)
                     │
PREVIEW              ├─ clean plan on screen, static ............ 3000 ms
                     │
SLIDE                ├─ preview slides up, easeInOut .............  700 ms
                     │   globe scene is already underneath, revealed as it goes
                     │
OUTRO                ├─ globe rotating the whole time
                     ├─ "TAKE" pop ─ "MY" pop ─ "TRIP" pop  (150 ms apart, 300 ms each)
                     ├─ plane flight, left limb → right limb ...... ~3000 ms
                     ├─ tagline fades/rises in after "TRIP" ......  400 ms
                     └─ hold on the finished frame ............... ~1000 ms
```

Ending ≈ 3.0 + 0.7 + ~4.0 ≈ **7.7 s**. Every number is a knob in
`reels/config.ts` (`OUTRO_DEFAULTS`), not hard-coded in the scene.

⚠️ The current flow is ~16 s, so the full reel becomes ~24 s — over the 5–20 s
goal. See §9, question 1.

## 3. The plan preview (reel-only view)

### How the reel asks for it

A new step kind in the DSL:

```ts
| { kind: "preview"; holdMs?: number }   // default 3000
```

`capture.ts` handles it by dispatching a DOM event in the page:

```ts
await page.evaluate(() => window.dispatchEvent(new Event("reel:preview")));
```

Then it holds for `holdMs` frames like a `hold` step, and hides the synthetic
cursor for the rest of the reel. The bottom caption stack fades out on this
step (a `captionEvents` entry with empty text).

### What the app renders

A new client component `app/components/ActivityCombinations/ReelPlanPreview.tsx`,
mounted by `index.tsx` next to `TripPlan`, given the same `trip` + `cityName` +
`dateLabel`.

- It renders **nothing** until it receives `reel:preview`. No user can trigger
  it; it adds no UI, no route, no styling to the normal page.
- On the event it renders a `fixed inset-0 z-[100] bg-white` layer over
  everything (navbar included), marked `data-reel="plan-preview"`.
- Content: city + dates heading, then one block per day — day name, and for
  each item `start–end · name` (lunch rows styled muted). Same data
  `tripPrint.ts` already walks (`trip.days[].plan.items`), so it reuses
  `formatTime` and `DAYS`, not the TripCard UI.
- Colours follow the house 60/30/10: white page, `green-500` day headers / time
  column, `orange-500` only as a thin accent (e.g. the day-number chip). No
  buttons, no filters, no map, no prices.

### Fit: one column, or two split by day

Viewport is 432×768 CSS px (the reel's phone). The component lays out, measures,
then decides — all in one `useLayoutEffect`, so the first painted frame is
already final:

1. Render single column. If total height ≤ viewport → done.
2. Otherwise switch to **two columns** (left / right). Days are assigned to
   columns **whole** — a day is never broken across columns. Assignment is the
   contiguous split that best balances column heights (days 1..k left,
   k+1..n right), so reading order stays left-then-right.
3. If the taller column still overflows, scale the whole layer down with
   `transform: scale(s)` (origin top-centre) until it fits, floor at ~0.7. Below
   that the reel fails loudly rather than rendering unreadable text.

For the demo (Ρώμη, 3 days) expect step 2: days 1–2 left, day 3 right, or 1
left and 2–3 right, whichever balances.

## 4. Remove the top title

- `Reel.title` becomes optional and both reels drop it (`TITLE` export goes).
- `overlay/template.html` keeps the `#title` element but renders it only when a
  title is present, so a future reel can still opt in.
- `Timeline.title` → `title?: string`.
- The top scrim in `overlay.css` is only drawn when there is a title.

## 5. The outro scene

### Rendered as its own pass

The outro is not the app — it is a scene. It gets its own standalone page,
rendered deterministically like PASS B (every frame is a pure function of `t`,
no CSS animations, no wall clock):

```
reels/outro/
  template.html     the scene: background, globe, plane, trail, text
  outro.css         layout + type (reuses the bundled Noto Sans Bold)
  scene.ts          per-frame state → DOM/canvas (globe, plane, trail, text)
  render.ts         PASS D — screenshot every outro frame, opaque, 1080×1920
  world.json        land geometry (see "Globe" below)
```

The pipeline becomes:

```
PASS A  capture      app frames, now ending on the preview hold
PASS B  overlay      captions (no title), alpha frames
PASS C  composite    camera + captions → frames for the main part
PASS D  outro        the slide + globe scene, opaque frames
        encode       main frames + outro frames concatenated → one H.264 MP4
```

### The slide

PASS D's first frames contain the **last PASS A frame** (the plan preview) as a
full-bleed `<img>` on top of the scene. Over `slideMs` it translates from
`y = 0` to `y = −1920` with easeInOut. Because the globe scene is drawn beneath
it from frame 0, the reveal is continuous — the preview "slides to the top and
the globe is behind it", with no cut.

A soft shadow on the bottom edge of the sliding preview sells it as a card
lifting away.

### Background

- Base: light orange/brown sand, e.g. `#F2D6B3` → `#E9C49A` vertical gradient.
- Particles: ~120 small dots (2–5 px), seeded PRNG (so every render is
  identical), white and dark-brown mixed, opacity 0.08–0.18, laid out on a
  jittered grid so it reads as a *pattern* rather than noise. They drift
  upward very slowly (~20 px over the whole outro) — alive, but faint.

### Globe (2D)

- `d3-geo` **orthographic** projection on a `<canvas>`: flat-shaded ocean disc,
  land polygons, a thin darker limb outline. It reads as a 2D illustration, not
  a 3D render.
- Land data from `world-atlas` (110m, ~100 KB) converted once via
  `topojson-client` into `reels/outro/world.json`. Both are **devDependencies**
  used only by the reel toolchain — nothing enters the Next bundle.
- Colours: ocean `green-500`-family tint or a soft blue (§9, question 3), land
  `green-500`, limb a darker shade.
- Rotation: the projection's `rotate([λ, −15])` with λ advancing linearly with
  `t`; it keeps turning through the final hold.
- Size: ~720 px diameter, centred slightly below the vertical middle so the
  headline has room above.

### Airplane + trail

- The plane is a small white SVG airplane with a dark outline and a subtle
  shadow, sized ~64 px.
- Path: an arc over the **front** of the globe, from the left limb to the right
  limb, sitting a little *above* the surface (radius × 1.08) so it reads as
  flying, not crawling. Parameterised by `u ∈ [0, 1]`, eased.
- During the flight the globe rotates half a turn (180°) in the same direction,
  so the plane visibly "travels around half the globe".
- The plane is rotated to the path tangent every frame; it shrinks slightly and
  fades as it reaches the right limb, then disappears behind the globe.
- **Trail:** orange-500 (`#f97316`) dots dropped along the path behind the
  plane at a fixed spacing — a dotted/"split points" line. The trail is drawn
  from path positions, so it stays sharp and deterministic. Dots near the
  plane are full opacity; older ones fade slightly. The trail remains visible
  after the plane is gone, as the "route" of the final frame.

### Text

- Style for both lines: Noto Sans **Bold**, white, uppercase, black shadow
  `text-shadow: 0 4px 0 #000, 0 6px 18px rgba(0,0,0,.45)` (a hard offset
  shadow plus a soft one — reads on the pale background at phone size).
- **TAKE MY TRIP** — above the globe, ~120 px. Each word pops in separately:
  scale `0 → 1.15 → 1` with a quick overshoot and opacity `0 → 1`, 300 ms each,
  150 ms stagger. Starts as the slide finishes.
- **ΟΡΓΑΝΩΣΕ ΤΟ ΤΑΞΙΔΙ ΜΕ 3 ΚΛΙΚ!** — below the globe, ~56 px, may wrap to two
  lines. Rises 24 px while fading in, after the last headline word lands.
- Greek uppercase drops accents, so `text-transform: uppercase` is correct.
- Existing font guard already checks Greek coverage; extend it to Latin for
  the English headline.

## 6. DSL / type changes

```ts
// types.ts
export type Step = … | { kind: "preview"; holdMs?: number };

export type Outro = {
  headline: string[];        // ["TAKE", "MY", "TRIP"] — one pop per entry
  tagline: string;           // "ΟΡΓΑΝΩΣΕ ΤΟ ΤΑΞΙΔΙ ΜΕ 3 ΚΛΙΚ!"
  slideMs?: number;          // 700
  flightMs?: number;         // 3000
  endHoldMs?: number;        // 1000
};

export type Reel = {
  …
  title?: string;            // now optional; both reels omit it
  outro?: Outro;             // omitted → reel ends where the steps end
};
```

Both `create-trip` and `create-trip-zoom` get `preview()` as the last step and
the same `outro`. The zoom reel's camera already returns to scale 1 before the
end, so the preview is captured full-frame.

## 7. Files touched

| File | Change |
|---|---|
| `reels/types.ts` | `preview` step, `Outro`, optional `title` |
| `reels/actions.ts` | `preview()` builder |
| `reels/config.ts` | `OUTRO_DEFAULTS`, preview hold default |
| `reels/capture.ts` | handle `preview` (dispatch event, hide cursor, caption clear) |
| `reels/overlay/template.html`, `overlay.css` | title only if present; top scrim only if title |
| `reels/outro/*` | **new** — PASS D scene + renderer |
| `reels/compose.ts` | concat main + outro frames before encoding |
| `reels/render.ts` | run PASS D when `reel.outro` is set; `--reuse-frames` also reuses PASS D inputs |
| `reels/reels/create-trip.ts`, `create-trip-zoom.ts` | drop title, add `preview()`, add `outro` |
| `app/components/ActivityCombinations/ReelPlanPreview.tsx` | **new** — the reel-only clean plan |
| `app/components/ActivityCombinations/index.tsx` | mount `ReelPlanPreview` |
| `package.json` | devDeps `d3-geo`, `topojson-client`, `world-atlas` |
| `reels/README.md` | document the preview step, PASS D, the outro |

Before touching the app file, check `node_modules/next/dist/docs/` per
`AGENTS.md` — the component is a plain client component with a window event
listener, so no Next API is expected to be involved.

## 8. Phases

- [x] **P0 — Title removal.** Optional `title`, overlay conditional, both reels
      render without it.
- [x] **P1 — Preview.** `ReelPlanPreview` + `preview` step; verify one/two-column
      fit and the day-boundary split on the Ρώμη 3-day plan (screenshot).
- [x] **P2 — Outro scene.** Static background + particles + globe + text in
      `reels/outro/`, previewed as single PNGs at chosen `t`s.
- [x] **P3 — Motion.** Rotation, plane arc + dotted trail, word pops, tagline,
      the slide over the last PASS A frame.
- [x] **P4 — Pipeline.** PASS D wired into `render.ts` / `compose.ts`; render both
      reels end to end; README.

## 9. Open questions

1. **Length.** The reel goes from ~16 s to ~24 s. OK, or should the flow be
   trimmed (e.g. two filter beats instead of three, shorter settles) to land
   near 20 s?
2. **Preview heading.** Show "ΡΩΜΗ · 3 ΗΜΕΡΕΣ" + dates at the top of the
   preview, or strictly the days only?
3. **Globe colours.** Land `green-500` on a soft blue ocean (realistic), or
   land `green-500` on a pale cream ocean (matches the brand palette, less
   "earth")?
4. **Plane style.** Plain white silhouette, or a white plane with an
   orange-500 accent (tail/wings) to tie in with the trail?
5. **Music / sound.** Still silent — want a whoosh on the slide or a pop on
   each headline word? (Adds an audio stage to `compose.ts`.)

Defaults taken for the build (each is a one-line change): heading shown
(city · days · dates); soft blue ocean with green-500 land; white plane with
an orange outline; still silent; length left at ~24 s.

## 10. Where the build deviated

1. **No `world.json` committed.** `scene.ts` reads `world-atlas/land-110m.json`
   straight from `node_modules` and converts it with `topojson-client` at
   render time — no generated file to keep in sync.
2. **The globe is computed in Node, not in the page.** `scene.ts` runs
   `d3-geo` and hands the page ready SVG path strings per frame; the page is
   loaded from `file://`, where ES-module imports from `node_modules` are
   blocked. This also keeps the page a pure "write what you are given".
3. **The preview is portalled to `<body>`.** Rendered in place it sat in a
   parent stacking context under the sticky navbar, whatever its z-index.
4. **The outro is appended in the same ffmpeg graph** (`concat` filter) as
   the main part, rather than encoded separately and joined — one encode, no
   seam.
5. **`server.ts` now stops the whole process group.** It used to kill only the
   `npx` wrapper, leaving `next-server` on the port; the next render then
   "reused" it and captured a stale build.
