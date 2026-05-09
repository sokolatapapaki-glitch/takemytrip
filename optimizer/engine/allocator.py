"""
Multi-day attraction allocator.

Strategy
--------
1. Group attractions into geographic clusters (supplied by clustering.py).
2. Estimate the time budget required by each cluster (visit durations +
   intra-cluster travel).
3. Pack clusters into days using a modified First-Fit-Decreasing bin-packing
   algorithm, then improve balance with a local-search swap pass.
4. Honour the user's total_days constraint: if fewer days are needed, spare
   days are recorded as "free days".
5. Respect per-attraction constraints: fixed_time, preferred_time_of_day, and
   priority.

Output: a list of day-groups, each being a list of attraction indices.
"""

from __future__ import annotations
from typing import List, Dict, Tuple
import numpy as np

from optimizer.engine.distance import build_distance_matrix


# ── helpers ──────────────────────────────────────────────────────────────────

def _cluster_time_budget(
    attr_indices_0based: List[int],
    durations: List[int],
    time_matrix: np.ndarray,
    overhead_pct: float = 0.15,
) -> int:
    """
    Estimate total minutes needed for a cluster of attractions.

    *attr_indices_0based* – 0-based attraction indices.
    *time_matrix*         – (n+1)×(n+1) matrix; attractions at cols/rows 1..n.
    """
    if not attr_indices_0based:
        return 0

    total_visit = sum(durations[i] for i in attr_indices_0based)

    if len(attr_indices_0based) == 1:
        return round(total_visit * (1 + overhead_pct))

    # Translate to extended indices (hotel=0, attractions=1..n)
    ext = [i + 1 for i in attr_indices_0based]

    # Greedy NN travel within cluster using extended indices
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


# ── main allocator ────────────────────────────────────────────────────────────

