# 01 — Editor ⇄ planner sync, and Rome/Paris as normal destinations

**Goal:** Everything the editor (`editor/`) lets you set reaches the planner (`my-nextjs-app/`) correctly: archived activities disappear, real per-day opening hours, vibe scores and priority are honoured, and reviewed images (with their credits) are shown. Rome and Paris stop being hand-curated special cases: like the other 13 cities they are generated from `takemytrip/data/<city>.json`, with today's hand-tuned values carried into the JSON so plans don't regress. A design section covers the n8n workflow changes ("option 2") that make the incoming data reliable.

**Depends on / Blocks:** nothing. Blocks any further editor feature work, because it defines the shared JSON contract both apps rely on.

**Branch:** `updates` (layout: `my-nextjs-app/`, `takemytrip/`, `editor/` side by side). See §1 for the `mediaPosts` layout conflict.

---

## 0 — Decisions

### Confirmed by the user

| # | Decision |
|---|---|
| D1 | **Paris = the 22 activities in `paris.json`.** For the ones that also exist in today's planner Paris, the planner's hand-tuned values are carried into the JSON. The 4 planner-only entries (Notre-Dame & Île de la Cité, Latin Quarter food walk, Le Marais café & falafel, Macaron & pâtisserie tasting) are dropped. |
| D2 | **Rome's hand-tuned values move into `rome.json` as optional, editor-editable fields**: per-day opening hours, the four vibe scores, priority. Rome must regenerate to exactly what it is today (§6 parity test). |
| D3 | **In scope:** editor images shown in the planner, and the n8n "option 2" data pipeline as a design section. |
| D4 | **Out of scope** (deselected): editor robustness (dead-tunnel error, env-only webhook URL, duplicate-name check in the editor), and "missing price = unknown instead of free". Listed under Open items so they aren't lost. |
| D5 | **Every remote editor image stores a credit and the planner shows it**, using the existing credit shape from `public/destinations/<city>/_credits.json` and the existing `/credits` page. |
| D6 | **Draft images arrive unticked in the editor.** Only images the reviewer explicitly approves are saved. |
| D7 | Plan lives in `docs/plans/` at the repo root. |

### Defaults chosen in this plan (override if you disagree)

| # | Default | Why |
|---|---|---|
| E1 | **Paris carry-over covers hours, vibes and priority** for 5 overlaps: Eiffel Tower → `Πύργος του Άιφελ`, Louvre Museum → `Μουσείο του Λούβρου`, Musée d'Orsay → `Μουσείο Orsay`, Sainte-Chapelle → `Sainte-Chapelle`, Luxembourg Gardens → `Κήποι του Λουξεμβούργου`. | D1 says "hand-tuned values", which are all three. |
| E2 | **Montmartre & Sacré-Cœur → `Sacré-Cœur (Θόλος)` carries vibes and priority but NOT hours.** | The planner entry was the whole Montmartre walk (open all day); the JSON entry is the Dome, which has real opening hours. |
| E3 | **Opening hours = one window per day, Mon→Sun, or closed.** No split hours (lunch closing), no last-entry time. | That is exactly what the planner engine's `program: DayHours[]` (length 7, Mon..Sun) can use today. Split hours / last entry need engine changes — Open items. |
| E4 | **Explicit JSON values win; absent fields fall back to today's category presets.** Explicit `priority` wins over `top`. | Keeps all 13 already-generated cities byte-for-byte equivalent except for the additive fields in §4. |
| E5 | **Images are looked up by a new stable key `ref = "<cityId>:<id>"`**, not by name. Order: manual list (name) → editor images (ref) → auto-generated (name) → city cover. | Activity ids repeat across cities (London and Rome both have id 1), so the key must include the city. Name lookups stay as fallback so saved trips and existing images keep working. |
| E6 | **Remote editor images without a credit are skipped by the generator** (with a warning). Local `/public` paths are allowed without one. | Enforces D5 at the one point every image passes through. |
| E7 | **Until n8n returns structured hours (§8), drafts leave `opening_hours` empty** (category default) and keep Google's text as a note. The reviewer fills the per-day editor. | Parsing Google's Greek weekday text is brittle; and storing Google's hours is not allowed by Google's terms anyway (§1). |
| E8 | **The migration is a one-off script run with `npx tsx`**; no new dependency is committed. | It must import the curated `.ts` catalogues; `my-nextjs-app` has no TS runner besides vitest. |
| E9 | **Paris magic combo keeps matching by name**, updated to the JSON names. Switching combos to `ref` is left for later. | Smallest correct change; Rome's combo names already match `rome.json`. |

