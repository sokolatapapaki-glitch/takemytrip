"""
Multi-day attraction allocator.

Strategy
--------
1. Group attractions into geographic clusters (supplied by clustering.py).
2. Build GEOGRAPHIC BUNDLES: merge DBSCAN micro-clusters whose members are
   within 2 km of each other.  These bundles are the hard allocation unit —
   attractions in the same bundle MUST land on the same day (or consecutive
   days if the bundle exceeds max_hours_per_day × 1.5).
3. Allocate bundles to days using geography-first placement:
   - For each bundle, prefer the day whose current content is geographically
     closest to the bundle centroid.
   - Empty days are used only when no occupied day has room.
4. When a bundle is too large for one day (visit time > max_hours × 1.5),
   split it into consecutive sub-days, keeping pieces in order.
5. All capacity decisions use RAW VISIT TIME — the 15 % overhead in
   _cluster_time_budget is used only for scheduling, never for split
   decisions.
6. Honour the user's total_days constraint; spare days become free days.

Output: a list of day-groups, each being a list of attraction indices.
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
    NOT used for capacity / split decisions — use visit time directly instead.
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
    Assigns attractions to days, returning a list of day-groups.

    Geography is the primary constraint: attractions within 2 km of each
    other are bundled together and must share a day.  Visit-time limits are
    enforced secondarily and only cause splits when a bundle exceeds
    max_hours_per_day × 1.5.

    Parameters
    ----------
    cluster_labels : np.ndarray
        DBSCAN cluster id per attraction (0-based index).
    cluster_summary : dict
        Output of clustering.cluster_summary() – uses 0-based attraction indices.
    coords : list of (lat, lon) tuples
        Geographic coordinates for each attraction (0-based, excludes hotel).
    priorities : list of float
        Priority scores per attraction (0-based).
    durations : list of int
        Visit duration in minutes per attraction (0-based).
    time_matrix : np.ndarray
        (n+1)×(n+1) matrix where index 0 = hotel; attractions start at 1.
    max_activities_per_day : int
        Soft cap on attractions per day (exceeded only when all activities ≤1h).
    pacing_mode : str
        One of "compact", "balanced", "relaxed", "intensive".
    """

    # Two attractions within this distance are forced into the same bundle
    GEO_BUNDLE_THRESHOLD_KM: float = 2.0
    # Bundle is split across consecutive days only when visit > max_hours × this
    SPLIT_THRESHOLD_MULTIPLIER: float = 1.5
    # Pass-1 placement: prefer days whose content centroid is within this range
    GEO_CLOSE_KM: float = 5.0
    # Pass-2 placement: allow days whose content centroid is within this range
    GEO_MODERATE_KM: float = 15.0

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
        self.coords = coords          # (lat, lon) per attraction, 0-based
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

        # Build geographic bundles (2 km union-find on top of DBSCAN)
        self._bundle_labels: np.ndarray = self._build_geographic_bundles()
        self._bundle_summary: dict = self._build_bundle_summary()

        # Reverse map: 0-based attraction index → bundle id (used for integrity)
        self._attr_cluster: Dict[int, int] = {
            i: int(self._bundle_labels[i]) for i in range(len(self._bundle_labels))
        }

    # ── public entry point ────────────────────────────────────────────────────

    def allocate(self) -> Tuple[List[List[int]], List[int]]:
        """
        Returns (day_groups, free_day_numbers).

        day_groups[d]     = [attraction_idx, ...]
        free_day_numbers  = 1-based day numbers that have no planned activities
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

        self.warnings.extend(self._validate_micro_cluster_integrity(day_groups))
        free_days = self._compute_free_days(day_groups)
        return day_groups, free_days

    # ── geographic bundle construction ────────────────────────────────────────

    def _approx_km(
        self, lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """Fast Euclidean approximation of distance in km (accurate to ±5 % in cities)."""
        mid_lat = math.radians((lat1 + lat2) / 2)
        dlat = (lat2 - lat1) * 111.0
        dlon = (lon2 - lon1) * 111.0 * math.cos(mid_lat)
        return math.sqrt(dlat * dlat + dlon * dlon)

    def _are_geographically_close(
        self, i: int, j: int, threshold_km: float = GEO_BUNDLE_THRESHOLD_KM
    ) -> bool:
        """True if attractions i and j are within threshold_km of each other."""
        lat1, lon1 = self.coords[i]
        lat2, lon2 = self.coords[j]
        return self._approx_km(lat1, lon1, lat2, lon2) <= threshold_km

    def _build_geographic_bundles(self) -> np.ndarray:
        """
        Merge DBSCAN micro-clusters into geographic bundles using Union-Find.

        Two attractions are in the same bundle if:
        - They share a DBSCAN micro-cluster label, OR
        - They are within GEO_BUNDLE_THRESHOLD_KM (2 km) of each other.

        This ensures that walking-distance neighbours always share a day,
        even if DBSCAN used a tighter epsilon.
        """
        n = len(self.coords)
        parent = list(range(n))

        def find(x: int) -> int:
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        def union(x: int, y: int) -> None:
            px, py = find(x), find(y)
            if px != py:
                parent[px] = py

        # Step 1: union same DBSCAN cluster members
        label_to_members: Dict[int, List[int]] = {}
        for i, lbl in enumerate(self.labels):
            label_to_members.setdefault(int(lbl), []).append(i)
        for members in label_to_members.values():
            for k in range(1, len(members)):
                union(members[0], members[k])

        # Step 2: union attractions within 2 km (regardless of DBSCAN label)
        for i in range(n):
            for j in range(i + 1, n):
                if self._are_geographically_close(i, j):
                    union(i, j)

        # Assign canonical bundle IDs
        roots: Dict[int, int] = {}
        next_id = 0
        bundle_labels = np.zeros(n, dtype=int)
        for i in range(n):
            r = find(i)
            if r not in roots:
                roots[r] = next_id
                next_id += 1
            bundle_labels[i] = roots[r]

        return bundle_labels

    def _build_bundle_summary(self) -> dict:
        """Build a cluster_summary-compatible dict keyed by bundle_id."""
        summary: Dict[int, dict] = {}
        for idx, bid in enumerate(self._bundle_labels):
            bid = int(bid)
            if bid not in summary:
                summary[bid] = {
                    "bundle_id": bid,
                    "attraction_indices": [],
                    "centroid_lat": 0.0,
                    "centroid_lon": 0.0,
                    "total_visit_minutes": 0,
                    "avg_priority": 0.0,
                    "size": 0,
                }
            s = summary[bid]
            s["attraction_indices"].append(idx)
            s["total_visit_minutes"] += self.durations[idx]
            s["size"] += 1

        for bid, s in summary.items():
            idxs = s["attraction_indices"]
            lats = [self.coords[i][0] for i in idxs]
            lons = [self.coords[i][1] for i in idxs]
            pris = [self.priorities[i] for i in idxs]
            s["centroid_lat"] = float(np.mean(lats))
            s["centroid_lon"] = float(np.mean(lons))
            s["avg_priority"] = float(np.mean(pris))

        return summary

    # ── private helpers ───────────────────────────────────────────────────────

    def _ordered_bundles(self) -> List[int]:
        """
        Order bundles for assignment.
        Larger bundles first (geographic groups before singletons).
        Tie-break by descending average priority.
        """
        return sorted(
            self._bundle_summary.keys(),
            key=lambda bid: (
                -self._bundle_summary[bid]["size"],
                -self._bundle_summary[bid]["avg_priority"],
            ),
        )

    def _balanced_target_visit(self) -> int:
        """Per-day VISIT-TIME target: total visit / total_days, capped at max_minutes."""
        total_visit = sum(self.durations)
        per_day = total_visit / max(1, self.total_days)
        return max(60, min(self.max_minutes, round(per_day)))

    def _day_visit_minutes(self, day: List[int]) -> int:
        return sum(self.durations[i] for i in day)

    def _cluster_visit_minutes(self, indices: List[int]) -> int:
        return sum(self.durations[i] for i in indices)

    def _centroid(self, indices: List[int]) -> Tuple[float, float]:
        lats = [self.coords[i][0] for i in indices]
        lons = [self.coords[i][1] for i in indices]
        return (sum(lats) / len(lats), sum(lons) / len(lons))

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

    def _day_geo_dist(
        self,
        bundle_indices: List[int],
        d: int,
        day_groups: List[List[int]],
    ) -> float:
        """
        Distance in km from the bundle centroid to day d's content centroid.
        Returns 0.0 for empty days (treated as geographically neutral).
        """
        if not day_groups[d]:
            return 0.0
        blat, blon = self._centroid(bundle_indices)
        dlat, dlon = self._centroid(day_groups[d])
        return self._approx_km(blat, blon, dlat, dlon)

    def _geo_ranked_days(
        self,
        bundle_indices: List[int],
        day_groups: List[List[int]],
        day_visits: List[int],
    ) -> List[int]:
        """
        Sort day indices geography-first, load second.

        Occupied days come first (sorted by distance from bundle centroid to
        day centroid).  Empty days are appended at the end.

        This ensures singletons join the geographically nearest occupied day
        rather than the least-loaded day (which may be far away).
        """
        blat, blon = self._centroid(bundle_indices)

        occupied: List[int] = []
        empty: List[int] = []
        for d in range(self.total_days):
            if day_groups[d]:
                occupied.append(d)
            else:
                empty.append(d)

        def dist_to_day(d: int) -> float:
            dlat, dlon = self._centroid(day_groups[d])
            return self._approx_km(blat, blon, dlat, dlon)

        occupied.sort(key=lambda d: (dist_to_day(d), day_visits[d]))
        return occupied + empty

    # ── spread (balanced mode) ────────────────────────────────────────────────

    def _spread_across_days(self) -> List[List[int]]:
        """
        Geography-first, balanced allocation across total_days buckets.

        Allocation unit: GEOGRAPHIC BUNDLE (DBSCAN cluster ∪ 2 km proximity).

        Four passes (all use raw VISIT TIME, no 15 % overhead):

        Pass 1 – geographically close day (≤ GEO_CLOSE_KM) within target visit
                 OR empty day within target visit
        Pass 2 – geographically moderate day (≤ GEO_MODERATE_KM) within max_hours
                 OR empty day within max_hours
        Pass 3 – any day within max_hours (geographic fallback, capacity only)
        Pass 4 – bundle too large: split into CONSECUTIVE sub-groups

        The distance gates in Passes 1–2 prevent singletons from being placed
        on a geographically distant day just because it has spare load capacity.
        """
        ordered = self._ordered_bundles()
        target_visit = self._balanced_target_visit()

        day_groups: List[List[int]] = [[] for _ in range(self.total_days)]
        day_visits: List[int] = [0] * self.total_days
        day_activities: List[int] = [0] * self.total_days

        for bid in ordered:
            bundle_indices = self._bundle_summary[bid]["attraction_indices"]
            bundle_visit = self._cluster_visit_minutes(bundle_indices)
            placed = False

            # Geography-first ranking: closest occupied day first, empty days last
            ranked = self._geo_ranked_days(bundle_indices, day_groups, day_visits)

            # Pass 1: close (≤ GEO_CLOSE_KM or empty) AND target capacity
            for d in ranked:
                dist = self._day_geo_dist(bundle_indices, d, day_groups)
                if (dist <= self.GEO_CLOSE_KM
                        and day_visits[d] + bundle_visit <= target_visit
                        and self._acts_ok(d, day_groups, day_activities, bundle_indices)):
                    day_groups[d].extend(bundle_indices)
                    day_visits[d] += bundle_visit
                    day_activities[d] += len(bundle_indices)
                    placed = True
                    break

            # Pass 2: moderate proximity (≤ GEO_MODERATE_KM or empty) AND max_hours
            if not placed:
                for d in ranked:
                    dist = self._day_geo_dist(bundle_indices, d, day_groups)
                    if (dist <= self.GEO_MODERATE_KM
                            and day_visits[d] + bundle_visit <= self.max_minutes
                            and self._acts_ok(d, day_groups, day_activities, bundle_indices)):
                        day_groups[d].extend(bundle_indices)
                        day_visits[d] += bundle_visit
                        day_activities[d] += len(bundle_indices)
                        placed = True
                        break

            # Pass 3: any day with room (geographic fallback — no distance gate)
            if not placed:
                for d in ranked:
                    if (day_visits[d] + bundle_visit <= self.max_minutes
                            and self._acts_ok(d, day_groups, day_activities, bundle_indices)):
                        day_groups[d].extend(bundle_indices)
                        day_visits[d] += bundle_visit
                        day_activities[d] += len(bundle_indices)
                        placed = True
                        break

            # Pass 4: bundle too large — split into CONSECUTIVE sub-groups only
            if not placed and len(bundle_indices) > 1:
                sub_groups = self._split_cluster_into_subgroups(bundle_indices)
                window = self._find_consecutive_day_window(
                    sub_groups, day_visits, day_activities, day_groups, bid
                )
                for i, sub in enumerate(sub_groups):
                    d = window[i % len(window)]
                    day_groups[d].extend(sub)
                    day_visits[d] += self._cluster_visit_minutes(sub)
                    day_activities[d] += len(sub)
                placed = True

            if not placed:
                # Single oversized attraction: force onto least-loaded day
                d = min(range(self.total_days), key=lambda x: day_visits[x])
                day_groups[d].extend(bundle_indices)
                day_visits[d] += bundle_visit
                day_activities[d] += len(bundle_indices)

        return [g for g in day_groups if g]

    def _split_cluster_into_subgroups(
        self, cluster_indices: List[int]
    ) -> List[List[int]]:
        """
        Split a large bundle into sequential sub-groups.

        A bundle is only split when its VISIT TIME exceeds
        max_hours_per_day × SPLIT_THRESHOLD_MULTIPLIER (default 1.5 = 10.5 h).
        Each sub-group's visit time is kept ≤ max_hours_per_day.
        Preserves input order so geographically adjacent attractions stay together.
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
        bundle_id: int,
    ) -> List[int]:
        """
        Find the best consecutive window of len(sub_groups) day indices.

        Priority:
        1. Bundle-pure window that fits (all days empty or same bundle) → tier 1
        2. Fits capacity → tier 2
        3. Least-loaded consecutive window → tier 3
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
                all(self._attr_cluster.get(idx) == bundle_id for idx in day_groups[d])
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

    def _ordered_clusters(self) -> List[int]:
        """Order DBSCAN clusters for non-balanced packing."""
        if "group_nearby" in self.prefs:
            return sorted(self.c_summary.keys(),
                          key=lambda cid: self.c_summary[cid]["size"], reverse=True)
        return sorted(self.c_summary.keys(),
                      key=lambda cid: self.c_summary[cid]["avg_priority"], reverse=True)

    def _pack_clusters_into_days(self) -> List[List[int]]:
        """First-Fit-Decreasing bin-packing of clusters → days (non-balanced modes)."""
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
        Single-pass swap improvement: reduces std-dev of day load.
        Never swaps an attraction whose move would make its bundle span
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
        """
        True if moving attr_idx from from_day to to_day would cause its
        geographic bundle to span non-consecutive days.
        """
        my_bundle = self._attr_cluster.get(attr_idx)
        if my_bundle is None:
            return False

        cluster_days: set = set()
        for d_idx, day in enumerate(day_groups):
            if any(self._attr_cluster.get(i) == my_bundle for i in day):
                cluster_days.add(d_idx)

        from_still_has = any(
            self._attr_cluster.get(i) == my_bundle
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
        Any day whose total VISIT TIME exceeds max_hours_per_day gets split.
        Splitting respects geographic bundle integrity.
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
        Split a day's attractions into sub-groups respecting bundle membership.
        Capacity is measured by raw VISIT TIME.
        """
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
        """Warn if any geographic bundle appears on non-consecutive days."""
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
                        f"Bundle {cid} spans non-consecutive days: "
                        f"{[d + 1 for d in sorted_days]}"
                    )
        return warnings

    # ── trim / free days ─────────────────────────────────────────────────────

    def _trim_to_total_days(self, day_groups: List[List[int]]) -> List[List[int]]:
        """
        Merge days until len(day_groups) <= total_days.
        Prefers pairs whose combined VISIT TIME stays within max_minutes.
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
