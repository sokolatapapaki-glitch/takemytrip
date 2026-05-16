"""
Geographic clustering of attractions using DBSCAN.

Each cluster represents a walkable/compact neighborhood of sights.
Cluster-coherent days minimize pointless cross-city travel.
"""

from __future__ import annotations
from typing import List, Tuple
import numpy as np
from sklearn.cluster import DBSCAN

# 1° of latitude ≈ 111 km → convert km threshold to radians for haversine metric
_KM_TO_RAD = 1.0 / 6371.0


def cluster_attractions(
    coords: List[Tuple[float, float]],
    epsilon_km: float = 1.2,
    min_samples: int = 1,
) -> np.ndarray:
    """
    Cluster (lat, lon) coordinates into geographic neighborhoods.

    *epsilon_km*  – maximum distance in km for two points to be neighbors.
    *min_samples* – DBSCAN minimum cluster size (1 = no noise, every point
                    belongs to some cluster).

    Returns an integer array of cluster labels, one per attraction.
    Noise points (label -1 from DBSCAN) are reassigned to singleton clusters.
    """
    if len(coords) == 0:
        return np.array([], dtype=int)

    if len(coords) == 1:
        return np.array([0], dtype=int)

    coords_rad = np.radians(coords)
    eps_rad = epsilon_km * _KM_TO_RAD

    db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric="haversine", algorithm="ball_tree")
    raw_labels = db.fit_predict(coords_rad)

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
