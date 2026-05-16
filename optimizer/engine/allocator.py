"""
Multi-day attraction allocator.

Strategy
--------
1. Group attractions into geographic clusters (supplied by clustering.py).
2. Estimate the time budget required by each cluster (visit durations +
   intra-cluster travel).
3. Pack clusters into days using a strategy determined by pacing_mode:
   - compact   : First-Fit-Decreasing (minimise active days)
   - balanced  : Least-Loaded-First across all available days (spread evenly)
   - relaxed   : FFD with reduced per-day capacity (lighter schedules)
   - intensive : FFD with increased per-day tolerance (denser schedules)
4. Honour the user's total_days constraint: if fewer days are needed, spare
   days are recorded as "free days".
5. Respect per-attraction constraints: fixed_time, preferred_time_of_day, and
   priority.
6. HARD CONSTRAINT: Same micro-cluster attractions must be on the same day.
   When a cluster is too large for one day, it is split across CONSECUTIVE
   days only (never Day 2 and Day 5).

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


# Per-pacing-mode multiplier applied to effective_capacity before subtracting lunch.
_PACING_CAPACITY_MULTIPLIERS: Dict[str, float] = {
    "compact":   1.00,
    "balanced":  1.00,
    "relaxed":   0.65,
    "intensive": 1.10,
}


# ── main allocator ────────────────────────────────────────────────────────────

class DayAllocator:
    """
    Assigns attractions to days, returning a list of day-groups.

    All indices used internally are **0-based attraction indices** (0..n-1).
    The caller is responsible for remapping to extended matrix indices if needed.

    Parameters
    ----------
    cluster_labels : np.ndarray
        DBSCAN cluster id per attraction (0-based index).
    cluster_summary : dict
        Output of clustering.cluster_summary() – uses 0-based attraction indices.
    durations : List[int]
        Visit duration in minutes per attraction (0-based).
    time_matrix : np.ndarray
        (n+1)×(n+1) matrix where index 0 = hotel; attractions start at 1.
    max_activities_per_day : int
        Hard cap on attractions per day (exceeded only when all activities ≤1h).
    pacing_mode : str
        One of "compact", "balanced", "relaxed", "intensive".
    """

    def __init__(
        self,
        cluster_labels: np.ndarray,
        cluster_summary: dict,
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
        self.durations = durations
        self.time_matrix = time_matrix
        self.total_days = total_days
        self.max_minutes = max_hours_per_day * 60
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

        # Reverse map: 0-based attraction index → cluster id
        self._attr_cluster: Dict[int, int] = {
            i: int(cluster_labels[i]) for i in range(len(cluster_labels))
        }

    # ── public entry point ────────────────────────────────────────────────────

    def allocate(self) -> Tuple[List[List[int]], List[int]]:
        """
        Returns (day_groups, free_day_numbers).

        *day_groups*       – list of lists; day_groups[d] = [attraction_idx, ...]
        *free_day_numbers* – 1-based day numbers that have no planned activities
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

        # Validate and record any remaining non-consecutive cluster splits
        self.warnings.extend(self._validate_micro_cluster_integrity(day_groups))

        free_days = self._compute_free_days(day_groups)
        return day_groups, free_days

    # ── private helpers ───────────────────────────────────────────────────────

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

    def _balanced_target_visit(self) -> int:
        """
        Per-day VISIT-TIME target for balanced LLF distribution.

        Derived from total attraction visit time spread over total_days,
        capped at max_minutes (the per-day visit-time hard limit).
        """
        total_visit = sum(self.durations)
        per_day = total_visit / max(1, self.total_days)
        return max(60, min(self.max_minutes, round(per_day)))

    def _day_visit_minutes(self, day: List[int]) -> int:
        """Total VISIT time (no overhead) for the given attraction list."""
        return sum(self.durations[i] for i in day)

    def _cluster_visit_minutes(self, indices: List[int]) -> int:
        """Total VISIT time (no overhead) for a cluster subset."""
        return sum(self.durations[i] for i in indices)

    def _all_short(self, indices: List[int]) -> bool:
        """True if ALL attractions in *indices* have duration ≤ 60 minutes."""
        return all(self.durations[i] <= 60 for i in indices)

    def _acts_ok(
        self,
        day_idx: int,
        day_groups: List[List[int]],
        day_activities: List[int],
        new_indices: List[int],
    ) -> bool:
        """
        True if adding *new_indices* to *day_idx* satisfies max_activities_per_day.
        The limit can be exceeded only when ALL activities on the day (existing +
        new) are ≤ 60 minutes.
        """
        total = day_activities[day_idx] + len(new_indices)
        if total <= self.max_activities_per_day:
            return True
        return self._all_short(day_groups[day_idx] + new_indices)

    # ── spread (balanced mode) ────────────────────────────────────────────────

    def _spread_across_days(self) -> List[List[int]]:
        """
        Balanced mode: Least-Loaded-First allocation across total_days buckets.

        Capacity decisions are made on VISIT TIME (not inflated cost) so that
        a cluster with exactly max_hours_per_day of visit time is never
        unnecessarily split due to travel-overhead inflation.

        Hard constraints:
        - Same micro-cluster → same day (consecutive days when cluster is too large)
        - max_activities_per_day respected (exception: all activities ≤ 1 h)
        """
        ordered = self._ordered_clusters()
        target_visit = self._balanced_target_visit()

        day_groups: List[List[int]] = [[] for _ in range(self.total_days)]
        day_visits: List[int] = [0] * self.total_days   # pure visit minutes
        day_activities: List[int] = [0] * self.total_days

        def _ranked() -> List[int]:
            return sorted(range(self.total_days), key=lambda d: day_visits[d])

        for cid in ordered:
            cluster_indices = self.c_summary[cid]["attraction_indices"]
            cluster_visit = self._cluster_visit_minutes(cluster_indices)
            placed = False
            ranked = _ranked()

            # Pass 1: fit whole cluster within balanced target visit time
            for d in ranked:
                if (day_visits[d] + cluster_visit <= target_visit
                        and self._acts_ok(d, day_groups, day_activities, cluster_indices)):
                    day_groups[d].extend(cluster_indices)
                    day_visits[d] += cluster_visit
                    day_activities[d] += len(cluster_indices)
                    placed = True
                    break

            # Pass 2: fit whole cluster within max_hours_per_day (hard visit cap)
            if not placed:
                for d in ranked:
                    if (day_visits[d] + cluster_visit <= self.max_minutes
                            and self._acts_ok(d, day_groups, day_activities, cluster_indices)):
                        day_groups[d].extend(cluster_indices)
                        day_visits[d] += cluster_visit
                        day_activities[d] += len(cluster_indices)
                        placed = True
                        break

            # Pass 3: cluster too large — split into CONSECUTIVE sub-groups only
            if not placed and len(cluster_indices) > 1:
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

            if not placed:
                # Single oversized attraction: force onto least-loaded day
                d = ranked[0]
                day_groups[d].extend(cluster_indices)
                day_visits[d] += cluster_visit
                day_activities[d] += len(cluster_indices)

        # Return only non-empty days; empty slots become free days
        return [g for g in day_groups if g]

    def _split_cluster_into_subgroups(
        self, cluster_indices: List[int]
    ) -> List[List[int]]:
        """
        Split a large cluster into sequential sub-groups where each fits within
        max_hours_per_day (visit time) and max_activities_per_day. Preserves
        input order so geographically adjacent attractions stay together.
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
        day_budgets: List[int],
        day_activities: List[int],
        day_groups: List[List[int]],
        cluster_id: int,
    ) -> List[int]:
        """
        Find the best consecutive window of *len(sub_groups)* day indices.

        Priority order:
        1. Window where every day is cluster-pure (empty or same cluster) AND fits.
        2. Window where every sub-group fits capacity (days may be mixed).
        3. Least-loaded consecutive window (fallback).
        """
        n = len(sub_groups)
        total = len(day_budgets)

        if n >= total:
            # More sub-groups than available days — cycle through all days
            return [i % total for i in range(n)]

        # Use visit-minute totals per sub-group for window fitting
        sub_visits = [self._cluster_visit_minutes(sg) for sg in sub_groups]

        best_window: List[int] = list(range(n))
        best_score = float('inf')
        tier = 3  # 1=pure+fits, 2=fits only, 3=fallback

        for start in range(total - n + 1):
            window = list(range(start, start + n))

            fits_cap = all(
                day_budgets[window[i]] + sub_visits[i] <= self.max_minutes
                for i in range(n)
            )
            # Cluster-pure: each window day is empty OR only has this cluster
            is_pure = all(
                all(self._attr_cluster.get(idx) == cluster_id for idx in day_groups[d])
                for d in window
            )
            load = sum(day_budgets[d] for d in window)

            if fits_cap and is_pure:
                cur_tier = 1
            elif fits_cap:
                cur_tier = 2
            else:
                cur_tier = 3

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
        day_budgets: List[int] = []
        day_activities: List[int] = []

        for cid in ordered:
            cluster_indices = self.c_summary[cid]["attraction_indices"]
            cluster_cost = _cluster_time_budget(
                cluster_indices, self.durations, self.time_matrix
            )

            placed = False
            for d in range(len(day_groups)):
                if (day_budgets[d] + cluster_cost <= self.net_capacity
                        and self._acts_ok(d, day_groups, day_activities, cluster_indices)):
                    day_groups[d].extend(cluster_indices)
                    day_budgets[d] += cluster_cost
                    day_activities[d] += len(cluster_indices)
                    placed = True
                    break

            if not placed:
                if cluster_cost > self.net_capacity and len(cluster_indices) > 1:
                    # Cluster too large — split into sequential sub-groups
                    sub_groups = self._split_cluster_into_subgroups(cluster_indices)
                    for sub in sub_groups:
                        sub_cost = _cluster_time_budget(sub, self.durations, self.time_matrix)
                        sub_placed = False
                        for d in range(len(day_groups)):
                            if (day_budgets[d] + sub_cost <= self.net_capacity
                                    and self._acts_ok(d, day_groups, day_activities, sub)):
                                day_groups[d].extend(sub)
                                day_budgets[d] += sub_cost
                                day_activities[d] += len(sub)
                                sub_placed = True
                                break
                        if not sub_placed:
                            day_groups.append(list(sub))
                            day_budgets.append(sub_cost)
                            day_activities.append(len(sub))
                else:
                    day_groups.append(list(cluster_indices))
                    day_budgets.append(cluster_cost)
                    day_activities.append(len(cluster_indices))

        return day_groups

    # ── balance (post-pack improvement) ──────────────────────────────────────

    def _balance_days(self, day_groups: List[List[int]]) -> List[List[int]]:
        """
        Single-pass swap improvement: reduces std-dev of day load.

        CONSTRAINT: never swap an attraction whose move would cause its
        micro-cluster to appear on non-consecutive days.
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
        """
        True if moving *attr_idx* from *from_day* to *to_day* would cause its
        micro-cluster to span non-consecutive days.
        """
        my_cluster = self._attr_cluster.get(attr_idx)
        if my_cluster is None:
            return False

        # Days currently occupied by this cluster
        cluster_days: set = set()
        for d_idx, day in enumerate(day_groups):
            if any(self._attr_cluster.get(i) == my_cluster for i in day):
                cluster_days.add(d_idx)

        # Simulate removal from from_day
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
            return False  # all on one day — fine

        sorted_days = sorted(new_days)
        return any(
            sorted_days[i + 1] > sorted_days[i] + 1
            for i in range(len(sorted_days) - 1)
        )

    # ── overload splitting ────────────────────────────────────────────────────

    def _split_overloaded_days(self, day_groups: List[List[int]]) -> List[List[int]]:
        """
        Any day whose total VISIT TIME exceeds max_hours_per_day gets split.
        Splitting respects micro-cluster integrity (clusters stay together).
        """
        result: List[List[int]] = []
        for day in day_groups:
            visit_time = self._day_visit_minutes(day)
            if visit_time > self.max_minutes and len(day) > 1:
                sub_groups = self._split_day_by_clusters(day)
                result.extend(sub_groups)
            else:
                result.append(day)
        return result

    def _split_day_by_clusters(self, day: List[int]) -> List[List[int]]:
        """
        Split a day's attractions into sub-groups that each respect capacity.
        Cluster members are kept together within each sub-group.
        Capacity is measured by VISIT TIME to avoid overhead inflation.
        """
        # Gather unique clusters in the order they first appear
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

    def _validate_micro_cluster_integrity(
        self, day_groups: List[List[int]]
    ) -> List[str]:
        """
        Return warning strings for any micro-cluster that appears on
        non-consecutive days in the final plan.
        """
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
                is_consecutive = all(
                    sorted_days[i + 1] == sorted_days[i] + 1
                    for i in range(len(sorted_days) - 1)
                )
                if not is_consecutive:
                    warnings.append(
                        f"Cluster {cid} spans non-consecutive days: "
                        f"{[d + 1 for d in sorted_days]}"
                    )
        return warnings

    # ── trim / free days ─────────────────────────────────────────────────────

    def _trim_to_total_days(self, day_groups: List[List[int]]) -> List[List[int]]:
        """
        If more days required than available, merge days until we fit.

        Prefers merging pairs whose combined VISIT TIME stays within max_hours_per_day.
        Falls back to merging the two lightest days when no safe pair exists.
        """
        while len(day_groups) > self.total_days and len(day_groups) > 1:
            visits = [self._day_visit_minutes(d) for d in day_groups]

            # Prefer a merge whose combined visit time fits within max_minutes
            best_pair = None
            best_combined = float('inf')
            for i in range(len(day_groups)):
                for j in range(i + 1, len(day_groups)):
                    combined = visits[i] + visits[j]
                    if combined <= self.max_minutes and combined < best_combined:
                        best_combined = combined
                        best_pair = (i, j)

            if best_pair is None:
                # No safe merge — merge the two lightest by visit duration
                sorted_idx = list(np.argsort(visits))
                best_pair = (int(sorted_idx[0]), int(sorted_idx[1]))

            s1, s2 = best_pair
            merged = day_groups[s1] + day_groups[s2]
            survivors = [d for idx, d in enumerate(day_groups) if idx not in (s1, s2)]
            survivors.append(merged)
            day_groups = survivors
        return day_groups

    def _compute_free_days(self, day_groups: List[List[int]]) -> List[int]:
        """Return 1-based day numbers that are free (no planned attractions)."""
        used = len(day_groups)
        return list(range(used + 1, self.total_days + 1))
