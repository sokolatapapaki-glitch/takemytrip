// -----------------------------------------------------------------------------
// Scheduling: turn a combo (a set of activities) into a timed itinerary.
// -----------------------------------------------------------------------------
// Every plan begins at the user's chosen start hour. Each activity takes its
// `hours`, runs back-to-back, can't start before it opens (we wait if we arrive
// early), and must finish before it closes. The day ends at the start hour plus
// the time budget set in the filters (e.g. start 12:00 + a 10h budget -> the
// plan must wrap up by 22:00 / 10 PM).
//
// A midday LUNCH slot is woven in between activities. It is REQUIRED in every
// combo of two or more activities (a single-activity combo has no lunch, since
// a break can't sit between two activities). It prefers the 13:00 ideal and may
// slide a little earlier (down to 11:30) when the day forces it, but it may
// never START after 4 PM — a 2+ combo with no lunch placement by 4 PM is dropped.
// If the combo contains a foodie activity flagged `is_lunch` that is open during
// the midday band, THAT activity fills the slot (using its own hours); otherwise
// a generic 3-hour break is used. The lunch always sits BETWEEN activities (one
// before, one after); its hours count toward the day's total.
import { Activity, dayHours, isClosedDay, maxComboValue, routeLinearity } from "./activities.functions";
import type { Filter, Selection } from "./filters.functions";
import { LUNCH_CLOSE, LUNCH_EARLIEST, LUNCH_HOURS, LUNCH_NAME, LUNCH_OPEN } from "./schedule.data";

export type ScheduledItem = {
  name: string;
  start: number; // 24h decimal start time
  end: number; // 24h decimal end time
  closed: boolean; // the activity is shut on the chosen day
  lunch: boolean; // this slot is the lunch (generic break or a foodie activity)
};

export type ComboSchedule = {
  items: ScheduledItem[]; // activities (+ optional lunch) in order, with slots
  feasible: boolean; // every slot fits its window AND ends by the budget
  withinHours: boolean; // no activity is scheduled outside its opening window
  // (ignores the day budget) — used to hide closed-hour combos
  endsAt: number; // finish time of the last item (24h decimal)
  linearity: number; // route directness (0–10) of the CHOSEN visiting order — we
  // pick, among feasible orderings, the one with the highest value
  feasibleOrderings: number; // how many distinct orderings of this activity set
  // can be scheduled legally (within every opening window + a valid lunch)
};

// The day's end time: the start hour + the hours chosen in the time-budget filter.
export function scheduleEndHour(
  filters: Filter[],
  selection: Selection,
  startHour: number
): number {
  const fi = filters.findIndex((f) => f.unit?.label === "Hours");
  if (fi < 0) return startHour + maxComboValue("hours");
  const picked = selection[fi] ?? [];
  const option = filters[fi].options[picked[0]];
  const hours = option ? option.target : maxComboValue("hours");
  return startHour + hours;
}

// Resolve the lunch slot's timing. `activity` null = the generic break; else the
// foodie activity that fills the slot (using its own hours and day's opening).
// `ok` means it starts within the 1–4 PM window and (for an activity) is open.
function lunchSlot(
  activity: Activity | null,
  t: number,
  day: number
): { name: string; start: number; end: number; ok: boolean } {
  if (!activity) {
    // The generic break prefers the 13:00 ideal: if we reach the slot well
    // before then we wait to 13:00, otherwise we eat on arrival — which may be
    // a little earlier (down to LUNCH_EARLIEST). It may NEVER start after 4 PM
    // (LUNCH_CLOSE); arriving past then makes this placement invalid.
    const start = t < LUNCH_EARLIEST ? LUNCH_OPEN : t;
    return { name: LUNCH_NAME, start, end: start + LUNCH_HOURS, ok: start <= LUNCH_CLOSE };
  }
  const h = dayHours(activity, day);
  if (isClosedDay(h)) {
    return { name: activity.name, start: t, end: t + activity.hours, ok: false };
  }
  const start = Math.max(t, LUNCH_OPEN, h.open);
  const end = start + activity.hours;
  const ok = start <= LUNCH_CLOSE && end <= h.close;
  return { name: activity.name, start, end, ok };
}

type Eval = {
  feasible: boolean; // within all opening windows AND within the day budget
  hard: number; // opening-window failures: a closed activity, an activity that
  // ends after it closes, or an invalid lunch slot. These are the violations
  // that mean someone would be standing outside a closed door.
  over: number; // 1 if the day runs past the budget end, else 0 (a soft limit)
  endsAt: number;
  lunchOk: boolean; // the lunch slot (if any) is valid and within its window
};

