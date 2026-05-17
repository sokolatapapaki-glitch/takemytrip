"""
Daily scheduler: converts an ordered route into a timed schedule.

For each attraction in the optimised order the scheduler:
  1. Computes the arrival time from the previous departure + travel time.
  2. Checks opening hours – waits if arriving early, skips to next day if
     arriving too late.
  3. Respects fixed_time reservations.
  4. Assigns morning/afternoon/evening slot preference.
  5. Inserts a lunch break around midday.

Returns a list of PlannedAttraction objects and any warnings generated.
"""

from __future__ import annotations
from typing import List, Tuple
from datetime import datetime, timedelta

from optimizer.models import Attraction, PlannedAttraction, OpeningHours


# ── time helpers ──────────────────────────────────────────────────────────────

_BASE_DATE = datetime(2000, 1, 1)   # arbitrary fixed date for arithmetic


def _parse_hhmm(s: str) -> datetime:
    h, m = map(int, s.split(":"))
    return _BASE_DATE + timedelta(hours=h, minutes=m)


def _fmt_hhmm(dt: datetime) -> str:
    return dt.strftime("%H:%M")


def _add_minutes(dt: datetime, minutes: int) -> datetime:
    return dt + timedelta(minutes=minutes)


# ── preference windows ────────────────────────────────────────────────────────

_PREF_WINDOWS = {
    "morning":   (_parse_hhmm("07:00"), _parse_hhmm("12:00")),
    "afternoon": (_parse_hhmm("12:00"), _parse_hhmm("17:00")),
    "evening":   (_parse_hhmm("17:00"), _parse_hhmm("22:00")),
    "any":       (_parse_hhmm("07:00"), _parse_hhmm("22:00")),
}

_LUNCH_START = _parse_hhmm("12:30")
_LUNCH_END   = _parse_hhmm("13:30")


def _opening_window(oh: OpeningHours | None) -> Tuple[datetime, datetime]:
    if oh is None:
        return _parse_hhmm("00:00"), _parse_hhmm("23:59")
    return _parse_hhmm(oh.open), _parse_hhmm(oh.close)


# ── scheduler ─────────────────────────────────────────────────────────────────

class DayScheduler:
    """
    Produces a timed schedule for a single day.

    Parameters
    ----------
    start_time : str
        "HH:MM" – when the visitor leaves the hotel.
    lunch_break_minutes : int
        Duration of lunch break to insert around midday.
    """

    def __init__(self, start_time: str = "09:00", lunch_break_minutes: int = 60):
        self.start_time = start_time
        self.lunch_break_minutes = lunch_break_minutes

    def schedule(
        self,
        ordered_attractions: List[Attraction],
        travel_times: List[int],       # travel_times[i] = minutes to reach attraction i from i-1
        travel_modes: List[str],       # mode used for each leg
        walk_times: List[int],         # walk_times[i] = walking portion of leg i
    ) -> Tuple[List[PlannedAttraction], List[Attraction], List[str]]:
        """
        Schedule *ordered_attractions* starting from *self.start_time*.

        Returns
        -------
        planned     – list of scheduled PlannedAttraction
        deferred    – attractions that could not fit (opening hours / time)
        warnings    – human-readable warning strings
        """
        planned: List[PlannedAttraction] = []
        deferred: List[Attraction] = []
        warnings: List[str] = []

        current_time = _parse_hhmm(self.start_time)
        lunch_inserted = False

        for i, attr in enumerate(ordered_attractions):
            # Travel to this attraction
            travel_min = travel_times[i] if i < len(travel_times) else 0
            mode = travel_modes[i] if i < len(travel_modes) else "walking"
            walk_min = walk_times[i] if i < len(walk_times) else 0

            arrival = _add_minutes(current_time, travel_min)

            # ── Lunch break insertion ────────────────────────────────────────
            if (not lunch_inserted
                    and arrival >= _LUNCH_START
                    and self.lunch_break_minutes > 0):
                current_time = _add_minutes(arrival, self.lunch_break_minutes)
                arrival = current_time
                lunch_inserted = True

            # ── Fixed time constraint ────────────────────────────────────────
            if attr.fixed_time:
                fixed_dt = _parse_hhmm(attr.fixed_time)
                if arrival > _add_minutes(fixed_dt, 30):
                    warnings.append(
                        f"'{attr.title}' fixed at {attr.fixed_time} but estimated "
                        f"arrival {_fmt_hhmm(arrival)} – too late; deferring."
                    )
                    deferred.append(attr)
                    continue
                # Wait until fixed time if arriving early
                if arrival < fixed_dt:
                    arrival = fixed_dt

            # ── Opening hours check ──────────────────────────────────────────
            opens, closes = _opening_window(attr.opening_hours)

            if arrival < opens:
                # Wait for opening
                wait = int((opens - arrival).total_seconds() / 60)
                if wait > 45:
                    warnings.append(
                        f"Waiting {wait} min for '{attr.title}' to open at {_fmt_hhmm(opens)}."
                    )
                arrival = opens

            visit_end = _add_minutes(arrival, attr.duration_minutes)

            if visit_end > closes:
                if arrival >= closes:
                    warnings.append(
                        f"'{attr.title}' is closed at estimated arrival {_fmt_hhmm(arrival)}; deferring."
                    )
                    deferred.append(attr)
                    continue
                # Truncate visit if barely fits
                available = int((closes - arrival).total_seconds() / 60)
                if available < attr.duration_minutes * 0.5:
                    warnings.append(
                        f"Only {available} min available for '{attr.title}' (needs "
                        f"{attr.duration_minutes} min); deferring."
                    )
                    deferred.append(attr)
                    continue
                warnings.append(
                    f"'{attr.title}' visit truncated to {available} min due to closing time."
                )
                visit_end = closes

            # ── Preferred time-of-day nudge (soft constraint) ────────────────
            pref_start, pref_end = _PREF_WINDOWS.get(attr.preferred_time_of_day,
                                                       _PREF_WINDOWS["any"])
            if attr.preferred_time_of_day != "any":
                if not (pref_start <= arrival <= pref_end):
                    warnings.append(
                        f"'{attr.title}' prefers {attr.preferred_time_of_day} "
                        f"but scheduled at {_fmt_hhmm(arrival)}."
                    )

            # ── Next leg travel time (to following attraction) ───────────────
            next_travel = travel_times[i + 1] if (i + 1) < len(travel_times) else 0
            next_walk = walk_times[i + 1] if (i + 1) < len(walk_times) else 0
            next_mode = travel_modes[i + 1] if (i + 1) < len(travel_modes) else "walking"

            planned.append(PlannedAttraction(
                attraction=attr,
                arrival_time=_fmt_hhmm(arrival),
                departure_time=_fmt_hhmm(visit_end),
                travel_to_next_minutes=next_travel,
                travel_to_next_mode=next_mode,
                walk_to_next_minutes=next_walk,
                cluster_id=0,   # will be filled in by orchestrator
            ))

            current_time = visit_end

        return planned, deferred, warnings
