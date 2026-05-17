"""
Multi-day attraction allocator.

Strategy
--------
1. DBSCAN cluster labels (eps=0.02°, Euclidean, from clustering.py) are the
   HARD allocation unit.  Attractions in the same cluster MUST share a day.
2. Each cluster is placed as an atomic unit on the least-loaded available day.
3. Exception: if a cluster's total visit time exceeds max_hours × 1.5 (10.5 h)
   it is split across CONSECUTIVE days only.
4. No runtime distance calculations for placement decisions.
   The 0.02° DBSCAN epsilon already groups geographically close attractions.
"""

from __future__ import annotations
import math
from typing import List, Dict, Tuple, Optional
import numpy as np

from optimizer.engine.distance import build_distance_matrix


# ── module-level helpers ──────────────────────────────────────────────────────

def _cluster_time_budget(
    attr_indices_0based: List[int],
    durations: List[int],
    time_matrix: np.ndarray,
    overhead_pct: float = 0.15,
) -> int:
    """
    Estimate total minutes (visit + travel + overhead) for scheduling only.
    NOT used for capacity / split decisions.
    """
    if not attr_indices_0based:
        return 0
    total_visit = sum(durations[i] for i in attr_indices_0based)
    if len(attr_indices_0based) == 1:
        return round(total_visit * (1 + overhead_pct))
    ext = [i + 1 for i in attr_indices_0based]
    unvisited = set(ext)
    current = ext[0]
    unvisited.discard(current)
    travel = 0
    while unvisited:
        nearest = min(unvisited, key=lambda j: time_matrix[current, j])
        travel += int(time_matrix[current, nearest])
        current = nearest
        unvisited.discard(current)
    return round((total_visit + travel) * (1 + overhead_pct))


def _travel_style_multiplier(style: str) -> float:
    return {"relaxed": 0.75, "balanced": 1.0, "intensive": 1.25}.get(style, 1.0)


_PACING_CAPACITY_MULTIPLIERS: Dict[str, float] = {
    "compact":   1.00,
    "balanced":  1.00,
    "relaxed":   0.65,
    "intensive": 1.10,
}


# ── main allocator ────────────────────────────────────────────────────────────

