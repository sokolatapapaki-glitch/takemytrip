---
name: update-combo-proof
description: >-
  Sync the "Why this rank" proof dashboard shown under each combo with the CURRENT
  combo ranking/scoring logic. Use after changing how combos are scored, ordered,
  filtered, or scheduled (e.g. edits to comboScore, the curves, the filters, the
  index calculators, or scheduleCombo). Ensures the displayed math, formulas, and
  step-by-step breakdown exactly match what actually decides each combo's position.
---

# Update Combo Proof Dashboard

The combos list shows a per-combo dashboard explaining WHY each combo has its rank.
Whenever the ranking logic changes, that dashboard must be regenerated so the proof
never drifts from the real calculation.

## Source of truth
- Ranking/scoring lives in `app/components/ActivityCombinations/core/filters.functions.ts`
  (`comboScore`, `buildCombinations`, the index calculators) and `curves.ts`.
- Scheduling/feasibility lives in `app/components/ActivityCombinations/core/schedule.functions.ts` (`scheduleCombo`).
- The proof shown to the user lives in `app/components/ActivityCombinations/core/ComboDashboard.tsx`, fed by `scoreBreakdown`
  in `filters.functions.ts`.

## What to do
1. Re-read the current scoring, ordering, filtering, and scheduling code. Note every
   step that actually affects a combo's position (which inputs, which curve, weights,
   normalization, tiebreakers, feasibility).
2. Update `scoreBreakdown` so it recomputes the score by reusing the SAME functions
   as `comboScore` (never a parallel copy of the math) and retains every intermediate
   value the dashboard needs.
3. Update `ComboDashboard.tsx` so each step is displayed with its real numbers and
   formula — including any new factor (e.g. a tiebreaker or feasibility penalty) that
   now influences ordering. Remove anything no longer used.
4. Keep it generic: read the values/weights/curve names from the data, don't hardcode
   today's numbers.

## Hard rules
- The dashboard must reflect the ACTUAL logic — the long-hand total must equal the
  real `comboScore`/rank for the same combo. No drift.
- One source of truth for the math: the dashboard reuses the ranking functions, it
  does not reimplement them.

## Done when
- [ ] Every factor that affects a combo's rank appears in the dashboard with its math.
- [ ] Displayed total matches the real score; order shown matches the real order.
- [ ] `npx tsc --noEmit && npx eslint app/components/ActivityCombinations/core --max-warnings=0` passes.
