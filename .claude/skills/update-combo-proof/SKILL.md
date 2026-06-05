---
name: update-combo-proof
description: >-
  Sync the "Why this rank" proof dashboard shown under each combo with the CURRENT combo
  ranking/scoring/scheduling logic. Use after changing how combos are scored, ordered, filtered,
  or scheduled (e.g. edits to comboScore, scoreBreakdown, the curve functions, the filters/weights,
  the index calculators, or scheduleCombo). It detects what changed in the logic since the last
  time it ran, updates the dashboard's detailed per-option calculations, the per-index curve graphs,
  the formulas, and the schedule-check explanation so everything displayed exactly matches what
  actually decides each combo's position — then records a new baseline.
---

# Update the "Why this rank" dashboard

The **"Why this rank?"** panel under each combo is a *proof*: it claims to show the exact math and
scheduling logic that produced the combo's score and position. That claim is only true if the panel
mirrors the live logic. Whenever the scoring, curves, filters, index calculators, or scheduler
change, the panel drifts out of date. This skill re-synchronizes it.

Goal: after running, the dashboard shows **detailed per-option calculations**, a **curve graph for
every scored index** (exactly as it does today), the **correct formula text** for every curve in
use, and a **schedule-check explanation** that matches the real scheduler — plus any new logic that
isn't represented yet.

## What renders the dashboard (the files you EDIT)

- `my-nextjs-app/app/components/ActivityCombinations/ComboDashboard.tsx`
  - `formulaText(scoreName, params)` — the human-readable formula printed under each filter. **Has a
    `case` per curve name; a curve with no case falls back to just its name (no formula).**
  - `FilterBlock` — the per-filter card: value/target/raw → clamp → ×weight → contribution, subtotal,
    and the embedded `<CurveGraph>`.
  - The prose paragraphs: the score-formula explanation, the `appliesTo` exclusion note, and the
    entire **"Schedule check"** section (day window, lunch rule, feasibleOrderings, linearity).
- `my-nextjs-app/app/components/ActivityCombinations/CurveGraph.tsx`
  - The SVG that plots `fn(value, target, params)` per target plus the combo's landing dot(s).

## The source-of-truth logic (what the dashboard must MIRROR)

These are the "logic files". The dashboard must faithfully reflect them; they are what you diff to
find what changed:

1. `core/filters.functions.ts` — `comboScore`, `scoreBreakdown`, `OptionBreakdown` / `FilterBreakdown`,
   `optionValue`, `targetIndex`, `filterApplies`, and the index calculators
   (`averageIndex`, `normalizedSumIndex`, `sumOf`, `hoursToIndex`, `costToIndex`).
2. `core/filters.data.ts` — `DEFAULT_FILTERS`: each filter's `weight`, `scoreName`, `params`,
   `unit`, `options` (targets), `multi`, per-option `value`, and `appliesTo`.
3. `core/curves.functions.ts` — the curve functions (`linear`, `asymmetricLinear`, `gaussian`, …)
   and the `Params` / `Curve` shapes.
4. `core/curves.data.ts` — `CURVE_BY_NAME`: which names exist, their `color`, and param metadata.
5. `core/schedule.functions.ts` — `scheduleCombo`, `scheduleEndHour`, `ComboSchedule`
   (`feasible`, `withinHours`, `endsAt`, `linearity`, `feasibleOrderings`), and the lunch rules
   (`LUNCH_*` from `schedule.data.ts`).
6. `core/activities.functions.ts` — index helpers used by filters (`bestRouteLinearity`,
   `routeLinearity`, `maxComboValue`, `dayHours`, …).

All paths are under `my-nextjs-app/app/components/ActivityCombinations/`.

## Change detection ("since the last time I called this skill")

A baseline is stored at `.claude/skills/update-combo-proof/last-sync.json`. It records, per logic
file, a content hash (use `git hash-object <file>`), plus the commit and timestamp.

On each run:

1. Read `last-sync.json` if it exists.
2. Recompute `git hash-object` for every logic file listed above.
3. **Changed files** = those whose hash differs from the baseline (or, if `last-sync.json` is
   missing → first run → treat ALL logic files as changed and do a full audit).
4. For context on *what* changed, also run `git diff` on the changed files since the recorded commit
   (`git diff <baseline.commit> -- <file>`) and inspect current uncommitted edits. Use this only to
   focus your attention; the hashes are the authoritative "changed since last sync" signal.

At the END of a successful run, rewrite `last-sync.json` with the new hashes, current
`git rev-parse HEAD`, and an ISO timestamp.

`last-sync.json` shape:

```json
{
  "commit": "<sha at sync time>",
  "syncedAt": "<ISO timestamp>",
  "files": {
    "my-nextjs-app/app/components/ActivityCombinations/core/filters.functions.ts": "<git hash>",
    "...": "..."
  }
}
```

## Workflow