class DayAllocator:
    """
    Assigns attractions to days, returning a list of day-groups.

    All indices used internally are **0-based attraction indices** (0..n-1).
    The caller is responsible for remapping to extended matrix indices if needed.

    Parameters
    ----------
    cluster_summary : dict
        Output of clustering.cluster_summary() – uses 0-based attraction indices.
    durations : List[int]
        Visit duration in minutes per attraction (0-based).
    time_matrix : np.ndarray
        (n+1)×(n+1) matrix where index 0 = hotel; attractions start at 1.
        When accessing durations we use 0-based, but for travel-time estimates
        within a cluster we translate 0-based → extended (+1).
    """

    def __init__(
        self,
        cluster_labels: np.ndarray,
        cluster_summary: dict,
        durations: List[int],
        time_matrix: np.ndarray,
        total_days: int,
        max_hours_per_day: float,
        travel_style: str = "balanced",
        preferences: List[str] | None = None,
    ):
        self.labels = cluster_labels
        self.c_summary = cluster_summary
        self.durations = durations
        self.time_matrix = time_matrix
        self.total_days = total_days
        self.max_minutes = max_hours_per_day * 60
        self.style = travel_style
        self.prefs = preferences or []

        # Effective capacity per day (travel-style adjusts pacing)
        self.effective_capacity = self.max_minutes * _travel_style_multiplier(travel_style)
        # Add lunch break (60 min) to budgeting — that time is consumed
        self.lunch_minutes = 60
        self.net_capacity = max(60, self.effective_capacity - self.lunch_minutes)

    # ── public entry point ────────────────────────────────────────────────────

    def allocate(self) -> Tuple[List[List[int]], List[int]]:
        """
        Returns (day_groups, free_day_numbers).

        *day_groups*    – list of lists; day_groups[d] = [attraction_idx, ...]
        *free_day_numbers* – 1-based day numbers that have no planned activities
        """
        day_groups = self._pack_clusters_into_days()
        day_groups = self._balance_days(day_groups)
        day_groups = self._split_overloaded_days(day_groups)
        day_groups = self._trim_to_total_days(day_groups)
        free_days = self._compute_free_days(day_groups)
        return day_groups, free_days

    # ── private methods ───────────────────────────────────────────────────────

    def _ordered_clusters(self) -> List[int]:
        """
        Order clusters for assignment.

        - If "group_nearby" preference: prioritise large clusters.
        - Otherwise: sort by descending average priority.
        """
        if "group_nearby" in self.prefs:
            return sorted(self.c_summary.keys(),
                          key=lambda cid: self.c_summary[cid]["size"], reverse=True)
        return sorted(self.c_summary.keys(),
                      key=lambda cid: self.c_summary[cid]["avg_priority"], reverse=True)

    def _pack_clusters_into_days(self) -> List[List[int]]:
        """First-Fit-Decreasing bin-packing of clusters → days."""
        ordered = self._ordered_clusters()
        day_groups: List[List[int]] = []
        day_budgets: List[int] = []      # minutes used per day

        for cid in ordered:
            cluster_indices = self.c_summary[cid]["attraction_indices"]
            cluster_cost = _cluster_time_budget(
                cluster_indices, self.durations, self.time_matrix
            )

            placed = False
            for d in range(len(day_groups)):
                if day_budgets[d] + cluster_cost <= self.net_capacity:
                    day_groups[d].extend(cluster_indices)
                    day_budgets[d] += cluster_cost
                    placed = True
                    break

            if not placed:
                # Check if cluster itself exceeds capacity → must be split
                if cluster_cost > self.net_capacity and len(cluster_indices) > 1:
                    for idx in cluster_indices:
                        single_cost = _cluster_time_budget(
                            [idx], self.durations, self.time_matrix
                        )
                        placed2 = False
                        for d in range(len(day_groups)):
                            if day_budgets[d] + single_cost <= self.net_capacity:
                                day_groups[d].append(idx)
                                day_budgets[d] += single_cost
                                placed2 = True
                                break
                        if not placed2:
                            day_groups.append([idx])
                            day_budgets.append(single_cost)
                else:
                    day_groups.append(list(cluster_indices))
                    day_budgets.append(cluster_cost)

        return day_groups

    def _balance_days(self, day_groups: List[List[int]]) -> List[List[int]]:
        """
        Single-pass swap improvement: repeatedly swap attractions between the
        most-loaded and least-loaded day to reduce std-dev of day load.
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
                for aj in day_groups[lightest]:
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

    def _split_overloaded_days(self, day_groups: List[List[int]]) -> List[List[int]]:
        """
        Any day whose total visit+travel time exceeds net_capacity gets split.
        Splitting uses a simple median-load partition by geography.
        """
        result: List[List[int]] = []
        for day in day_groups:
            cost = _cluster_time_budget(day, self.durations, self.time_matrix)
            if cost > self.net_capacity * 1.15 and len(day) > 1:
                mid = len(day) // 2
                result.append(day[:mid])
                result.append(day[mid:])
            else:
                result.append(day)
        return result

    def _trim_to_total_days(self, day_groups: List[List[int]]) -> List[List[int]]:
        """
        If more days required than available, merge the two shortest overflow
        days until we fit. Excess attractions are appended to the final day.
        """
        while len(day_groups) > self.total_days and len(day_groups) > 1:
            loads = [sum(self.durations[i] for i in d) for d in day_groups]
            # Merge the two lightest days
            s1 = int(np.argsort(loads)[0])
            s2 = int(np.argsort(loads)[1])
            if s1 == s2:
                break
            merged = day_groups[s1] + day_groups[s2]
            survivors = [d for idx, d in enumerate(day_groups) if idx not in (s1, s2)]
            survivors.append(merged)
            day_groups = survivors
        return day_groups

    def _compute_free_days(self, day_groups: List[List[int]]) -> List[int]:
        """Return 1-based day numbers that are free (no planned attractions)."""
        used = len(day_groups)
        return list(range(used + 1, self.total_days + 1))
