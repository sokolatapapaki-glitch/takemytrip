"""
Distance matrix computation using the Haversine formula.

Travel-time estimates are derived from mode-specific average speeds.
Optionally, an OSRM public API can be called for walking/driving times,
but the Haversine fallback is always available offline.
"""

from __future__ import annotations
import math
from typing import List, Tuple, Optional
import numpy as np

# km/h average speeds per transport mode
_SPEEDS: dict[str, float] = {
    "walking": 4.5,
    "cycling": 14.0,
    "public_transport": 22.0,
    "taxi": 35.0,
}

# Boarding / waiting overhead in minutes per trip
_OVERHEAD: dict[str, float] = {
    "walking": 0.0,
    "cycling": 2.0,
    "public_transport": 8.0,
    "taxi": 5.0,
}

EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in kilometres."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def travel_minutes(
    lat1: float, lon1: float,
    lat2: float, lon2: float,
    mode: str = "public_transport",
    walking_threshold_km: float = 0.6,
) -> Tuple[int, str]:
    """
    Estimate travel time between two points.

    Returns (minutes, effective_mode).  When the straight-line distance is
    below *walking_threshold_km* the mode is overridden to "walking".
    """
    dist_km = haversine_km(lat1, lon1, lat2, lon2)

    if dist_km <= walking_threshold_km:
        effective_mode = "walking"
    else:
        effective_mode = mode

    speed = _SPEEDS.get(effective_mode, 22.0)
    overhead = _OVERHEAD.get(effective_mode, 5.0)
    minutes = (dist_km / speed) * 60 + overhead
    return max(1, round(minutes)), effective_mode


def build_distance_matrix(
    coords: List[Tuple[float, float]],
    mode: str = "public_transport",
    walking_threshold_km: float = 0.6,
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Build symmetric time (minutes) and distance (km) matrices for *n* coords.

    Returns:
        time_matrix   – n×n int array of travel times in minutes
        dist_matrix   – n×n float array of distances in km
        mode_matrix   – n×n list of effective transport modes (flattened)
    """
    n = len(coords)
    time_matrix = np.zeros((n, n), dtype=np.int32)
    dist_matrix = np.zeros((n, n), dtype=np.float64)
    mode_matrix: list[str] = [""] * (n * n)

    for i in range(n):
        for j in range(i + 1, n):
            lat1, lon1 = coords[i]
            lat2, lon2 = coords[j]
            dist = haversine_km(lat1, lon1, lat2, lon2)
            mins, eff_mode = travel_minutes(lat1, lon1, lat2, lon2, mode, walking_threshold_km)

            dist_matrix[i, j] = dist_matrix[j, i] = dist
            time_matrix[i, j] = time_matrix[j, i] = mins
            mode_matrix[i * n + j] = mode_matrix[j * n + i] = eff_mode

    return time_matrix, dist_matrix, mode_matrix


def walking_minutes_between(
    lat1: float, lon1: float,
    lat2: float, lon2: float,
) -> int:
    """Pure walking time, ignoring the transport mode override."""
    dist_km = haversine_km(lat1, lon1, lat2, lon2)
    return max(1, round((dist_km / _SPEEDS["walking"]) * 60))
