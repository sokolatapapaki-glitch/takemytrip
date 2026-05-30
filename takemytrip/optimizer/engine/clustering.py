"""
Geographic clustering of attractions using DBSCAN.

Each cluster represents a walkable/compact neighborhood of sights.
Cluster-coherent days minimize pointless cross-city travel.

eps=0.02 degrees (Euclidean) ≈ 2.2 km at equator.  This is the single
source of truth for geographic grouping — no additional runtime distance
calculations are needed in the allocator.
"""

from __future__ import annotations
from typing import List, Tuple
import numpy as np
from sklearn.cluster import DBSCAN


def cluster_attractions(
    coords: List[Tuple[float, float]],
    epsilon_degrees: float = 0.02,
    min_samples: int = 1,
) -> np.ndarray:
    """
    Cluster (lat, lon) coordinates into geographic neighborhoods.

    Uses Euclidean distance on raw degree coordinates.
    *epsilon_degrees* = 0.02 ≈ 2.2 km at the equator (accurate to ±5% in cities).
    *min_samples* = 1 means every point belongs to some cluster (no noise).

    Returns an integer array of cluster labels, one per attraction.
    Noise points (label -1) are reassigned to unique singleton cluster IDs.
    """
    if len(coords) == 0:
        return np.array([], dtype=int)

    if len(coords) == 1:
        return np.array([0], dtype=int)

    db = DBSCAN(eps=epsilon_degrees, min_samples=min_samples, metric="euclidean")
    raw_labels = db.fit_predict(np.array(coords, dtype=float))

    # Reassign noise points (-1) to unique new cluster IDs
    labels = raw_labels.copy()
    next_id = labels.max() + 1
    for idx, lbl in enumerate(labels):
        if lbl == -1:
            labels[idx] = next_id
            next_id += 1

    return labels


def cluster_summary(
    labels: np.ndarray,
    coords: List[Tuple[float, float]],
    priorities: List[float],
    durations: List[int],
) -> dict:
    """
    Summarize each cluster: centroid, total duration, average priority.

    Returns a dict keyed by cluster_id.
    """
    summary: dict[int, dict] = {}
    for idx, cid in enumerate(labels):
        if cid not in summary:
            summary[cid] = {
                "cluster_id": int(cid),
                "attraction_indices": [],
                "centroid_lat": 0.0,
                "centroid_lon": 0.0,
                "total_duration_minutes": 0,
                "avg_priority": 0.0,
                "size": 0,
            }
        s = summary[cid]
        s["attraction_indices"].append(idx)
        s["total_duration_minutes"] += durations[idx]
        s["size"] += 1

    for cid, s in summary.items():
        idxs = s["attraction_indices"]
        lats = [coords[i][0] for i in idxs]
        lons = [coords[i][1] for i in idxs]
        pris = [priorities[i] for i in idxs]
        s["centroid_lat"] = float(np.mean(lats))
        s["centroid_lon"] = float(np.mean(lons))
        s["avg_priority"] = float(np.mean(pris))

    return summary


def order_clusters_by_priority(cluster_summary: dict) -> List[int]:
    """Return cluster IDs sorted by descending average priority score."""
    return sorted(
        cluster_summary.keys(),
        key=lambda cid: cluster_summary[cid]["avg_priority"],
        reverse=True,
    )
