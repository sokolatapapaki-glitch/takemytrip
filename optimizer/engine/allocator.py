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
6. Cross-day district continuity: DBSCAN micro-clusters are grouped into
   macro geographic districts (centroid distance ≤ _DISTRICT_RADIUS_KM).
   Clusters from the same district are ordered consecutively and receive an
   affinity bonus that makes their assigned day appear "lighter", steering
   nearby attractions onto the same day and partitioning the city cleanly.

Output: a list of day-groups, each being a list of attraction indices.
"""

from __future__ import annotations
from collections import defaultdict
from typing import List, Dict, Tuple
import numpy as np

from optimizer.engine.distance import build_distance_matrix, haversine_km


# ── district continuity constants ─────────────────────────────────────────────

# Two micro-clusters whose centroids are within this radius are considered part
# of the same macro district and should strongly prefer landing on the same day.
_DISTRICT_RADIUS_KM: float = 4.0

# Virtual budget reduction (minutes) per same-district attraction already on a day.
# Makes that day look "cheaper" to fill, biasing placement toward co-location.
_DISTRICT_AFFINITY_STRENGTH: int = 35

# Maximum total virtual discount per candidate day (caps at ~3 attraction bonus).
_DISTRICT_AFFINITY_CAP: int = 105


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
# compact/balanced keep full capacity; relaxed cuts it; intensive pushes it slightly higher.
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
    cluster_summary : dict
        Output of clustering.cluster_summary() – uses 0-based attraction indices.
    durations : List[int]
        Visit duration in minutes per attraction (0-based).
    time_matrix : np.ndarray
        (n+1)×(n+1) matrix where index 0 = hotel; attractions start at 1.
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
        self.style = travel_style
        self.prefs = preferences or []
        self.pacing_mode = pacing_mode

        # Effective capacity per day (travel-style adjusts pacing)
        style_mult = _travel_style_multiplier(travel_style)
        pacing_mult = _PACING_CAPACITY_MULTIPLIERS.get(pacing_mode, 1.0)
        self.effective_capacity = self.max_minutes * style_mult * pacing_mult

        self.lunch_minutes = 60
        self.net_capacity = max(60, self.effective_capacity - self.lunch_minutes)

    # ── public entry point ────────────────────────────────────────────────────

    def allocate(self) -> Tuple[List[List[int]], List[int]]:
        """
        Returns (day_groups, free_day_numbers).

        *day_groups*       – list of lists; day_groups[d] = [attraction_idx, ...]
        *free_day_numbers* – 1-based day numbers that have no planned activities
        """
        # Pre-compute district groupings once; stored on self for reuse.
        self._districts, self._cid_to_dist = self._compute_district_info()

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

        free_days = self._compute_free_days(day_groups)
        return day_groups, free_days

    # ── private methods ───────────────────────────────────────────────────────

    def _compute_district_info(self) -> Tuple[dict, dict]:
        """
        Group DBSCAN micro-clusters into macro geographic districts using
        complete-linkage hierarchical clustering.

        Two clusters are merged into one district only when the resulting
        district's maximum internal centroid-to-centroid distance stays
        within _DISTRICT_RADIUS_KM (complete linkage, not single linkage).
        This prevents the chaining problem where a dense city centre collapses
        into a single giant district.

        Returns (districts, cid_to_dist) where:
          districts   – {district_id: frozenset_of_cluster_ids}
          cid_to_dist – {cluster_id: district_id}
        """
        cluster_ids = list(self.c_summary.keys())

        # Precompute all pairwise centroid distances (O(k²))
        centroid_dist: dict = {}
        for i, ci in enumerate(cluster_ids):
            for j, cj in enumerate(cluster_ids):
                if i >= j:
                    continue
                si, sj = self.c_summary[ci], self.c_summary[cj]
                d = haversine_km(
                    si["centroid_lat"], si["centroid_lon"],
                    sj["centroid_lat"], sj["centroid_lon"],
                )
                centroid_dist[(ci, cj)] = centroid_dist[(cj, ci)] = d

        def _diameter(cid_set: frozenset) -> float:
            cids = list(cid_set)
            if len(cids) <= 1:
                return 0.0
            return max(
                centroid_dist.get((ci, cj), 0.0)
                for i, ci in enumerate(cids)
                for j, cj in enumerate(cids)
                if i < j
            )

        # Start: each cluster is its own district
        districts: dict = {cid: frozenset({cid}) for cid in cluster_ids}

        # Greedily merge the closest pair whose merged diameter stays ≤ threshold
        changed = True
        while changed:
            changed = False
            dist_keys = list(districts.keys())
            best_link_dist = float("inf")
            best_merge: tuple | None = None

            for i in range(len(dist_keys)):
                for j in range(i + 1, len(dist_keys)):
                    di, dj = dist_keys[i], dist_keys[j]
                    merged = districts[di] | districts[dj]
                    if _diameter(merged) > _DISTRICT_RADIUS_KM:
                        continue
                    # Min linkage distance (how close are the two groups?)
                    min_link = min(
                        centroid_dist.get((ci, cj), float("inf"))
                        for ci in districts[di]
                        for cj in districts[dj]
                    )
                    if min_link < best_link_dist:
                        best_link_dist = min_link
                        best_merge = (di, dj)

            if best_merge:
                di, dj = best_merge
                merged_set = districts[di] | districts[dj]
                districts.pop(di, None)
                districts.pop(dj, None)
                districts[min(di, dj)] = merged_set
                changed = True

        cid_to_dist: dict = {}
        for dist_id, cids in districts.items():
            for cid in cids:
                cid_to_dist[cid] = dist_id

        return dict(districts), cid_to_dist

    def _day_district_affinity(
        self,
        day_group: List[int],
        cluster_district_id: int,
    ) -> int:
        """
        Count attractions already in *day_group* that belong to the same
        macro district as the candidate cluster.  Higher count → stronger
        affinity → virtual budget discount makes that day preferred.
        """
        if cluster_district_id is None:
            return 0
        return sum(
            1 for attr_idx in day_group
            if self._cid_to_dist.get(int(self.labels[attr_idx])) == cluster_district_id
        )

    def _day_micro_cluster_affinity(self, day_group: List[int], micro_cid: int) -> int:
        """
        Count attractions already in *day_group* from the same DBSCAN
        micro-cluster.  Used in Pass 3 (forced splits) with a stronger weight
        to keep cluster mates co-located even when the whole cluster can't fit.
        """
        return sum(
            1 for attr_idx in day_group
            if int(self.labels[attr_idx]) == micro_cid
        )

    def _ordered_clusters(self) -> List[int]:
        """
        Order clusters for day assignment.

        Primary sort: district aggregate priority (descending) — clusters from
        the same macro district are emitted consecutively so the natural FFD /
        LLF loop tends to land them on the same day bucket.
        Secondary sort: cluster average priority (descending) within district.

        When "group_nearby" preference is active, district and cluster size
        replace priority as the ranking criterion.
        """
        dist_priority = {
            dist_id: sum(
                self.c_summary[cid]["avg_priority"] * self.c_summary[cid]["size"]
                for cid in cids
            )
            for dist_id, cids in self._districts.items()
        }

        if "group_nearby" in self.prefs:
            dist_size = {
                dist_id: sum(self.c_summary[cid]["size"] for cid in cids)
                for dist_id, cids in self._districts.items()
            }
            return sorted(
                self.c_summary.keys(),
                key=lambda cid: (
                    -dist_size[self._cid_to_dist[cid]],
                    -self.c_summary[cid]["size"],
                ),
            )

        return sorted(
            self.c_summary.keys(),
            key=lambda cid: (
                -dist_priority[self._cid_to_dist[cid]],
                -self.c_summary[cid]["avg_priority"],
            ),
        )

    def _balanced_target_capacity(self) -> int:
        """
        Per-day load target for balanced LLF distribution.

        Derived from total attraction time spread over total_days with a 30%
        travel overhead, capped at net_capacity.
        """
        total_visit = sum(self.durations)
        per_day = (total_visit * 1.3) / max(1, self.total_days)
        return max(90, min(self.net_capacity, round(per_day)))

    def _spread_across_days(self) -> List[List[int]]:
        """
        Balanced mode: Least-Loaded-First allocation across total_days buckets.

        Uses a reduced per-day target capacity derived from total attraction time
        to maximise the number of active days and minimise empty-day waste.

        District affinity: days that already hold attractions from the same
        macro district as the candidate cluster receive a virtual budget
        reduction, making them appear lighter and thus preferred.  This steers
        geographically nearby clusters onto the same day without hardcoding
        any city-specific knowledge.
        """
        ordered = self._ordered_clusters()
        target_cap = self._balanced_target_capacity()

        day_groups: List[List[int]] = [[] for _ in range(self.total_days)]
        day_budgets: List[int] = [0] * self.total_days

        def _ranked(district_id: int) -> List[int]:
            """
            Three-tier ranking for whole-cluster placement:
              0 – day already holds this district's content  (co-locate)
              1 – day is completely empty                    (claim fresh territory)
              2 – day holds other districts' content         (cross-district last resort)
            Within each tier, sort ascending by actual load (emptier = preferred).
            """
            def _key(d: int) -> tuple:
                same_aff = self._day_district_affinity(day_groups[d], district_id)
                if same_aff > 0:
                    tier = 0
                elif not day_groups[d]:
                    tier = 1
                else:
                    tier = 2
                return (tier, day_budgets[d])
            return sorted(range(self.total_days), key=_key)

        for cid in ordered:
            cluster_indices = self.c_summary[cid]["attraction_indices"]
            cluster_cost = _cluster_time_budget(
                cluster_indices, self.durations, self.time_matrix
            )
            district_id = self._cid_to_dist.get(cid)

            ranked = _ranked(district_id)
            placed = False

            # Pass 1: fit within balanced target capacity (prefer district-affine days)
            for d in ranked:
                if day_budgets[d] + cluster_cost <= target_cap:
                    day_groups[d].extend(cluster_indices)
                    day_budgets[d] += cluster_cost
                    placed = True
                    break

            # Pass 2: fit within full net_capacity
            if not placed:
                for d in ranked:
                    if day_budgets[d] + cluster_cost <= self.net_capacity:
                        day_groups[d].extend(cluster_indices)
                        day_budgets[d] += cluster_cost
                        placed = True
                        break

            # Pass 3: cluster too large — split into individual attractions.
            # Use only micro-cluster affinity (same DBSCAN cluster = co-locate),
            # NOT district affinity.  District affinity here would pull split
            # pieces toward days that already hold a different micro-cluster
            # from the same district, creating cross-cluster geographic mixing.
            if not placed and len(cluster_indices) > 1:
                for idx in cluster_indices:
                    single_cost = _cluster_time_budget(
                        [idx], self.durations, self.time_matrix
                    )
                    micro_cid = int(self.labels[idx])

                    def _split_key(d: int, _mc=micro_cid) -> tuple:
                        micro_aff = self._day_micro_cluster_affinity(day_groups[d], _mc)
                        tier = 0 if micro_aff > 0 else 1
                        return (tier, day_budgets[d])

                    sub_ranked = sorted(range(self.total_days), key=_split_key)
                    sub_placed = False
                    for d in sub_ranked:
                        if day_budgets[d] + single_cost <= self.net_capacity:
                            day_groups[d].append(idx)
                            day_budgets[d] += single_cost
                            sub_placed = True
                            break
                    if not sub_placed:
                        d = sub_ranked[0]
                        day_groups[d].append(idx)
                        day_budgets[d] += single_cost
                placed = True

            if not placed:
                d = ranked[0]
                day_groups[d].extend(cluster_indices)
                day_budgets[d] += cluster_cost

        return [g for g in day_groups if g]

    def _pack_clusters_into_days(self) -> List[List[int]]:
        """
        First-Fit-Decreasing bin-packing of clusters → days.

        District affinity: existing days are ranked by affinity-adjusted budget
        so that days already holding same-district content are tried first.
        """
        ordered = self._ordered_clusters()
        day_groups: List[List[int]] = []
        day_budgets: List[int] = []

        def _affinity_ranked(district_id: int) -> List[int]:
            def _key(d: int) -> int:
                affinity = self._day_district_affinity(day_groups[d], district_id)
                return day_budgets[d] - min(
                    affinity * _DISTRICT_AFFINITY_STRENGTH, _DISTRICT_AFFINITY_CAP
                )
            return sorted(range(len(day_groups)), key=_key)

        for cid in ordered:
            cluster_indices = self.c_summary[cid]["attraction_indices"]
            cluster_cost = _cluster_time_budget(
                cluster_indices, self.durations, self.time_matrix
            )
            district_id = self._cid_to_dist.get(cid)

            placed = False
            for d in _affinity_ranked(district_id):
                if day_budgets[d] + cluster_cost <= self.net_capacity:
                    day_groups[d].extend(cluster_indices)
                    day_budgets[d] += cluster_cost
                    placed = True
                    break

            if not placed:
                if cluster_cost > self.net_capacity and len(cluster_indices) > 1:
                    for idx in cluster_indices:
                        single_cost = _cluster_time_budget(
                            [idx], self.durations, self.time_matrix
                        )
                        micro_cid = int(self.labels[idx])

                        def _split_key2(d: int, _mc=micro_cid) -> tuple:
                            micro_aff = self._day_micro_cluster_affinity(day_groups[d], _mc)
                            tier = 0 if micro_aff > 0 else 1
                            return (tier, day_budgets[d])

                        placed2 = False
                        for d in sorted(range(len(day_groups)), key=_split_key2):
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

        District continuity guard: swaps that would split a micro-cluster or
        move an attraction away from its district mates receive a penalty equal
        to _DISTRICT_AFFINITY_CAP, discouraging geographic fragmentation.
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

                    # Penalise swaps that break micro-cluster or district cohesion
                    mc_ai = int(self.labels[ai])
                    mc_aj = int(self.labels[aj])
                    dist_ai = self._cid_to_dist.get(mc_ai)
                    dist_aj = self._cid_to_dist.get(mc_aj)

                    # ai leaving heaviest: bad if heaviest has more same-cluster mates
                    # and lightest has none from ai's cluster/district
                    cluster_mates_heavy = sum(
                        1 for idx in day_groups[heaviest]
                        if idx != ai and int(self.labels[idx]) == mc_ai
                    )
                    cluster_mates_light = self._day_micro_cluster_affinity(
                        day_groups[lightest], mc_ai
                    )
                    if cluster_mates_heavy > 0 and cluster_mates_light == 0:
                        improvement -= _DISTRICT_AFFINITY_CAP

                    cluster_mates_light_aj = sum(
                        1 for idx in day_groups[lightest]
                        if idx != aj and int(self.labels[idx]) == mc_aj
                    )
                    cluster_mates_heavy_aj = self._day_micro_cluster_affinity(
                        day_groups[heaviest], mc_aj
                    )
                    if cluster_mates_light_aj > 0 and cluster_mates_heavy_aj == 0:
                        improvement -= _DISTRICT_AFFINITY_CAP

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
