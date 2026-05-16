"""
Multi-objective scoring engine.

Produces a [0..100] score for a day or full itinerary based on:
  - distance_score      : how compact travel is (lower total km = higher score)
  - balance_score       : how evenly distributed activities are across days
  - fatigue_score       : walking + transport penalty
  - cluster_score       : how well days respect geographic clusters
  - preference_score    : how well the plan matches user preferences
  - priority_coverage   : ratio of high-priority attractions included

Weights are adjusted per user preference and travel style.
"""

from __future__ import annotations
from typing import List, Dict
import numpy as np

from optimizer.models import DayPlan, UserSettings
from optimizer.engine.distance import haversine_km


# Default weights (must sum to 1.0)
# "continuity" captures cross-day geographic partitioning quality;
# budget taken from "balance" and "cluster" which now share the role.
_BASE_WEIGHTS: Dict[str, float] = {
    "distance":    0.25,
    "balance":     0.15,
    "fatigue":     0.20,
    "cluster":     0.10,
    "preference":  0.10,
    "priority":    0.10,
    "continuity":  0.10,
}


def _apply_preference_weights(
    weights: Dict[str, float],
    preferences: List[str],
    style: str,
    pacing_mode: str = "balanced",
) -> Dict[str, float]:
    w = weights.copy()

    if "minimize_walking" in preferences:
        w["fatigue"] += 0.10
        w["distance"] -= 0.05
        w["balance"] -= 0.05

    if "minimize_transport" in preferences:
        w["distance"] += 0.05
        w["cluster"] += 0.05
        w["continuity"] += 0.05
        w["balance"] -= 0.10
        w["preference"] -= 0.05

    if "balanced_days" in preferences:
        w["balance"] += 0.10
        w["distance"] -= 0.05
        w["fatigue"] -= 0.05

    if "compact_itinerary" in preferences:
        w["cluster"] += 0.05
        w["continuity"] += 0.05
        w["distance"] += 0.05
        w["balance"] -= 0.10
        w["preference"] -= 0.05

    if style == "relaxed":
        w["fatigue"] += 0.05
        w["priority"] -= 0.05
    elif style == "intensive":
        w["priority"] += 0.05
        w["fatigue"] -= 0.05

    # Pacing-mode adjustments: shift objective focus to match distribution strategy
    if pacing_mode == "compact":
        w["cluster"]     += 0.05
        w["continuity"]  += 0.05
        w["distance"]    += 0.05
        w["balance"]     -= 0.10
        w["preference"]  -= 0.05
    elif pacing_mode == "balanced":
        w["balance"]     += 0.10
        w["continuity"]  += 0.05
        w["cluster"]     -= 0.05
        w["distance"]    -= 0.05
        w["fatigue"]     -= 0.05
    elif pacing_mode == "relaxed":
        w["fatigue"]     += 0.15
        w["preference"]  += 0.05
        w["priority"]    -= 0.10
        w["distance"]    -= 0.10
    elif pacing_mode == "intensive":
        w["priority"]    += 0.10
        w["continuity"]  += 0.05
        w["cluster"]     += 0.05
        w["fatigue"]     -= 0.15
        w["preference"]  -= 0.05

    # Normalise so weights sum to 1
    total = sum(w.values())
    return {k: max(0.0, v / total) for k, v in w.items()}