// Cheap evaluation of one ordering. If `lunchAt >= 0`, a lunch slot is taken
// just before the activity at that index (1..len-1 keeps it strictly between
// activities); `lunchActivity` null = generic break, else a foodie activity.
function evaluate(
  order: Activity[],
  lunchAt: number,
  lunchActivity: Activity | null,
  day: number,
  startHour: number,
  endHour: number
): Eval {
  let t = startHour;
  let hard = 0;
  let lunchOk = false;
  for (let i = 0; i < order.length; i++) {
    if (i === lunchAt) {
      const s = lunchSlot(lunchActivity, t, day);
      if (s.ok) lunchOk = true;
      else hard++;
      t = s.end;
    }
    const a = order[i];
    const h = dayHours(a, day);
    if (isClosedDay(h)) {
      // Shut today — can't be done at all; still costs its time in the day.
      hard++;
      t += a.hours;
      continue;
    }
    const start = Math.max(t, h.open); // wait until it opens
    const end = start + a.hours;
    if (end > h.close) hard++;
    t = end;
  }
  const over = t > endHour ? 1 : 0;
  return {
    feasible: hard === 0 && over === 0,
    hard,
    over,
    endsAt: t,
    lunchOk,
  };
}

// The full visiting order of REAL activity locations, in sequence. A generic
// break has no location (it isn't in `order`); a foodie `lunchActivity` does, so
// it's spliced back in at its slot — giving every plan a path over the same set
// of stops, so two orderings' linearities are comparable.
function routeStops(
  order: Activity[],
  lunchAt: number,
  lunchActivity: Activity | null
): Activity[] {
  if (!lunchActivity) return order;
  return [...order.slice(0, lunchAt), lunchActivity, ...order.slice(lunchAt)];
}

// Route directness (0–10) of an ordering: how straight the path through its
// stops is (see routeLinearity). Order-dependent — this is what the chosen
// ordering is maximised on, once feasibility is settled.
function linearityOf(
  order: Activity[],
  lunchAt: number,
  lunchActivity: Activity | null
): number {
  return routeLinearity(routeStops(order, lunchAt, lunchActivity).map((a) => a.coords));
}

// Build the actual timed itinerary for a fixed ordering (+ optional lunch slot).
function layout(
  order: Activity[],
  lunchAt: number,
  lunchActivity: Activity | null,
  day: number,
  startHour: number,
  endHour: number
): ComboSchedule {
  const items: ScheduledItem[] = [];
  let t = startHour;
  let hard = 0;
  for (let i = 0; i < order.length; i++) {
    if (i === lunchAt) {
      const s = lunchSlot(lunchActivity, t, day);
      if (!s.ok) hard++;
      items.push({ name: s.name, start: s.start, end: s.end, closed: false, lunch: true });
      t = s.end;
    }
    const a = order[i];
    const h = dayHours(a, day);
    const closed = isClosedDay(h);
    const start = closed ? t : Math.max(t, h.open);
    const end = start + a.hours;
    if (closed || end > h.close) hard++;
    items.push({ name: a.name, start, end, closed, lunch: false });
    t = end;
  }
  const over = t > endHour;
  return {
    items,
    feasible: hard === 0 && !over,
    withinHours: hard === 0,
    endsAt: t,
    linearity: linearityOf(order, lunchAt, lunchActivity),
    feasibleOrderings: 0, // filled in by scheduleCombo (it counts across orderings)
  };
}

// Visit every ordering of `arr`, calling `cb` with the current arrangement.
function eachPermutation<T>(arr: T[], cb: (perm: T[]) => void): void {
  const n = arr.length;
  const used = new Array<boolean>(n).fill(false);
  const cur: T[] = [];
  const rec = () => {
    if (cur.length === n) {
      cb(cur);
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      cur.push(arr[i]);
      rec();
      cur.pop();
      used[i] = false;
    }
  };
  rec();
}

// One candidate itinerary: an ordering, an optional lunch slot, and its score.
type Arrangement = {
  order: Activity[];
  lunchAt: number; // index the lunch sits before; -1 = no lunch
  activity: Activity | null; // the foodie activity filling lunch, or null = break
  ev: Eval;
  lin: number; // route directness (0–10) of this ordering's stops
};
type Best = Arrangement | null;

// How desirable a candidate's lunch is, used only to break ties: a real foodie
// activity (2) beats a generic break (1) beats no lunch at all (0).
function lunchRank(c: Arrangement): number {
  if (c.lunchAt < 0) return 0;
  return c.activity ? 2 : 1;
}

// Choose between two arrangements, in priority order:
//   1. opening-window FEASIBILITY (fewer hard violations) — exactly as before,
//      we never accept a closed-door violation for any reason;
//   2. then the straightest route (HIGHER linearity) — the new ordering goal;
//   3. then the nicer lunch (foodie over generic break);
//   4. then fewer budget overruns, then an earlier finish.
// So among equally-feasible orderings, the most direct one wins.
function betterArrangement(a: Arrangement, b: Arrangement): boolean {
  if (a.ev.hard !== b.ev.hard) return a.ev.hard < b.ev.hard;
  if (a.lin !== b.lin) return a.lin > b.lin;
  const la = lunchRank(a);
  const lb = lunchRank(b);
  if (la !== lb) return la > lb;
  if (a.ev.over !== b.ev.over) return a.ev.over < b.ev.over;
  return a.ev.endsAt < b.ev.endsAt;
}

