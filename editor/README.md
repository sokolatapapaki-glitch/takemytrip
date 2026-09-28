# Activity Editor App

A standalone Next.js app (port **3100**) to browse, edit, archive, and AI-generate
travel activities for the planner. It edits the source-of-truth JSON in
`../takemytrip/data/*.json` and regenerates the planner's data via
`../my-nextjs-app/scripts/gen-activities.mjs`. It never edits the planner UI.

## Run

```bash
npm install
npm run dev      # http://localhost:3100
npm run build
npm test         # vitest lib tests
```

If port 3100 is busy (a stray Next process), free it:

```powershell
Get-NetTCPConnection -LocalPort 3100 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## What you can edit

Per activity: name, description, **type (category)**, priority, **per-day opening
hours**, **vibes**, duration, per-age prices, best time, website, tags, notes,
**images**, and a single restaurant + single cafe (name/description/map_url).
Archive is a soft delete (`archived:true`) — left out of the planner, kept in the
JSON, restorable.

Every save rewrites the city JSON and re-runs the planner's generator, so the
planner reflects it immediately. All 15 cities — Rome and Paris included — are
generated from their JSON; none is hand-curated any more.

## Data contract

The city JSON (`../takemytrip/data/<city>.json`) is the single source of truth
shared by this editor and the planner's generator
(`../my-nextjs-app/scripts/gen-activities.mjs` + `gen-activities.lib.mjs`). These
activity fields are optional; **absent means "derive from the category"**, exactly
as for an activity that never set them:

| Field | Shape | Planner effect |
|---|---|---|
| `opening_hours` | 7 entries, Monday first: `{ "open": 9, "close": 18 }` or `null` (closed). Decimal hours (`9.5` = 09:30); `{0, 24}` = all day. A legacy single `{open, close}` is read as "same every day". | The days/hours the planner may schedule it. |
| `vibes` | `{ "cultural", "foodie", "adventurous", "relaxing" }`, each 0–10 | Vibe scoring. Missing keys fall back to the category. |
| `priority` | 0–10 | "Tourist priority" scoring. Wins over `top`. |
| `archived` | `true` | Left out of the planner. |
| `images` | `"/destinations/…"` (local, no credit needed) or `{ "url", "credit": { source, photoUrl, author, license, licenseUrl, attributionRequired } }` | Shown ahead of the auto-fetched photos, looked up by `"<city>:<id>"`. |

The generator **refuses to write anything** if a value is malformed (e.g. 8 days,
`open >= close`, a vibe of 11) and prints why; the editor shows that output as a
failed save.

### Image credits

Most Wikimedia Commons photos are CC BY / BY-SA, which require naming the author
and license wherever they're shown. So a **remote image is shown in the planner only
with a complete credit** (source, photo page, author, license, license URL); the
ones with `attributionRequired` are listed on the planner's `/credits` page
automatically. A remote image without one is still saved, but the editor marks it
("Χωρίς πλήρη πηγή") and the planner skips it. Local `/public` paths need no credit.

## Create with AI (n8n)

"✨ Δημιουργία με AI" on a city page opens a modal: pick a city, type one or more
activity names, click **Create**. The editor calls the Oracle VM n8n workflow
(**Family Travel Activity Research (Greek)**, id `yqBVkEguOwmQE7zb`) once per name:

```
editor  POST /api/generate  { city, names[] }
          └─ per name → POST <N8N_WEBHOOK>/webhook/activity-draft  { name, city }
                          └─ Google Places (name-fix) → Gemini → images
                          └─ returns { ok, draft }
        → drafts returned to the browser (NOT auto-saved)
        → review/edit each draft → Save → POST /api/city/<id>/append → regenerate
```

**Suggested images start unticked.** The workflow's pictures arrive as candidates
next to the draft; only the ones the reviewer ticks are saved, so a wrong pick
(it has returned photos of the wrong city before) can't reach the planner by just
clicking Save.

Google Places returns the canonical name, so a misspelled input comes back
corrected (the review UI shows "Ζήτησες «X» → διορθώθηκε σε «Y»"). Prices, tags,
and restaurants are not auto-filled — set them during review.

### Config

- `N8N_ACTIVITY_WEBHOOK` — override the webhook URL (the Cloudflare quick-tunnel URL
  changes if the tunnel restarts). Default is the current tunnel + `/webhook/activity-draft`.

### n8n workflow contract

The webhook responds `{ ok: true, draft: { name, description, category
(entertainment|education|food|nature), duration, coordinates{latitude,longitude},
officialWebsite, openingHours[], address, images[], importantNotes[] } }`, or
`{ ok: false, name }` when Places finds nothing. `lib/n8n.ts` maps that into the
editor's activity schema (category → app taxonomy, duration → hours, coordinates →
location, importantNotes + openingHours → notes, images → unticked candidates
with whatever credit came with them).

The planned **v2** response (docs/plans/01-editor-planner-sync.md §8) adds
`openingPeriods` (7 days, Monday first, `{open, close}` or `null`) and images as
`{ url, credit: {…} }`. `lib/n8n.ts` already accepts both: structured hours go
straight into `opening_hours`, complete credits make images showable. Until then,
v1 drafts leave `opening_hours` to the category default (Google's text stays as a
note) and v1 images lack an author, so they're flagged.