class ItineraryScorer:
    """
    Computes per-day and overall scores.

    Parameters
    ----------
    settings : UserSettings
    cluster_labels : np.ndarray – cluster_id per attraction (indexed 0..n-1)
    """

    def __init__(self, settings: UserSettings, cluster_labels: np.ndarray):
        self.settings = settings
        self.cluster_labels = cluster_labels
        self.weights = _apply_preference_weights(
            _BASE_WEIGHTS,
            settings.preferences,
            settings.travel_style,
            getattr(settings, "pacing_mode", "balanced"),
        )

    # ── per-day score ─────────────────────────────────────────────────────────

    def score_day(self, day: DayPlan, avg_day_duration: float) -> float:
        """Return a [0..100] score for a single day plan."""
        if not day.attractions:
            return 100.0   # empty/free day is "perfect"

        # Distance score: travel fraction of total day time
        total_time = day.total_duration_minutes + day.total_travel_minutes
        travel_ratio = day.total_travel_minutes / max(1, total_time)
        distance_score = max(0.0, 100 - travel_ratio * 150)

        # Balance score vs average
        deviation = abs(day.total_duration_minutes - avg_day_duration)
        balance_score = max(0.0, 100 - (deviation / max(1, avg_day_duration)) * 100)

        # Fatigue score: walking + many transport legs penalty
        max_walk = self.settings.walking_tolerance_minutes
        walk_penalty = min(100, (day.total_walking_minutes / max(1, max_walk)) * 100)
        fatigue_score = max(0.0, 100 - walk_penalty * 0.6
                            - (len(day.attractions) / 10.0) * 40)

        # Cluster score: fraction of same-cluster pairs visited consecutively
        cluster_score = self._cluster_coherence_score(day)

        return round(
            self.weights["distance"] * distance_score
            + self.weights["balance"] * balance_score
            + self.weights["fatigue"] * fatigue_score
            + self.weights["cluster"] * cluster_score,
            1,
        )

    def _cluster_coherence_score(self, day: DayPlan) -> float:
        if len(day.attractions) < 2:
            return 100.0
        cids = [pa.cluster_id for pa in day.attractions]
        same = sum(1 for a, b in zip(cids, cids[1:]) if a == b)
        return 100.0 * same / (len(cids) - 1)

    def _cross_day_continuity_score(self, days: List[DayPlan]) -> float:
        """
        Measure how well the itinerary partitions the city across days.

        Computes a geographic centroid for each day from its attractions'
        coordinates, then evaluates pairwise centroid distances.  Days that
        cover the same city area (centroids < 2 km apart) are penalised as
        district revisits.  The score is 100 when every pair of days is
        geographically well-separated, dropping toward 0 as more day-pairs
        share the same urban corridor.

        This is destination-independent: it uses only coordinates, not names.
        """
        if len(days) <= 1:
            return 100.0

        centroids = []
        for day in days:
            lats = [pa.attraction.latitude for pa in day.attractions]
            lons = [pa.attraction.longitude for pa in day.attractions]
            if lats:
                centroids.append((sum(lats) / len(lats), sum(lons) / len(lons)))

        if len(centroids) <= 1:
            return 100.0

        pair_distances = [
            haversine_km(centroids[i][0], centroids[i][1],
                         centroids[j][0], centroids[j][1])
            for i in range(len(centroids))
            for j in range(i + 1, len(centroids))
        ]

        if not pair_distances:
            return 100.0

        # Days whose centroids are ≥ 2 km apart are considered well-separated.
        SEPARATION_KM = 2.0
        well_separated = sum(1 for d in pair_distances if d >= SEPARATION_KM)
        separation_ratio = well_separated / len(pair_distances)

        # Bonus for high average inter-day spread (city cleanly decomposed).
        avg_sep = sum(pair_distances) / len(pair_distances)
        avg_bonus = min(20.0, avg_sep * 3.0)  # ~6.7 km avg → full bonus

        return min(100.0, separation_ratio * 80.0 + avg_bonus)

    # ── overall score ─────────────────────────────────────────────────────────

    def score_itinerary(
        self,
        days: List[DayPlan],
        all_attraction_priorities: List[float],
        planned_priorities: List[float],
    ) -> Dict[str, float]:
        """
        Compute the overall itinerary score and a breakdown dict.

        Returns a dict with 'overall' key and one key per scoring dimension.
        """
        if not days:
            return {"overall": 0.0}

        active_days = [d for d in days if d.attractions]
        if not active_days:
            return {"overall": 100.0}

        avg_duration = np.mean([d.total_duration_minutes for d in active_days])

        # Per-day scores aggregated
        day_scores = [self.score_day(d, avg_duration) for d in active_days]
        avg_day_score = float(np.mean(day_scores))

        # Balance across days
        durations = [d.total_duration_minutes for d in active_days]
        balance_score = max(0.0, 100.0 - float(np.std(durations)) / max(1, avg_duration) * 100)

        # Priority coverage
        if all_attraction_priorities:
            sorted_all = sorted(all_attraction_priorities, reverse=True)
            top_n = max(1, len(sorted_all) // 2)
            top_priorities = set(sorted_all[:top_n])
            covered = sum(1 for p in planned_priorities if p in top_priorities)
            priority_score = min(100.0, (covered / len(top_priorities)) * 100)
        else:
            priority_score = 100.0

        # Aggregate fatigue – compare each day's walking vs daily tolerance
        daily_fatigue = []
        for d in active_days:
            ratio = d.total_walking_minutes / max(1, self.settings.walking_tolerance_minutes)
            daily_fatigue.append(max(0.0, 100.0 - ratio * 80))
        fatigue_score = float(np.mean(daily_fatigue))

        # Cluster coherence averaged (intra-day)
        cluster_score = np.mean([self._cluster_coherence_score(d) for d in active_days])

        # Cross-day geographic continuity (inter-day district partitioning)
        continuity_score = self._cross_day_continuity_score(active_days)

        # Preference matching (soft heuristic)
        preference_score = self._preference_match_score(active_days)

        breakdown = {
            "distance": round(avg_day_score, 1),
            "balance": round(balance_score, 1),
            "fatigue": round(fatigue_score, 1),
            "cluster": round(float(cluster_score), 1),
            "preference": round(preference_score, 1),
            "priority": round(priority_score, 1),
            "continuity": round(continuity_score, 1),
        }

        overall = sum(self.weights[k] * v for k, v in breakdown.items())
        breakdown["overall"] = round(overall, 1)
        return breakdown

    def _preference_match_score(self, days: List[DayPlan]) -> float:
        score = 80.0   # baseline
        prefs = self.settings.preferences

        if "free_time" in prefs:
            avg_daily = np.mean([d.total_duration_minutes for d in days])
            if avg_daily < self.settings.max_hours_per_day * 60 * 0.8:
                score += 20.0

        if "balanced_days" in prefs:
            durations = [d.total_duration_minutes for d in days]
            cv = float(np.std(durations)) / max(1, float(np.mean(durations)))
            score += max(0.0, 20.0 - cv * 40)

        return min(100.0, score)
