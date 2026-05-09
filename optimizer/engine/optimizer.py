"""
Main Itinerary Optimizer orchestrator.

Pipeline
--------
1. Build a distance/time matrix for all attractions + the hotel.
2. Cluster attractions geographically (DBSCAN).
3. Allocate clusters to days (modified bin-packing with balance improvement).
4. For each day, optimise the visiting order (2-opt TSP).
5. Schedule each day with opening hours, fixed times, and lunch break.
6. Score the complete itinerary.
7. Package results into ItineraryResult.
"""

from __future__ import annotations
from typing import List, Tuple
import numpy as np

from optimizer.models import (
    Attraction, UserSettings, ItineraryResult,
    DayPlan, PlannedAttraction,
)
from optimizer.engine.distance import (
    build_distance_matrix, haversine_km, walking_minutes_between,
)
from optimizer.engine.clustering import (
    cluster_attractions, cluster_summary, order_clusters_by_priority,
)
from optimizer.engine.allocator import DayAllocator
from optimizer.engine.route_optimizer import optimise_day_route
from optimizer.engine.scheduler import DayScheduler
from optimizer.engine.scorer import ItineraryScorer


def _epsilon_for_style(style: str) -> float:
    """Cluster radius in km based on travel style."""
    return {"relaxed": 1.5, "balanced": 1.2, "intensive": 0.9}.get(style, 1.2)


def _epsilon_for_pacing(pacing_mode: str, base_eps: float) -> float:
    """
    Adjust cluster radius for pacing mode.

    - compact/intensive: tighter clusters improve geographic efficiency on dense days
    - balanced: slightly looser to allow cluster-splitting across more days
    - relaxed: unchanged (natural neighbourhood grouping)
    """
    adjustments = {"compact": -0.2, "balanced": 0.1, "relaxed": 0.0, "intensive": -0.3}
    return max(0.3, base_eps + adjustments.get(pacing_mode, 0.0))


def _walking_threshold_for_mode(mode: str) -> float:
    """Distance below which we always walk regardless of transport mode."""
    return {"walking": 99.0, "cycling": 0.4, "public_transport": 0.5, "taxi": 0.3}.get(mode, 0.5)