// Find the best ordering of a combo. Lunch strategies considered:
//   1. a foodie `is_lunch` activity from the combo filling the midday slot,
//   2. a generic 3-hour break between activities (always available for 2+),
//   3. no break — ONLY for a single-activity combo.
// Each strategy's best arrangement is found, then they compete via
// betterArrangement: FEASIBILITY (opening hours) is settled first exactly as
// before; among the feasible ones, the ordering with the highest route
// linearity (the straightest path) wins. For 2+ activities a lunch is required,
// so option 3 is never chosen.
//
// We also count `feasibleOrderings`: how many distinct orderings of the activity
// set can be scheduled legally (within every opening window, with the required
// lunch as a generic break for 2+; a single activity has just its one ordering).
export function scheduleCombo(
  combo: Activity[],
  day: number,
  startHour: number,
  endHour: number
): ComboSchedule {
  // Plain (no lunch): the best ordering on its own.
  let plain: Arrangement = {
    order: combo,
    lunchAt: -1,
    activity: null,
    ev: evaluate(combo, -1, null, day, startHour, endHour),
    lin: linearityOf(combo, -1, null),
  };
  // Best generic-break arrangement whose midday slot is valid.
  let generic: Best = null;
  // How many orderings can be scheduled within every opening window + lunch.
  let feasibleOrderings = 0;

  eachPermutation(combo, (perm) => {
    const e = evaluate(perm, -1, null, day, startHour, endHour);
    const plainCand: Arrangement = {
      order: perm.slice(),
      lunchAt: -1,
      activity: null,
      ev: e,
      lin: linearityOf(perm, -1, null),
    };
    if (betterArrangement(plainCand, plain)) plain = plainCand;

    // Is THIS ordering schedulable legally? For a single activity that's just
    // "fits its window"; for 2+ it needs a valid lunch slot somewhere — either a
    // generic break inserted between two stops, or (if one of the activities is a
    // foodie `is_lunch`) that activity taking the midday slot at its position.
    let orderingFeasible = combo.length < 2 && e.hard === 0;
    for (let p = 1; p < perm.length; p++) {
      const e2 = evaluate(perm, p, null, day, startHour, endHour);
      if (e2.hard === 0) orderingFeasible = true;
      if (e2.lunchOk) {
        const g: Arrangement = {
          order: perm.slice(),
          lunchAt: p,
          activity: null,
          ev: e2,
          lin: linearityOf(perm, p, null),
        };
        if (!generic || betterArrangement(g, generic)) generic = g;
      }
    }
    // Foodie-lunch feasibility: an interior foodie activity serving as the slot.
    for (let j = 1; !orderingFeasible && j < perm.length - 1; j++) {
      if (!perm[j].is_lunch) continue;
      const rest = perm.filter((_, idx) => idx !== j);
      if (evaluate(rest, j, perm[j], day, startHour, endHour).hard === 0) {
        orderingFeasible = true;
      }
    }
    if (orderingFeasible) feasibleOrderings++;
  });

  // Real is_lunch activity: for each candidate, schedule the OTHER activities
  // around it (one before, one after), with it taking the midday slot.
  let foodie: Best = null;
  for (const lunch of combo.filter((a) => a.is_lunch)) {
    const rest = combo.filter((a) => a !== lunch);
    if (rest.length < 2) continue; // need one activity before and one after
    eachPermutation(rest, (perm) => {
      for (let p = 1; p < perm.length; p++) {
        const e2 = evaluate(perm, p, lunch, day, startHour, endHour);
        if (e2.lunchOk) {
          const f: Arrangement = {
            order: perm.slice(),
            lunchAt: p,
            activity: lunch,
            ev: e2,
            lin: linearityOf(perm, p, lunch),
          };
          if (!foodie || betterArrangement(f, foodie)) foodie = f;
        }
      }
    });
  }

  // Lunch is REQUIRED in every combo of 2+ activities and must start by 4 PM.
  // We compete the lunch-bearing arrangements; opening hours win first, then the
  // straightest route, then a real foodie lunch over a generic break, then budget.
  const candidates: Arrangement[] = [];
  if (generic) candidates.push(generic);
  if (foodie) candidates.push(foodie);

  if (candidates.length === 0) {
    // No valid lunch placement (none starts by 4 PM). A single activity has no
    // lunch by design, so that's a fine plain plan. A 2+ combo, though, can't
    // meet the "lunch required, by 4 PM" rule, so it isn't a valid plan — lay it
    // out plain but mark it unschedulable so the list hides it.
    const sched = layout(plain.order, -1, null, day, startHour, endHour);
    return combo.length >= 2
      ? { ...sched, feasible: false, withinHours: false, feasibleOrderings }
      : { ...sched, feasibleOrderings };
  }

  let best = candidates[0];
  for (const c of candidates) if (betterArrangement(c, best)) best = c;

  return { ...layout(best.order, best.lunchAt, best.activity, day, startHour, endHour), feasibleOrderings };
}
