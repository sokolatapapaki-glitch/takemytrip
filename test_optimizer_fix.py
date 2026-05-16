"""
Test script verifying the two fixes:
  1. Geographically close attractions land on the same day (cluster integrity).
  2. No day is overloaded with too many hours or activities.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from optimizer.models import Attraction, UserSettings, HotelLocation, OptimizeRequest
from optimizer.engine.optimizer import ItineraryOptimizer


# ── London dataset (real user data) ──────────────────────────────────────────

LONDON_ATTRACTIONS = [
    # South Kensington cluster (should always be same day)
    Attraction(id="nhm",  title="Natural History Museum",
               latitude=51.4967, longitude=-0.1764, duration_minutes=150, priority_score=9.0),
    Attraction(id="sci",  title="Science Museum",
               latitude=51.4978, longitude=-0.1745, duration_minutes=150, priority_score=8.5),
    Attraction(id="va",   title="Victoria and Albert Museum",
               latitude=51.4966, longitude=-0.1722, duration_minutes=120, priority_score=8.0),

    # Central London cluster
    Attraction(id="bm",   title="British Museum",
               latitude=51.5194, longitude=-0.1270, duration_minutes=150, priority_score=9.5),
    Attraction(id="ng",   title="National Gallery",
               latitude=51.5089, longitude=-0.1283, duration_minutes=120, priority_score=8.5),
    Attraction(id="covent", title="Covent Garden",
               latitude=51.5117, longitude=-0.1240, duration_minutes=90,  priority_score=7.5),

    # East-central London cluster (Sky Garden + Tower area — should be same day)
    Attraction(id="sky",  title="Sky Garden",
               latitude=51.5113, longitude=-0.0836, duration_minutes=90,  priority_score=8.0),
    Attraction(id="tow",  title="Tower of London",
               latitude=51.5081, longitude=-0.0759, duration_minutes=150, priority_score=9.0),
    Attraction(id="tb",   title="Tower Bridge",
               latitude=51.5055, longitude=-0.0754, duration_minutes=60,  priority_score=8.0),

    # South Bank cluster
    Attraction(id="tate", title="Tate Modern",
               latitude=51.5076, longitude=-0.0994, duration_minutes=120, priority_score=8.5),
    Attraction(id="eye",  title="London Eye",
               latitude=51.5033, longitude=-0.1196, duration_minutes=90,  priority_score=8.0),

    # North London
    Attraction(id="cam",  title="Camden Market",
               latitude=51.5415, longitude=-0.1431, duration_minutes=120, priority_score=7.0),
]

LONDON_HOTEL = HotelLocation(
    latitude=51.5074, longitude=-0.1278, name="Central London Hotel"
)

SETTINGS_4_DAYS = UserSettings(
    total_days=4,
    max_hours_per_day=7.0,
    max_activities_per_day=5,
    hotel=LONDON_HOTEL,
    transport_mode="public_transport",
    travel_style="balanced",
    pacing_mode="balanced",
    preferences=[],
)


def run_london_test():
    print("=" * 70)
    print("TEST 1 — London (4 days)")
    print("=" * 70)

    req = OptimizeRequest(attractions=LONDON_ATTRACTIONS, settings=SETTINGS_4_DAYS)
    optimizer = ItineraryOptimizer(req.attractions, req.settings)
    result = optimizer.run()

    # Print plan
    for day in result.days:
        names = [pa.attraction.title for pa in day.attractions]
        visit_mins = day.total_duration_minutes
        visit_hrs = visit_mins / 60
        n = len(day.attractions)
        cluster_ids = day.cluster_ids
        print(f"\nDay {day.day_number}  ({n} activities, {visit_hrs:.1f}h visit, "
              f"clusters={cluster_ids})")
        for pa in day.attractions:
            print(f"  • {pa.attraction.title}  [{pa.arrival_time}–{pa.departure_time}]")

    print(f"\nFree days: {result.free_days}")
    print(f"Score breakdown: {result.scoring_breakdown}")

    if result.warnings:
        print("\nWarnings:")
        for w in result.warnings:
            print(f"  ⚠  {w}")

    # ── Assertions ────────────────────────────────────────────────────────
    print("\n--- Assertions ---")

    # Build name→day map
    attr_day: dict = {}
    for day in result.days:
        for pa in day.attractions:
            attr_day[pa.attraction.id] = day.day_number

    # 1. NHM and Science Museum same day
    if "nhm" in attr_day and "sci" in attr_day:
        same = attr_day["nhm"] == attr_day["sci"]
        status = "PASS" if same else "FAIL"
        print(f"[{status}] NHM and Science Museum same day "
              f"(NHM=Day{attr_day.get('nhm','?')}, Sci=Day{attr_day.get('sci','?')})")
    else:
        print("[SKIP] NHM or Science Museum not in result")

    # 2. Sky Garden and Tower of London same day
    if "sky" in attr_day and "tow" in attr_day:
        same = attr_day["sky"] == attr_day["tow"]
        status = "PASS" if same else "FAIL"
        print(f"[{status}] Sky Garden and Tower of London same day "
              f"(Sky=Day{attr_day.get('sky','?')}, Tower=Day{attr_day.get('tow','?')})")
    else:
        print("[SKIP] Sky Garden or Tower of London not in result")

    # 3. No day has > 7h visit time
    over_hours = [d for d in result.days if d.total_duration_minutes > 7 * 60]
    status = "PASS" if not over_hours else "FAIL"
    print(f"[{status}] No day > 7h visit time "
          f"(worst: {max(d.total_duration_minutes for d in result.days)/60:.1f}h)")

    # 4. No day has > 5 activities (unless all ≤ 1h)
    for day in result.days:
        n = len(day.attractions)
        all_short = all(pa.attraction.duration_minutes <= 60 for pa in day.attractions)
        if n > 5 and not all_short:
            print(f"[FAIL] Day {day.day_number} has {n} activities and some > 1h")
        elif n > 5:
            print(f"[PASS] Day {day.day_number} has {n} activities but all ≤ 1h (allowed)")
        else:
            print(f"[PASS] Day {day.day_number} has {n} activities (≤ 5)")

    # 5. Check that specific geographic pairs remain together
    # Note: with 2km bundling, DBSCAN clusters may legitimately span 2-3
    # consecutive days (e.g. Eye bundled with Tate/Sky), so we check the
    # user-visible pairs rather than raw DBSCAN cluster IDs.
    geo_pairs = [
        ("sky", "tow", "Sky Garden", "Tower of London"),
        ("sky", "tb",  "Sky Garden", "Tower Bridge"),
        ("nhm", "sci", "NHM", "Science Museum"),
        ("nhm", "va",  "NHM", "V&A"),
    ]
    all_ok = True
    for id1, id2, n1, n2 in geo_pairs:
        if id1 in attr_day and id2 in attr_day:
            ok = attr_day[id1] == attr_day[id2]
            if not ok:
                all_ok = False
            print(f"[{'PASS' if ok else 'FAIL'}] {n1} + {n2} same day "
                  f"(Day{attr_day[id1]} vs Day{attr_day[id2]})")
    if all_ok:
        print("[PASS] All key geographic pairs on same day")


def run_dense_district_test():
    print("\n" + "=" * 70)
    print("TEST 2 — Dense district (South Kensington, 6 museums, 2-day trip)")
    print("=" * 70)

    museums = [
        Attraction(id=f"m{i}", title=f"South Ken Museum {i}",
                   latitude=51.496 + i * 0.001, longitude=-0.175 + i * 0.0005,
                   duration_minutes=120, priority_score=8.0)
        for i in range(6)
    ]

    settings = UserSettings(
        total_days=2,
        max_hours_per_day=7.0,
        max_activities_per_day=5,
        hotel=LONDON_HOTEL,
        transport_mode="walking",
        travel_style="balanced",
        pacing_mode="balanced",
    )

    optimizer = ItineraryOptimizer(museums, settings)
    result = optimizer.run()

    for day in result.days:
        n = len(day.attractions)
        hrs = day.total_duration_minutes / 60
        print(f"\nDay {day.day_number}  ({n} activities, {hrs:.1f}h)")
        for pa in day.attractions:
            print(f"  • {pa.attraction.title}")

    # Assertion: museums split across the 2 days (not all crammed into 1)
    day_counts = [len(d.attractions) for d in result.days]
    spread = len(result.days) >= 2 and all(c > 0 for c in day_counts)
    max_per_day = max(day_counts) if day_counts else 0
    status = "PASS" if spread and max_per_day <= 5 else "FAIL"
    print(f"\n[{status}] 6 museums split across {len(result.days)} days "
          f"(max per day: {max_per_day})")


def run_any_city_4day_test():
    print("\n" + "=" * 70)
    print("TEST 3 — Any-city diagnostic (cluster + load per day)")
    print("=" * 70)

    optimizer = ItineraryOptimizer(LONDON_ATTRACTIONS, SETTINGS_4_DAYS)
    result = optimizer.run()

    # Build cluster → attractions mapping for display
    from optimizer.engine.clustering import cluster_attractions, cluster_summary
    attr_coords = [(a.latitude, a.longitude) for a in LONDON_ATTRACTIONS]
    from optimizer.engine.optimizer import _epsilon_for_pacing, _epsilon_for_style
    eps = _epsilon_for_pacing(
        SETTINGS_4_DAYS.pacing_mode,
        _epsilon_for_style(SETTINGS_4_DAYS.travel_style)
    )
    import numpy as np
    labels = cluster_attractions(attr_coords, epsilon_km=eps)

    cluster_map: dict = {}
    for i, a in enumerate(LONDON_ATTRACTIONS):
        cid = int(labels[i])
        cluster_map.setdefault(cid, [])
        cluster_map[cid].append(a.title)

    print("\nCluster assignments:")
    for cid, names in sorted(cluster_map.items()):
        print(f"  Cluster {cid}: {names}")

    print()
    for day in result.days:
        n = len(day.attractions)
        hrs = day.total_duration_minutes / 60
        cluster_ids = day.cluster_ids
        ok_hours = "OK" if hrs <= 7 else "OVER"
        ok_acts = "OK" if n <= 5 else "OVER"
        print(f"Day {day.day_number}: {n} activities [{ok_acts}], "
              f"{hrs:.1f}h [{ok_hours}], clusters={cluster_ids}")
        for pa in day.attractions:
            cid = pa.cluster_id
            print(f"  • {pa.attraction.title}  (cluster {cid}, "
                  f"{pa.attraction.duration_minutes}min)")


def run_geography_priority_test():
    """User's specific 8-attraction scenario testing geography-first placement."""
    print("\n" + "=" * 70)
    print("TEST 4 — Geography priority (8 attractions, 4 days)")
    print("Expected: Tower+Sky same day | NHM+Science same day |")
    print("          Eye+SEA LIFE same day | Horniman NOT with Tussauds")
    print("=" * 70)

    attractions = [
        Attraction(id="tower",   title="Tower of London",
                   latitude=51.5081, longitude=-0.0759, duration_minutes=150,
                   priority_score=9.0),
        Attraction(id="sky",     title="Sky Garden",
                   latitude=51.5113, longitude=-0.0836, duration_minutes=90,
                   priority_score=8.0),
        Attraction(id="nhm",     title="Natural History Museum",
                   latitude=51.4967, longitude=-0.1764, duration_minutes=150,
                   priority_score=9.0),
        Attraction(id="sci",     title="Science Museum",
                   latitude=51.4978, longitude=-0.1745, duration_minutes=150,
                   priority_score=8.5),
        Attraction(id="tussaud", title="Madame Tussauds",
                   latitude=51.5235, longitude=-0.1543, duration_minutes=120,
                   priority_score=7.5),
        Attraction(id="horni",   title="Horniman Museum",
                   latitude=51.4466, longitude=-0.0424, duration_minutes=120,
                   priority_score=7.0),
        Attraction(id="eye",     title="London Eye",
                   latitude=51.5033, longitude=-0.1196, duration_minutes=90,
                   priority_score=8.0),
        Attraction(id="sea",     title="SEA LIFE London",
                   latitude=51.5051, longitude=-0.1194, duration_minutes=90,
                   priority_score=7.5),
    ]

    settings = UserSettings(
        total_days=4,
        max_hours_per_day=7.0,
        max_activities_per_day=5,
        hotel=LONDON_HOTEL,
        transport_mode="public_transport",
        travel_style="balanced",
        pacing_mode="balanced",
    )

    optimizer = ItineraryOptimizer(attractions, settings)
    result = optimizer.run()

    for day in result.days:
        n = len(day.attractions)
        hrs = day.total_duration_minutes / 60
        print(f"\nDay {day.day_number}  ({n} activities, {hrs:.1f}h visit, "
              f"clusters={day.cluster_ids})")
        for pa in day.attractions:
            print(f"  • {pa.attraction.title}")

    print(f"\nFree days: {result.free_days}")

    # ── Assertions ────────────────────────────────────────────────────────────
    attr_day: dict = {}
    for day in result.days:
        for pa in day.attractions:
            attr_day[pa.attraction.id] = day.day_number

    print("\n--- Assertions ---")

    def check_same(id1, id2, name1, name2):
        d1, d2 = attr_day.get(id1), attr_day.get(id2)
        ok = (d1 is not None and d1 == d2)
        print(f"[{'PASS' if ok else 'FAIL'}] {name1} + {name2} same day "
              f"(Day{d1} vs Day{d2})")

    def check_different(id1, id2, name1, name2):
        d1, d2 = attr_day.get(id1), attr_day.get(id2)
        ok = (d1 is not None and d2 is not None and d1 != d2)
        print(f"[{'PASS' if ok else 'FAIL'}] {name1} and {name2} on DIFFERENT days "
              f"(Day{d1} vs Day{d2})")

    check_same("tower", "sky",    "Tower of London", "Sky Garden")
    check_same("nhm",   "sci",    "Natural History Museum", "Science Museum")
    check_same("eye",   "sea",    "London Eye", "SEA LIFE")
    check_different("tussaud", "horni", "Madame Tussauds", "Horniman Museum")


if __name__ == "__main__":
    run_london_test()
    run_dense_district_test()
    run_any_city_4day_test()
    run_geography_priority_test()