---

## 1 — Risks and blockers

1. **`my-nextjs-app/node_modules` is missing on this checkout.** Run `npm install` in `my-nextjs-app/` before any test or generator run.
2. **Next.js rule.** `my-nextjs-app/AGENTS.md`: this Next.js version has breaking changes; read the relevant guide in `node_modules/next/dist/docs/` before touching `app/` code (`/credits` page, `activityImages.ts`). The editor has its own Next 15.1.6.
3. **Paris changes visibly for users.** 10 English entries become 22 Greek-named family attractions. Paris loses its 3 lunch-capable food spots (like 11 of the other 13 cities, which have none). The 5 old English image-map entries become unused (kept; saved trips still reference those names).
4. **Saved trips are safe.** `core/trips.storage.ts` stores full `Trip` snapshots, so no saved trip is recomputed against the new catalogues.
5. **Bad n8n images would now reach the app** (e.g. the Hundertwasserhaus draft returned photos of Atlanta and California). Mitigated by D6 (unticked by default) and E6 (no credit → not shown); fully fixed by §8.
6. **Google terms of use.** Storing Google Places hours, website or coordinates permanently in the JSON (what the current n8n drafts lead to) is not allowed; neither is showing Places data on the planner's Leaflet maps. §8 moves those facts to storable sources. Until then, treat draft facts as "to verify".
7. **`mediaPosts` has a flattened layout** (app at repo root). When merged, the generator's `JSON_DIR` (`../../takemytrip/data`) and `editor/lib/paths.ts` (`../my-nextjs-app`) must be updated together.
8. **Every generated `*.data.ts` changes** once (new `ref` field, `CLOSED` helper). Review that diff as additive-only (see Testing).

---

## 2 — Architecture / approach

```
editor/ (Next 15, :3100)                takemytrip/data/<city>.json         my-nextjs-app/
  ActivityForm / DraftsReview  ──save──▶  source of truth, 15 cities  ──▶  scripts/gen-activities.mjs
  (per-day hours, vibes, priority,        (new optional fields, §3)            │
   archived, images+credits)                                                   ├─▶ data/activities/<city>.data.ts  (all 15, incl. rome + paris)
        ▲                                                                      ├─▶ data/activities/index.ts
        │ drafts (never auto-saved)                                            ├─▶ data/activities/_helpers.ts     (+ CLOSED)
  n8n "activity-draft" webhook                                                 └─▶ data/activities/_images.ts      (NEW: editor images + credits)
  (§8 option 2)                                                                           │
                                                                     core/cities.data.ts ◀┘  (no more curated Rome/Paris overrides)
                                                                     activityImages.ts, /credits page
```

Today the generator reads only `category`, `duration_hours`, `top`, `location`, prices, `website`, notes, tags, `best_time`, restaurant and cafe. It **ignores** `archived`, `opening_hours`, `priority` and `images`, although the editor writes them and its README says they are honoured. This plan makes the README true.

---

## 3 — The shared JSON contract (`takemytrip/data/<city>.json`)

All fields optional and backward compatible. Verified: **no city JSON uses any of them yet**, so no data migration is needed beyond Rome/Paris (§6).

```ts
// one day: open/close in decimal hours (9.5 = 09:30); null = closed that day
type DayHours = { open: number; close: number } | null;

type Credit = {                       // same shape as public/destinations/<city>/_credits.json
  source: string;                     // "Wikimedia Commons", "Unsplash", …
  file?: string;
  photoUrl: string;                   // page of the photo at the source
  author: string;
  license: string;                    // "CC BY-SA 4.0"
  licenseUrl: string;
  attributionRequired: boolean;
};

// added to each activity:
opening_hours?: DayHours[] | { open: number; close: number } | null;
                                      // 7 entries Mon→Sun; {open:0,close:24} = all day.
                                      // Legacy single window = same every day (read, never written).
vibes?: { cultural: number; foodie: number; adventurous: number; relaxing: number }; // 0–10
priority?: number;                    // 0–10, wins over `top`
archived?: boolean;                   // true = kept in JSON, excluded from the planner
images?: Array<string | { url: string; credit?: Credit }>;  // string = local /public path
```

The contract is documented once, in `editor/README.md` ("Data contract" section), and mirrored by the types in `editor/lib/types.ts`.

---

