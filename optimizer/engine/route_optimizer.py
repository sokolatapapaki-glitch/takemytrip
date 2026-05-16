"""
Within-day route optimizer using 2-opt local search (TSP heuristic).

Given a list of attraction indices for a single day and a hotel start/end
location (index 0 in the extended time matrix), this module finds a good
visiting order that minimises total travel time.

Algorithm
---------
1. Build an initial tour using the nearest-neighbour heuristic starting from
   the hotel.
2. Apply 2-opt improvement until no swap reduces total travel time (or a
   maximum iteration cap is reached).
3. Optionally apply one round of 3-opt (Or-opt) for further improvement on
   days with ≥ 6 attractions.
"""

from __future__ import annotations
from typing import List, Tuple
import numpy as np


def _tour_cost(route: List[int], time_matrix: np.ndarray) -> int:
    """Total travel time for a route (including return from last node to 0)."""
    cost = 0
    for i in range(len(route) - 1):
        cost += time_matrix[route[i], route[i + 1]]
    return cost


def _nearest_neighbour(start: int, nodes: List[int], time_matrix: np.ndarray) -> List[int]:
    """Greedy nearest-neighbour tour starting from *start*."""
    unvisited = list(nodes)
    route = [start]
    current = start
    while unvisited:
        nearest = min(unvisited, key=lambda j: time_matrix[current, j])
        route.append(nearest)
        unvisited.remove(nearest)
        current = nearest
    return route


def _two_opt(route: List[int], time_matrix: np.ndarray, max_iter: int = 200) -> List[int]:
    """
    2-opt improvement loop.

    The route starts and ends at the hotel (index 0 in time_matrix).
    Swap pairs of edges when it reduces total cost.
    """
    best = route[:]
    best_cost = _tour_cost(best, time_matrix)
    improved = True
    iterations = 0

    while improved and iterations < max_iter:
        improved = False
        iterations += 1
        # i and k index into the *inner* segment (exclude hotel at position 0)
        for i in range(1, len(best) - 1):
            for k in range(i + 1, len(best)):
                new_route = best[:i] + best[i:k + 1][::-1] + best[k + 1:]
                new_cost = _tour_cost(new_route, time_matrix)
                if new_cost < best_cost:
                    best = new_route
                    best_cost = new_cost
                    improved = True
                    break
            if improved:
                break

    return best


def _or_opt(route: List[int], time_matrix: np.ndarray) -> List[int]:
    """
    Or-opt: try moving single nodes or 2-node segments to a better position.
    One pass only (fast improvement on top of 2-opt result).
    """
    best = route[:]
    best_cost = _tour_cost(best, time_matrix)

    for seg_len in (1, 2):
        improved = True
        while improved:
            improved = False
            for i in range(1, len(best) - seg_len):
                seg = best[i: i + seg_len]
                remaining = best[:i] + best[i + seg_len:]
                for j in range(1, len(remaining)):
                    candidate = remaining[:j] + seg + remaining[j:]
                    cost = _tour_cost(candidate, time_matrix)
                    if cost < best_cost - 1:
                        best = candidate
                        best_cost = cost
                        improved = True
                        break
                if improved:
                    break

    return best


def optimise_day_route(
    hotel_idx: int,
    day_attraction_indices: List[int],
    time_matrix: np.ndarray,
    apply_or_opt: bool = True,
) -> Tuple[List[int], int]:
    """
    Return the optimised visiting order and total travel time (minutes).

    The hotel is always the first node; attractions follow in optimised order.
    *hotel_idx* is the row/col index of the hotel in *time_matrix*.

    Returns
    -------
    route : List[int]
        Ordered attraction indices (hotel_idx first, no return trip appended).
    travel_time : int
        Total travel minutes for the optimised route.
    """
    if not day_attraction_indices:
        return [], 0

    if len(day_attraction_indices) == 1:
        return [hotel_idx] + day_attraction_indices, time_matrix[hotel_idx, day_attraction_indices[0]]

    # Build initial route
    initial = _nearest_neighbour(hotel_idx, list(day_attraction_indices), time_matrix)

    # 2-opt improvement
    improved = _two_opt(initial, time_matrix)

    # Or-opt for larger days
    if apply_or_opt and len(day_attraction_indices) >= 5:
        improved = _or_opt(improved, time_matrix)

    travel_time = _tour_cost(improved, time_matrix)
    return improved, travel_time