class ItineraryOptimizer:
    """
    Full pipeline optimizer.

    Usage::

        optimizer = ItineraryOptimizer(attractions, settings)
        result = optimizer.run()
    """

    def __init__(self, attractions: List[Attraction], settings: UserSettings):
        self.attractions = attractions
        self.settings = settings
        self._warnings: List[str] = []

    # ── public ────────────────────────────────────────────────────────────────

    def run(self) -> ItineraryResult:
        if not self.attractions:
            return self._empty_result()

        # Step 1: build coordinate list (hotel at index 0)
        coords, hotel_idx = self._build_coord_list()
        n = len(coords)
        mode = self.settings.transport_mode
        walk_thresh = _walking_threshold_for_mode(mode)

        time_matrix, dist_matrix, mode_matrix = build_distance_matrix(
            coords, mode=mode, walking_threshold_km=walk_thresh
        )

        # Indices of attractions in the extended matrix (hotel=0, attractions=1..n-1)
        attr_indices = list(range(1, len(self.attractions) + 1))

        # Step 2: cluster (only on attraction coords, not hotel)
        attr_coords = coords[1:]  # exclude hotel
        pacing = getattr(self.settings, "pacing_mode", "balanced")
        eps_km = _epsilon_for_pacing(
            pacing, _epsilon_for_style(self.settings.travel_style)
        )
        raw_labels = cluster_attractions(attr_coords, epsilon_km=eps_km)
        c_summary = cluster_summary(
            raw_labels,
            attr_coords,
            [a.priority_score for a in self.attractions],
            [a.duration_minutes for a in self.attractions],
        )

        # Step 3: allocate clusters to days (uses 0-based attraction indices)
        allocator = DayAllocator(
            cluster_labels=raw_labels,
            cluster_summary=c_summary,
            durations=[a.duration_minutes for a in self.attractions],
            time_matrix=time_matrix,
            total_days=self.settings.total_days,
            max_hours_per_day=self.settings.max_hours_per_day,
            travel_style=self.settings.travel_style,
            preferences=self.settings.preferences,
            pacing_mode=pacing,
        )
        day_groups_0based, free_days = allocator.allocate()

        # Convert 0-based attraction indices → extended matrix indices (hotel=0 → attrs=1..n)
        day_groups_raw = [[i + 1 for i in group] for group in day_groups_0based]

        # Step 4+5: optimise and schedule each day
        scheduler = DayScheduler(
            start_time=self.settings.start_time,
            lunch_break_minutes=self.settings.lunch_break_minutes,
        )

        day_plans: List[DayPlan] = []

        for day_num, group in enumerate(day_groups_raw, start=1):
            if not group:
                continue

            # Optimise route within day (2-opt)
            route, route_travel = optimise_day_route(
                hotel_idx=hotel_idx,
                day_attraction_indices=list(group),
                time_matrix=time_matrix,
            )

            # route[0] == hotel_idx, route[1:] == ordered attraction indices
            ordered_attr_indices = route[1:]  # in extended matrix indices
            ordered_attrs = [self.attractions[i - 1] for i in ordered_attr_indices]

            # Build per-leg travel details
            travel_times, travel_modes_leg, walk_times = self._build_legs(
                route, time_matrix, dist_matrix, mode_matrix,
                len(coords), mode,
            )

            planned, deferred, warnings = scheduler.schedule(
                ordered_attrs, travel_times, travel_modes_leg, walk_times
            )

            self._warnings.extend(warnings)

            if deferred:
                self._warnings.append(
                    f"Day {day_num}: {len(deferred)} attraction(s) could not be "
                    f"scheduled due to time constraints."
                )

            # Annotate cluster IDs
            for pa in planned:
                orig_idx = next(
                    j for j, a in enumerate(self.attractions)
                    if a.id == pa.attraction.id
                )
                pa.cluster_id = int(raw_labels[orig_idx])

            # Compute day statistics
            total_visit = sum(a.duration_minutes for a in ordered_attrs)
            total_travel = sum(travel_times)
            total_walk = sum(
                walk_times[i]
                for i, _ in enumerate(ordered_attrs)
                if i < len(walk_times)
            )
            total_cost = sum(a.cost for a in ordered_attrs)
            cluster_ids = sorted(set(pa.cluster_id for pa in planned))

            day_plans.append(DayPlan(
                day_number=day_num,
                date_label=f"Day {day_num}",
                attractions=planned,
                total_duration_minutes=total_visit,
                total_travel_minutes=total_travel,
                total_walking_minutes=total_walk,
                total_cost=total_cost,
                optimization_score=0.0,   # filled in after scoring
                cluster_ids=cluster_ids,
                notes=[],
            ))

        # Step 6: score
        scorer = ItineraryScorer(self.settings, raw_labels)
        all_priorities = [a.priority_score for a in self.attractions]
        planned_priorities = [
            pa.attraction.priority_score
            for dp in day_plans for pa in dp.attractions
        ]

        breakdown = scorer.score_itinerary(day_plans, all_priorities, planned_priorities)

        # Back-fill per-day scores
        avg_dur = float(np.mean([d.total_duration_minutes for d in day_plans])) if day_plans else 0
        for dp in day_plans:
            dp.optimization_score = scorer.score_day(dp, avg_dur)

        # Cluster map: attraction_id → cluster_id
        cluster_map = {
            self.attractions[i].id: int(raw_labels[i])
            for i in range(len(self.attractions))
        }

        # Emit an informational note about the active pacing strategy
        pacing_notes = {
            "compact":   "Pacing: COMPACT — activities packed into fewest possible days.",
            "balanced":  "Pacing: BALANCED — activities spread evenly across available days.",
            "relaxed":   "Pacing: RELAXED — lighter daily schedules with more free time.",
            "intensive": "Pacing: INTENSIVE — maximum attractions per day.",
        }
        if pacing in pacing_notes:
            self._warnings.insert(0, pacing_notes[pacing])

        return ItineraryResult(
            days=day_plans,
            free_days=free_days,
            total_attractions=sum(len(d.attractions) for d in day_plans),
            total_days_used=len(day_plans),
            overall_score=breakdown.get("overall", 0.0),
            scoring_breakdown=breakdown,
            cluster_map=cluster_map,
            warnings=self._warnings,
        )

    # ── private helpers ───────────────────────────────────────────────────────

    def _build_coord_list(self) -> Tuple[List[Tuple[float, float]], int]:
        """Return coords list with hotel at index 0."""
        hotel = self.settings.hotel
        coords = [(hotel.latitude, hotel.longitude)]
        for a in self.attractions:
            coords.append((a.latitude, a.longitude))
        return coords, 0

    def _build_legs(
        self,
        route: List[int],
        time_matrix: np.ndarray,
        dist_matrix: np.ndarray,
        mode_matrix: List[str],
        n: int,
        mode: str,
    ) -> Tuple[List[int], List[str], List[int]]:
        """
        Build per-leg travel times, modes, and walking times.

        Returns three lists of length len(route)-1; index 0 = hotel→first
        attraction, index k = attraction[k-1] → attraction[k].
        """
        travel_times: List[int] = []
        modes_leg: List[str] = []
        walk_times: List[int] = []

        for step in range(len(route) - 1):
            i, j = route[step], route[step + 1]
            t = int(time_matrix[i, j])
            m = mode_matrix[i * n + j] if (i * n + j) < len(mode_matrix) else mode

            if m == "walking":
                w = t
            elif m == "cycling":
                w = 0
            elif m == "public_transport":
                # Walking to/from stops ≈ 5 min per leg
                w = 5
            else:
                # taxi / other – minimal walking
                w = 2

            travel_times.append(t)
            modes_leg.append(m)
            walk_times.append(w)

        # Append a trailing zero so scheduler can safely index [i+1]
        travel_times.append(0)
        modes_leg.append("")
        walk_times.append(0)

        return travel_times, modes_leg, walk_times

    def _idx_to_coord(self, idx: int):
        if idx == 0:
            h = self.settings.hotel
            return (h.latitude, h.longitude)
        attr = self.attractions[idx - 1]
        return (attr.latitude, attr.longitude)

    def _empty_result(self) -> ItineraryResult:
        return ItineraryResult(
            days=[],
            free_days=list(range(1, self.settings.total_days + 1)),
            total_attractions=0,
            total_days_used=0,
            overall_score=0.0,
            scoring_breakdown={},
            cluster_map={},
            warnings=["No attractions provided."],
        )