1. **Detect changes.** Run change detection above. List the changed logic files and a one-line note
   on what changed in each (e.g. "filters.data.ts: Time-budget weight 0.5→0.7; added a Gaussian
   Vibe curve"). If nothing changed, report that the dashboard is already in sync and stop (still
   refresh the timestamp).

2. **Re-derive what the dashboard should show** from the changed logic, and update accordingly:

   - **Curve formulas (`formulaText`).** For every `scoreName` actually referenced by
     `DEFAULT_FILTERS`, there must be a `case` returning a readable formula that matches the function
     in `curves.functions.ts` (e.g. Gaussian → `peak·e^(−(value−target)²/(2·width²))`). Add/fix cases
     for any curve now in use; remove cases for curves no longer used only if it reduces confusion.
     The formula must use the param names that actually exist in that curve's `params`.

   - **Per-option calculation rows (`FilterBlock`).** Confirm the displayed pipeline still matches
     `scoreBreakdown`: `value (index)`, `target → index`, `raw → clamp 0–10 → × weight =
     contribution`, then `subtotal`, then the grand `Total`. If `OptionBreakdown` / `FilterBreakdown`
     gained or renamed fields, surface the new fields here. Keep it **detailed** — every selected
     option shows its full math.

   - **Per-index graphs (`CurveGraph` usage + component).** Every applied filter must still render a
     curve graph with: one line per selected option target, the dashed target markers, and the
     combo's actual `{value, score}` landing dot. If a filter now scores a *different index per
     option* (like the multi-select Vibe filter), make sure each option's `value` and `target` feed
     the graph correctly. If a new curve shape needs different axis bounds or sampling to read well,
     adjust `CurveGraph` (it samples `MIN..MAX` at `STEP` and clamps to 0–10).

   - **Score-formula prose.** The paragraph stating the score is
     `Σ weight × clamp₀₋₁₀(curve(value, target))` must match `comboScore`. Update if the aggregation,
     clamping, or weighting changed.

   - **`appliesTo` exclusion note.** The note explaining which filters are *omitted* (not scored 0)
     for some combos must match every filter's `appliesTo` (currently: Route directness needs 3+
     stops). Update wording if any `appliesTo` changed or a new one was added.

   - **Schedule-check section.** The prose + the itinerary list must match `scheduleCombo`:
     the day window from `scheduleEndHour`, the "lunch required in 2+ combos, must start by 4 PM"
     rule, the foodie-`is_lunch`-fills-the-slot behavior, what `feasible` / `withinHours` mean,
     `feasibleOrderings` (count of legal orderings), and that the shown ordering is the **straightest
     (max linearity)** among legal ones — with the explicit caveat that linearity is a tie-break that
     does NOT affect the score/rank. Fix any rule that changed (e.g. lunch window, budget-vs-opening
     distinction, the tie-break priority order in `betterArrangement`).

   - **New logic not yet shown.** If a change introduced a factor that influences score or fit but
     has no representation in the panel (a new index, a new filter field, a new scheduling
     constraint), add a clear, detailed representation for it consistent with the existing style.

3. **Keep altitude + style.** Match the surrounding Tailwind classes, the `n = x.toFixed(2)`
   number formatting, comment density, and the existing card/section layout. This is a documentation
   surface — clarity first; do not change any scoring/scheduling behavior, only what is displayed.

4. **Verify.** From `my-nextjs-app/`, run `npx tsc --noEmit` and confirm it passes. If feasible,
   sanity-check that an example combo's displayed total equals `comboScore` for the same inputs.

5. **Record baseline + report.** Rewrite `last-sync.json`. Then report: which logic files changed,
   what you updated in the dashboard as a result, and anything you intentionally left (with why).

## Hard rules

- **Display only.** Never change scoring, curve, filter, or scheduling *behavior* from this skill —
  edit only the dashboard/graph presentation so it matches the logic. If you spot a real logic bug,
  report it; don't fix it here.
- **No silent curve gaps.** Every curve a filter actually uses must have a real formula in
  `formulaText` — never leave a live curve showing only its bare name.
- **Every applied filter keeps a graph and full per-option math.** Don't drop detail to "simplify".
- **The displayed Total must equal `comboScore`** for the same combo + selection.

## Definition of done

- [ ] Changed logic files since last sync identified (via `last-sync.json` hashes)
- [ ] `formulaText` has a correct formula for every curve in current use
- [ ] Per-option calculation rows match `scoreBreakdown` (all current fields shown, detailed)
- [ ] A curve graph renders for every applied filter, with target markers + the combo's landing dot
- [ ] Score-formula prose + `appliesTo` note match `comboScore` / the filters
- [ ] Schedule-check section matches `scheduleCombo` (lunch rule, feasibleOrderings, linearity tie-break, fit vs budget)
- [ ] Any new score/fit factor is represented in the panel
- [ ] `npx tsc --noEmit` passes; displayed Total equals `comboScore`
- [ ] `last-sync.json` rewritten with new hashes/commit/timestamp
- [ ] Summary reported to the user