class DayAllocator:
    """
    Assigns attractions to days using DBSCAN cluster IDs as hard constraints.

    Same cluster → same day (hard rule).
    Splits only when cluster visit time > max_hours × SPLIT_THRESHOLD_MULTIPLIER.
    Splits are always consecutive.
    """

    SPLIT_THRESHOLD_MULTIPLIER: float = 1.5

    def __init__(
        self,
        cluster_labels: np.ndarray,
        cluster_summary: dict,
        coords: List[Tuple[float, float]],
        priorities: List[float],
        durations: List[int],
        time_matrix: np.ndarray,
        total_days: int,
        max_hours_per_day: float,
        max_activities_per_day: int = 5,
        travel_style: str = "balanced",
        preferences: List[str] | None = None,
        pacing_mode: str = "balanced",
    ):
        self.labels = cluster_labels
        self.c_summary = cluster_summary
        self.coords = coords
        self.priorities = priorities
        self.durations = durations
        self.time_matrix = time_matrix
        self.total_days = total_days
        self.max_minutes = max_hours_per_day * 60
        self.split_threshold = self.max_minutes * self.SPLIT_THRESHOLD_MULTIPLIER
        self.max_activities_per_day = max_activities_per_day
        self.style = travel_style
        self.prefs = preferences or []
        self.pacing_mode = pacing_mode
        self.warnings: List[str] = []

        style_mult = _travel_style_multiplier(travel_style)
        pacing_mult = _PACING_CAPACITY_MULTIPLIERS.get(pacing_mode, 1.0)
        self.effective_capacity = self.max_minutes * style_mult * pacing_mult
        self.lunch_minutes = 60
        self.net_capacity = max(60, self.effective_capacity - self.lunch_minutes)

        # Hard constraint: attraction index → DBSCAN cluster id
        self._attr_cluster: Dict[int, int] = {
            i: int(self.labels[i]) for i in range(len(self.labels))
        }

    # ── public entry point ────────────────────────────────────────────────────

    def allocate(self) -> Tuple[List[List[int]], List[int]]:
        """
        Returns (day_groups, free_day_numbers).

        day_groups[d]    = [attraction_idx, ...]  (0-based)
        free_day_numbers = 1-based day numbers with no planned activities
        """
        if self.pacing_mode == "balanced":
            day_groups = self._spread_across_days()
            day_groups = self._split_overloaded_days(day_groups)
            if len(day_groups) > self.total_days:
                day_groups = self._trim_to_total_days(day_groups)
        else:
            day_groups = self._pack_clusters_into_days()
            day_groups = self._balance_days(day_groups)
            day_groups = self._split_overloaded_days(day_groups)
            day_groups = self._trim_to_total_days(day_groups)

        self.warnings.extend(self._validate_cluster_integrity(day_groups))
        free_days = self._compute_free_days(day_groups)
        return day_groups, free_days

    # ── helpers ───────────────────────────────────────────────────────────────

    def _ordered_clusters(self) -> List[int]:
        """Larger clusters first, then by descending average priority."""
        return sorted(
            self.c_summary.keys(),
            key=lambda cid: (
                -self.c_summary[cid]["size"],
                -self.c_summary[cid]["avg_priority"],
            ),
        )

    def _balanced_target_visit(self) -> int:
        """Per-day visit-time target, capped at max_minutes."""
        total_visit = sum(self.durations)
        per_day = total_visit / max(1, self.total_days)
        return max(60, min(self.max_minutes, round(per_day)))

    def _day_visit_minutes(self, day: List[int]) -> int:
        return sum(self.durations[i] for i in day)

    def _cluster_visit_minutes(self, indices: List[int]) -> int:
        return sum(self.durations[i] for i in indices)

    def _all_short(self, indices: List[int]) -> bool:
        return all(self.durations[i] <= 60 for i in indices)

    def _acts_ok(
        self,
        day_idx: int,
        day_groups: List[List[int]],
        day_activities: List[int],
        new_indices: List[int],
    ) -> bool:
        total = day_activities[day_idx] + len(new_indices)
        if total <= self.max_activities_per_day:
            return True
        return self._all_short(day_groups[day_idx] + new_indices)

    # ── spread (balanced mode) ────────────────────────────────────────────────

    def _spread_across_days(self) -> List[List[int]]:
        """
        Cluster-first balanced allocation.

        Each DBSCAN cluster is an atomic unit placed on the least-loaded day
        that still fits within max_hours_per_day.  If no single day fits within
        max_hours (7 h), the cluster is allowed up to split_threshold (10.5 h)
        before being split across consecutive days.

        No distance gates — DBSCAN eps=0.02° already groups close attractions.
        """
        ordered = self._ordered_clusters()

        day_groups: List[List[int]] = [[] for _ in range(self.total_days)]
        day_visits: List[int] = [0] * self.total_days
        day_activities: List[int] = [0] * self.total_days

        for cid in ordered:
            cluster_indices = self.c_summary[cid]["attraction_indices"]
            cluster_visit = self._cluster_visit_minutes(cluster_indices)
            placed = False

            if cluster_visit <= self.split_threshold:
                # Pass 1: fit within max_hours (7 h) on least-loaded day
                for d in sorted(range(self.total_days), key=lambda d: day_visits[d]):
                    if (day_visits[d] + cluster_visit <= self.max_minutes
                            and self._acts_ok(d, day_groups, day_activities, cluster_indices)):
                        day_groups[d].extend(cluster_indices)
                        day_visits[d] += cluster_visit
                        day_activities[d] += len(cluster_indices)
                        placed = True
                        break

                # Pass 2: allow up to split_threshold (10.5 h) before splitting
                if not placed:
                    for d in sorted(range(self.total_days), key=lambda d: day_visits[d]):
                        if (day_visits[d] + cluster_visit <= self.split_threshold
                                and self._acts_ok(d, day_groups, day_activities, cluster_indices)):
                            day_groups[d].extend(cluster_indices)
                            day_visits[d] += cluster_visit
                            day_activities[d] += len(cluster_indices)
                            placed = True
                            break

            # Cluster too large or no day fits: split across consecutive days
            if not placed:
                sub_groups = self._split_cluster_into_subgroups(cluster_indices)
                window = self._find_consecutive_day_window(
                    sub_groups, day_visits, day_activities, day_groups, cid
                )
                for i, sub in enumerate(sub_groups):
                    d = window[i % len(window)]
                    day_groups[d].extend(sub)
                    day_visits[d] += self._cluster_visit_minutes(sub)
                    day_activities[d] += len(sub)
                placed = True

        return [g for g in day_groups if g]

    def _split_cluster_into_subgroups(
        self, cluster_indices: List[int]
    ) -> List[List[int]]:
        """
        Split a large cluster into sequential sub-groups each ≤ max_hours.
        Only called when total visit time > split_threshold (10.5 h).
        """
        sub_groups: List[List[int]] = []
        current: List[int] = []
        current_visit = 0

        for idx in cluster_indices:
            visit = self.durations[idx]
            hours_ok = current_visit + visit <= self.max_minutes
            acts_ok = (len(current) < self.max_activities_per_day
                       or self._all_short(current + [idx]))

            if current and (not hours_ok or not acts_ok):
                sub_groups.append(current)
                current = [idx]
                current_visit = visit
            else:
                current.append(idx)
                current_visit += visit

        if current:
            sub_groups.append(current)

        return sub_groups if sub_groups else [cluster_indices]

    def _find_consecutive_day_window(
        self,
        sub_groups: List[List[int]],
        day_visits: List[int],
        day_activities: List[int],
        day_groups: List[List[int]],
        cluster_id: int,
    ) -> List[int]:
        """
        Find the best consecutive window of len(sub_groups) day indices.

        Priority:
        1. Cluster-pure window (days empty or same cluster) that fits capacity
        2. Any window that fits capacity
        3. Least-loaded consecutive window (fallback)
        """
        n = len(sub_groups)
        total = len(day_visits)

        if n >= total:
            return [i % total for i in range(n)]

        sub_visits = [self._cluster_visit_minutes(sg) for sg in sub_groups]

        best_window: List[int] = list(range(n))
        best_score = float('inf')
        tier = 3

        for start in range(total - n + 1):
            window = list(range(start, start + n))

            fits_cap = all(
                day_visits[window[i]] + sub_visits[i] <= self.max_minutes
                for i in range(n)
            )
            is_pure = all(
                all(self._attr_cluster.get(idx) == cluster_id for idx in day_groups[d])
                for d in window
            )
            load = sum(day_visits[d] for d in window)

            cur_tier = 1 if (fits_cap and is_pure) else (2 if fits_cap else 3)

            if cur_tier < tier or (cur_tier == tier and load < best_score):
                best_window = window[:]
                best_score = load
                tier = cur_tier

        return best_window

    # ── pack (non-balanced modes) ─────────────────────────────────────────────

    def _pack_clusters_into_days(self) -> List[List[int]]:
        """First-Fit-Decreasing bin-packing of clusters → days."""
        ordered = self._ordered_clusters()
        day_groups: List[List[int]] = []
        day_visits: List[int] = []
        day_activities: List[int] = []

        for cid in ordered:
            cluster_indices = self.c_summary[cid]["attraction_indices"]
            cluster_visit = self._cluster_visit_minutes(cluster_indices)

            placed = False
            for d in range(len(day_groups)):
                if (day_visits[d] + cluster_visit <= self.max_minutes
                        and self._acts_ok(d, day_groups, day_activities, cluster_indices)):
                    day_groups[d].extend(cluster_indices)
                    day_visits[d] += cluster_visit
                    day_activities[d] += len(cluster_indices)
                    placed = True
                    break

            if not placed:
                if cluster_visit > self.split_threshold and len(cluster_indices) > 1:
                    sub_groups = self._split_cluster_into_subgroups(cluster_indices)
                    for sub in sub_groups:
                        sv = self._cluster_visit_minutes(sub)
                        sub_placed = False
                        for d in range(len(day_groups)):
                            if (day_visits[d] + sv <= self.max_minutes
                                    and self._acts_ok(d, day_groups, day_activities, sub)):
                                day_groups[d].extend(sub)
                                day_visits[d] += sv
                                day_activities[d] += len(sub)
                                sub_placed = True
                                break
                        if not sub_placed:
                            day_groups.append(list(sub))
                            day_visits.append(sv)
                            day_activities.append(len(sub))
                else:
                    day_groups.append(list(cluster_indices))
                    day_visits.append(cluster_visit)
                    day_activities.append(len(cluster_indices))

        return day_groups

    # ── balance (post-pack improvement) ──────────────────────────────────────

    def _balance_days(self, day_groups: List[List[int]]) -> List[List[int]]:
        """
        Swap attractions between days to reduce load std-dev.
        Never moves an attraction whose transfer would split its cluster across
        non-consecutive days.
        """
        if len(day_groups) <= 1:
            return day_groups

        improved = True
        iterations = 0
        while improved and iterations < 20:
            improved = False
            iterations += 1
            loads = [sum(self.durations[i] for i in day) for day in day_groups]
            heaviest = int(np.argmax(loads))
            lightest = int(np.argmin(loads))

            if heaviest == lightest:
                break

            gap = loads[heaviest] - loads[lightest]
            best_swap = None
            best_improvement = 0

            for ai in day_groups[heaviest]:
                if self._would_break_cluster(ai, heaviest, lightest, day_groups):
                    continue
                for aj in day_groups[lightest]:
                    if self._would_break_cluster(aj, lightest, heaviest, day_groups):
                        continue
                    diff = self.durations[ai] - self.durations[aj]
                    new_gap = abs(gap - 2 * diff)
                    improvement = gap - new_gap
                    if improvement > best_improvement:
                        best_improvement = improvement
                        best_swap = (ai, aj)

            if best_swap:
                ai, aj = best_swap
                hi = day_groups[heaviest].index(ai)
                lj = day_groups[lightest].index(aj)
                day_groups[heaviest][hi] = aj
                day_groups[lightest][lj] = ai
                improved = True

        return day_groups

    def _would_break_cluster(
        self,
        attr_idx: int,
        from_day: int,
        to_day: int,
        day_groups: List[List[int]],
    ) -> bool:
        """True if moving attr_idx would cause its cluster to span non-consecutive days."""
        my_cluster = self._attr_cluster.get(attr_idx)
        if my_cluster is None:
            return False

        cluster_days: set = set()
        for d_idx, day in enumerate(day_groups):
            if any(self._attr_cluster.get(i) == my_cluster for i in day):
                cluster_days.add(d_idx)

        from_still_has = any(
            self._attr_cluster.get(i) == my_cluster
            for i in day_groups[from_day]
            if i != attr_idx
        )
        new_days: set = set()
        for d in cluster_days:
            if d == from_day:
                if from_still_has:
                    new_days.add(d)
            else:
                new_days.add(d)
        new_days.add(to_day)

        if len(new_days) <= 1:
            return False

        sorted_days = sorted(new_days)
        return any(
            sorted_days[i + 1] > sorted_days[i] + 1
            for i in range(len(sorted_days) - 1)
        )

    # ── overload splitting ────────────────────────────────────────────────────

    def _split_overloaded_days(self, day_groups: List[List[int]]) -> List[List[int]]:
        """
        Split any day whose total visit time exceeds split_threshold (10.5 h).
        Days between max_hours (7 h) and split_threshold are allowed when a
        single cluster fills them — cluster integrity takes priority.
        """
        result: List[List[int]] = []
        for day in day_groups:
            visit_time = self._day_visit_minutes(day)
            if visit_time > self.split_threshold and len(day) > 1:
                result.extend(self._split_day_by_clusters(day))
            else:
                result.append(day)
        return result

    def _split_day_by_clusters(self, day: List[int]) -> List[List[int]]:
        """Split a day into sub-groups respecting cluster membership."""
        seen: list = []
        cluster_groups: Dict[int, List[int]] = {}
        for idx in day:
            cid = self._attr_cluster.get(idx, -(idx + 1))
            if cid not in cluster_groups:
                cluster_groups[cid] = []
                seen.append(cid)
            cluster_groups[cid].append(idx)

        sub_groups: List[List[int]] = []
        current: List[int] = []
        current_visit = 0

        for cid in seen:
            indices = cluster_groups[cid]
            group_visit = self._cluster_visit_minutes(indices)
            fits_hours = current_visit + group_visit <= self.max_minutes
            fits_acts = (len(current) + len(indices) <= self.max_activities_per_day
                         or self._all_short(current + indices))

            if current and (not fits_hours or not fits_acts):
                sub_groups.append(current)
                current = list(indices)
                current_visit = group_visit
            else:
                current.extend(indices)
                current_visit += group_visit

        if current:
            sub_groups.append(current)

        return sub_groups if sub_groups else [day]

    # ── validation ────────────────────────────────────────────────────────────

    def _validate_cluster_integrity(self, day_groups: List[List[int]]) -> List[str]:
        """Warn if any DBSCAN cluster appears on non-consecutive days."""
        warnings: List[str] = []
        cluster_days: Dict[int, List[int]] = {}
        for d_idx, day in enumerate(day_groups):
            for attr_idx in day:
                cid = self._attr_cluster.get(attr_idx, -1)
                cluster_days.setdefault(cid, [])
                if d_idx not in cluster_days[cid]:
                    cluster_days[cid].append(d_idx)

        for cid, days in cluster_days.items():
            if len(days) > 1:
                sorted_days = sorted(days)
                consecutive = all(
                    sorted_days[i + 1] == sorted_days[i] + 1
                    for i in range(len(sorted_days) - 1)
                )
                if not consecutive:
                    warnings.append(
                        f"Cluster {cid} spans non-consecutive days: "
                        f"{[d + 1 for d in sorted_days]}"
                    )
        return warnings

    # ── trim / free days ─────────────────────────────────────────────────────

    def _trim_to_total_days(self, day_groups: List[List[int]]) -> List[List[int]]:
        """
        Merge days until len(day_groups) <= total_days.
        Prefers pairs whose combined visit time stays within max_minutes.
        Falls back to merging the two lightest days.
        """
        while len(day_groups) > self.total_days and len(day_groups) > 1:
            visits = [self._day_visit_minutes(d) for d in day_groups]

            best_pair: Optional[Tuple[int, int]] = None
            best_combined = float('inf')
            for i in range(len(day_groups)):
                for j in range(i + 1, len(day_groups)):
                    combined = visits[i] + visits[j]
                    if combined <= self.max_minutes and combined < best_combined:
                        best_combined = combined
                        best_pair = (i, j)

            if best_pair is None:
                sorted_idx = list(np.argsort(visits))
                best_pair = (int(sorted_idx[0]), int(sorted_idx[1]))

            s1, s2 = best_pair
            merged = day_groups[s1] + day_groups[s2]
            survivors = [d for idx, d in enumerate(day_groups) if idx not in (s1, s2)]
            survivors.append(merged)
            day_groups = survivors
        return day_groups

    def _compute_free_days(self, day_groups: List[List[int]]) -> List[int]:
        used = len(day_groups)
        return list(range(used + 1, self.total_days + 1))