## 4 — Planner: generator (`my-nextjs-app/scripts/gen-activities.mjs`)

1. **`HELPERS`** (written to `data/activities/_helpers.ts`): add `export const CLOSED: Window = { open: 0, close: 0 };` and `ref: string` to `CatalogueActivity`.
2. **`main()`**: skip activities with `archived === true`. Remove the `CURATED` set (after §6 step 3; until then it stays so Rome/Paris keep working).
3. **`emitActivity()`**:
   - `program`: from `opening_hours` when present — all 7 equal → `everyDay(at(o, c))` / `everyDay(ALL_DAY)`; otherwise a literal array of `at(o, c)` / `CLOSED` (`use.closed = true`). Absent → today's preset logic, unchanged.
   - vibes: `a.vibes` values, else `preset.v`.
   - priority: `a.priority` if a number, else today's `top`/`preset.p` rule.
   - `ref: "<cityId>:<id>"`.
4. **Validation (fail the run, non-zero exit):** `opening_hours` not 7 entries, `open >= close` on an open day, values outside 0–24; vibes/priority outside 0–10. The editor's `lib/regenerate.ts` already returns `ok: false` + output, so the editor surfaces these.
5. **Warnings (don't fail):** duplicate activity names across cities (magic combos and name-keyed images assume uniqueness); remote images without a credit (skipped, E6).
6. **New output `data/activities/_images.ts`**: `EDITOR_ACTIVITY_IMAGES: Record<string /*ref*/, string[]>` and `EDITOR_IMAGE_CREDITS: Array<Credit & { subject: string }>` (only `attributionRequired === true`), same header/format conventions as the other generated files.

---

## 5 — Planner: core and UI

| File | Change |
|---|---|
| `app/components/ActivityCombinations/core/activities.functions.ts` | `Activity`: add `ref?: string` (optional, so hand-made test activities still type-check). Update the metadata comment that says Rome/Paris are hand-authored. |
| `app/components/ActivityCombinations/core/activities.data.ts` | Import `CLOSED` from `data/activities/_helpers` instead of `CLOSED as RAW_CLOSED` from `rome.data`. `ROME_ACTIVITIES` keeps its name (the generator emits `ROME_ACTIVITIES`, verified). |
| `app/components/ActivityCombinations/core/cities.data.ts` | Drop the `PARIS_ACTIVITIES` import and the `rome:` / `paris:` overrides in `ACTIVITIES_BY_DESTINATION`; both come from `GENERATED_ACTIVITIES_BY_DESTINATION`. Paris magic combo `activityNames` → `["Μουσείο του Λούβρου", "Μουσείο Orsay"]` (E9). Update the comments above it. `ROME`, `PARIS`, `DEFAULT_CITY` lookups stay as they are. |
| `data/activities.data.ts` | **Delete** (Paris curated catalogue) after §6. |
| `data/activities/rome.data.ts` | Becomes a generated file (overwritten by the generator). |
| `app/activities/components/activityImages.ts` | `activityImages(a)`: `ACTIVITY_IMAGES_MANUAL[a.name]` → `EDITOR_ACTIVITY_IMAGES[a.ref]` → `GENERATED_ACTIVITY_IMAGES[a.name]` → city cover (E5). |
| `app/credits/page.tsx` | Append `EDITOR_IMAGE_CREDITS` (mapped to the page's `{ subject, author, license, licenseUrl, sourceUrl }`) after the hand-kept `CC_CREDITS`. Keep the existing layout; no new button styles. |

---

## 6 — Rome and Paris migration

**Step 1 — Snapshot** (`my-nextjs-app/scripts/snapshot-curated.mts`, run once with `npx tsx`): import `ROME_ACTIVITIES` (`data/activities/rome.data.ts`) and `PARIS_ACTIVITIES` (`data/activities.data.ts`); write `my-nextjs-app/scripts/curated-snapshot.json` with, per activity: `name`, `id`, `hours`, `cost`, `program`, the 4 vibes, `priority`, `is_lunch`.

**Step 2 — Write into the JSON** (`my-nextjs-app/scripts/migrate-curated-to-json.mts`, run once):
- **Rome:** match snapshot ↔ `rome.json` by `id` (verified: all 26 ids and names match exactly). For each activity write `opening_hours`, `vibes`, `priority` **only where they differ from what the category preset would give**, and `duration_hours` where `hours` differs. Where the tuned `cost` differs from `prices.adult`, **report, don't change** (prices are the JSON's own data).
- **Paris:** apply the explicit name map from E1/E2 to `paris.json`. Leave the other 16 activities untouched.
- Writes go through the same formatting as the editor (`JSON.stringify(data, null, 2) + "\n"`), so a later editor save causes no diff noise.

**Step 3 — Switch over:** remove `CURATED` from the generator, run `node scripts/gen-activities.mjs` (expect 15 cities written, 0 skipped), apply §5, delete `data/activities.data.ts`.

**Step 4 — Parity test** (`my-nextjs-app/data/activities/__tests__/curated-parity.test.ts`, vitest): for all 26 Rome activities and the 5 Paris hours carry-overs (E1), the generated `program`, vibes, `priority` and `hours` equal the snapshot. The only allowed differences are the cost mismatches reported in step 2. Remove the snapshot and this test once accepted (last task).

---

## 7 — Editor (`editor/`)

| File | Change |
|---|---|
| `lib/types.ts` | `DayHours`, `Credit`, `EditorImage = string \| { url; credit? }` per §3; `opening_hours?: DayHours[] \| {open;close} \| null`; `vibes?`; `images?: EditorImage[]`. Remove the stale "editor-set images win" comment until §5 ships. |
| `components/OpeningHoursEditor.tsx` | Rewrite from "one window for all days" to 7 rows Mon→Sun: open/close inputs, a "closed" checkbox, an "all day" shortcut and "copy Monday to all". Keep the "use category default" toggle (→ `null`). Reads the legacy single window as "same every day". |
| `components/VibesEditor.tsx` (new) | 4 inputs 0–10 (cultural, foodie, adventurous, relaxing) with an "auto from category" toggle, same pattern as the priority input. |
| `components/ActivityForm.tsx` | Wire `VibesEditor` next to the existing priority input and the new `OpeningHoursEditor`. |
| `components/ImagesEditor.tsx` | Accept `EditorImage[]`. Show a credit line per image (author · license); for a remote image with no credit, a "no credit — won't show in the app" badge. New prop `defaultSelected` (today every image starts selected via `new Set(value.map((_, i) => i))`). |
| `components/DraftsReview.tsx` | Pass `defaultSelected={false}` so draft images arrive unticked (D6). |
| `lib/n8n.ts` (`mapDraft`) | Keep each image's credit instead of flattening to the URL (the workflow returns `{ url, source, license, … }`); map to `Credit`. Keep `opening_hours` empty and Google's hours as the text note (E7). When §8's structured fields exist, map `openingPeriods` → `opening_hours`. |
| `README.md` | Replace the "What you can edit" claims with the §3 data contract; document the credit rule (D5/E6) and that drafts' images start unticked. |

Rome/Paris need **no special handling** in the editor any more (no "won't reach the planner" warning), because §6 removes the curated exception.

---

## 8 — n8n workflow, "option 2" (design only)

The workflow "Family Travel Activity Research (Greek)" (`yqBVkEguOwmQE7zb`) runs on the Oracle VM's n8n and is **not in this repo**, so this section is a design and a response contract, not file tasks. Principle: **Gemini writes text; facts come from storable, structured sources.**

| Data | Source | Notes |
|---|---|---|
| Which place it is | Google Places, **Place ID only** | The ID is the one Places field Google allows you to store. |
| Coordinates, official website | **Wikidata** (free, no conditions), else OpenStreetMap | Replaces storing Google's coordinates/website. |
| Opening hours | Official website page, extracted by Gemini into fixed JSON (`day, open, close`, "not found" allowed, never guess); compared with Google's structured hours at draft time only | Disagreement → `hoursConflict: true` for the reviewer. |
| Images | Wikidata's image (P18) and Commons category (P373) for that exact entity, with full credit from Commons' metadata; Commons geo-search near the coordinates as fallback; a Gemini vision check ("is this photo of X?") drops mismatches | Fixes the Atlanta/California case. |
| Description, family notes | Gemini | As today. |

**Model:** `gemini-2.5-flash` if this Google project already uses 2.5 (Google now limits 2.5 access to existing users); otherwise `gemini-3.8-flash`. Use structured JSON output. **No Google Search grounding** (not available on 3.x free tier; option 2 doesn't need it: the page is fetched and given to Gemini).

**Response contract v2** (additive; the editor keeps accepting v1):

```json
{ "ok": true, "draft": {
    "name": "...", "placeId": "...", "description": "...", "category": "...",
    "coordinates": { "latitude": 0, "longitude": 0, "source": "wikidata" },
    "officialWebsite": "...",
    "openingPeriods": [ { "open": 9, "close": 18 }, null, "... 7 entries Mon→Sun" ],
    "hoursSource": "official-site", "hoursConflict": false,
    "images": [ { "url": "...", "credit": { "source": "Wikimedia Commons", "photoUrl": "...",
                  "author": "...", "license": "CC BY-SA 4.0", "licenseUrl": "...",
                  "attributionRequired": true }, "match": 0.93 } ],
    "importantNotes": [ "..." ] } }
```

**Free-tier budget:** about 1 Gemini call per activity (+1 per image for the vision check). Daily request limits are per model and per project; check them in AI Studio (the Gemini docs no longer publish the numbers). The daily quota resets at midnight Pacific (~10:00 Greece). Spread re-checks of the ~281 activities (233 today + Rome's 26 + Paris's 22) over several days.

---

## Testing

All of it runs **without live n8n calls** (free quota). Fixtures for `mapDraft` come from the two drafts already captured (St Paul's Cathedral, Hundertwasserhaus).

| What | How |
|---|---|
| Generator contract | Unit tests next to the generator (vitest, `my-nextjs-app`): `opening_hours` → `program` (all-equal, mixed, closed day, all-day, legacy single window), vibes/priority override vs preset, `archived` skipped, validation failures exit non-zero, uncredited remote image skipped. |
| 13 existing cities unchanged | After regenerating, `git diff my-nextjs-app/data/activities/` for those 13 files shows **only** the added `ref:` lines (and `CLOSED` in `_helpers.ts`). |
| Rome/Paris parity | §6 step 4 test. |
| Planner still passes | `npm run test:planner` and `npm run test:unit` in `my-nextjs-app` (the existing tests import `ACTIVITIES` = Rome generically); `npx tsc --noEmit`. |
| Editor | `npx vitest run` in `editor/` (3 existing tests) + new: `cityStore` round-trip of `opening_hours`/`vibes`/credited images; `mapDraft` keeps credits and leaves `opening_hours` empty (fixtures). `npx tsc --noEmit`. |
| End to end (manual, local, no n8n) | Editor on :3100: archive an activity → it disappears from `london.data.ts`; restore → back. Set Louvre hours in the editor → plan never puts the Louvre on a Tuesday. Rome: Monday-closed museums never on Mondays. Paris trip containing Louvre + Orsay shows the magic combo. An image with a credit shows in the app and on `/credits`; an uncredited remote image doesn't. |
| n8n v2 | Separately, in n8n, with at most 2 live requests; save the responses as new fixtures. |

---

## Task list

| # | Task | Files |
|---|---|---|
| 1 | `npm install` in `my-nextjs-app/`; read the Next.js docs note (§1.2) | — |
| 2 | Snapshot curated Rome/Paris engine values | `my-nextjs-app/scripts/snapshot-curated.mts`, `…/scripts/curated-snapshot.json` |
| 3 | Editor types for the §3 contract | `editor/lib/types.ts` |
| 4 | Generator: `CLOSED` + `ref` in helpers, skip archived, `opening_hours`/vibes/priority, validation + warnings, generator unit tests | `my-nextjs-app/scripts/gen-activities.mjs`, new test file |
| 5 | Generator: `_images.ts` with editor images + credits | `my-nextjs-app/scripts/gen-activities.mjs` |
| 6 | Core accepts the new output: `Activity.ref`, `CLOSED` import | `core/activities.functions.ts`, `core/activities.data.ts` |
| 7 | Migrate Rome + Paris tuned values into the JSON | `my-nextjs-app/scripts/migrate-curated-to-json.mts`, `takemytrip/data/rome.json`, `takemytrip/data/paris.json` |
| 8 | Remove `CURATED`, regenerate all 15 cities, parity test | `gen-activities.mjs`, `data/activities/*.data.ts`, `data/activities/index.ts`, `data/activities/__tests__/curated-parity.test.ts` |
| 9 | Drop curated overrides, delete Paris curated file, update Paris magic combo | `core/cities.data.ts`, delete `data/activities.data.ts` |
| 10 | Images by `ref` + credits page | `app/activities/components/activityImages.ts`, `app/credits/page.tsx` |
| 11 | Editor: per-day hours + vibes inputs | `editor/components/OpeningHoursEditor.tsx`, new `editor/components/VibesEditor.tsx`, `editor/components/ActivityForm.tsx` |
| 12 | Editor: credited images, unticked drafts, `mapDraft` credits + tests | `editor/components/ImagesEditor.tsx`, `editor/components/DraftsReview.tsx`, `editor/lib/n8n.ts`, new editor tests |
| 13 | Editor README: data contract + credit rule | `editor/README.md` |
| 14 | Full test pass + manual end-to-end checks | — |
| 15 | n8n workflow v2 (in n8n), then map `openingPeriods` in `mapDraft` | n8n; `editor/lib/n8n.ts` |
| 16 | After acceptance: remove snapshot + parity test | `…/curated-snapshot.json`, `curated-parity.test.ts` |

**Files not touched:** the content of the 13 other city JSONs (only their generated `.data.ts` output changes); `scripts/gen-activity-images.mjs` and `activityImages.generated.ts` (the auto image pipeline); `app/components/ui/buttonStyles.ts` and all styling; `editor/lib/paths.ts`; `reels/`; the `mediaPosts` branch; Next.js config in both apps. No new npm dependencies (`tsx` via `npx` only).

---

## Open items

1. **Deselected, parked:** editor robustness (clear error when the n8n tunnel is down instead of a "not found" draft, `N8N_ACTIVITY_WEBHOOK` from env only with no hard-coded quick-tunnel URL, duplicate-name check on save) and "missing price = unknown, not free". Worth a follow-up plan.
2. **Split hours and last entry** (E3) need planner engine changes; not covered here.
3. **Paris lunch:** after the switch Paris has no lunch-capable activities (true of 11 other cities too). OK, or add a food activity to `paris.json`?
4. **Which Gemini model the workflow uses today**, and whether this Google project has used 2.5 before (decides §8's model).
5. **Stable n8n address:** the webhook is a Cloudflare quick tunnel whose URL changes on restart; a named tunnel is an n8n/VM change.
6. **`graphify`** isn't installed, so the root `CLAUDE.md` step "run `graphify update .` after modifying code" can't run. Install it, or drop the rule.
7. **Merging with `mediaPosts`** (flattened layout): generator `JSON_DIR` and `editor/lib/paths.ts` must change together (§1.7).

---

## Implementation status — local branch `editor` (from `updates` @ 6b33d3d), uncommitted

Tasks 1–14 done; 15 (n8n v2) and 16 (remove snapshot + parity test) wait on you.

**Deviations from the plan, and why**

| Plan said | Done instead | Why |
|---|---|---|
| Generator unit tests in vitest | `scripts/gen-activities.lib.mjs` (pure helpers) + `scripts/gen-activities.lib.test.mjs` (`node:test`) | vitest only runs `*.planner.test.ts`; this matches the existing `photo-sync.lib` pattern. The generator ran `main()` on import, so its logic had to move out to be testable. |
| Parity test `curated-parity.test.ts` | `data/activities/curated-parity.planner.test.ts` | Same vitest include pattern. |
| Migration script `.mts` via `npx tsx` | `scripts/migrate-curated-to-json.mjs` (plain Node) | It reads the snapshot JSON, not the `.ts` catalogues. Only the snapshot step needed `tsx`; that one-off script was deleted after use (it can't meaningfully re-run once Rome is generated). |
| `ImagesEditor` `defaultSelected={false}` | Draft suggestions go to a transient `__imageCandidates`; `images` starts `[]` | With a flag alone the suggestions would still sit in the draft's `images` and be saved even if the reviewer never touched the gallery. |
| — | `paris.json` #8 renamed `Πάνθεον` → `Πάνθεον του Παρισιού` | The new duplicate-name check caught a collision the switch created with Rome #20 `Πάνθεον`: Paris would have shown Rome's photos and one of them would get the other's map coordinates. |
| — | `core/__tests__/cities.test.ts`: Paris 10 → 22 activities, Louvre Tuesday check | It encoded the old curated Paris. |
| — | `/credits` list key `sourceUrl` → `subject|sourceUrl` | One photo can now appear for two activities. |

**Pre-existing problems found (not caused by this work, not fixed)**

- `npm run test:unit` fails to compile on `updates` itself: `tsconfig.test.json` can't resolve `@/app/config/features`.
- `npm run test:planner` fails 8 of 23 tests on `updates` itself (~25 min run).
- Duplicate activity name `Museum of Illusions` (Kraków #4, Warsaw #7): the same name-lookup collision as the Pantheon; the generator now warns about it on every run.
