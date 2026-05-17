# Travel Itinerary Optimizer

A deterministic multi-day travel itinerary planning engine.  
**No AI/LLMs** — only geographic clustering, constraint-based scheduling, and 2-opt TSP optimization.

---

## Architecture

```
optimizer/
├── main.py               ← FastAPI app & endpoints
├── models.py             ← Pydantic input/output models
├── requirements.txt      ← Python dependencies
├── engine/
│   ├── distance.py       ← Haversine distance matrix
│   ├── clustering.py     ← DBSCAN geographic clustering
│   ├── allocator.py      ← Multi-day bin-packing allocator
│   ├── route_optimizer.py← 2-opt TSP + Or-opt
│   ├── scheduler.py      ← Opening hours constraint scheduler
│   ├── scorer.py         ← Multi-objective scoring engine
│   └── optimizer.py      ← Main pipeline orchestrator
└── data/
    ├── paris.json        ← 15 Paris attractions
    ├── rome.json         ← 12 Rome attractions
    └── barcelona.json    ← 10 Barcelona attractions

itinerary-optimizer.html  ← Frontend (served at /optimizer)
itinerary-optimizer.js    ← Frontend JavaScript
itinerary-optimizer.css   ← Frontend styles
```

---

## Quick Start

### 1. Install dependencies

```bash
cd /path/to/takemytrip
pip install -r optimizer/requirements.txt
```

### 2. Start the API server

```bash
python -m uvicorn optimizer.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Open the UI

Visit: [http://localhost:8000/optimizer](http://localhost:8000/optimizer)

### 4. API docs

Visit: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/health` | Health check |
| `GET`  | `/api/datasets` | List available city datasets |
| `GET`  | `/api/datasets/{city}` | Get city attractions (paris/rome/barcelona) |
| `POST` | `/api/optimize` | Run full optimization pipeline |

### Example: Optimize Paris in 5 days

```bash
curl -X POST http://localhost:8000/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "attractions": [/* from /api/datasets/paris */],
    "settings": {
      "total_days": 5,
      "max_hours_per_day": 8.0,
      "hotel": {"latitude": 48.8566, "longitude": 2.3522, "name": "Central Hotel"},
      "transport_mode": "public_transport",
      "walking_tolerance_minutes": 30,
      "travel_style": "balanced",
      "preferences": ["group_nearby", "balanced_days"],
      "start_time": "09:00",
      "lunch_break_minutes": 60
    }
  }'
```

---

## Input Model: Attraction

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `title` | string | Display name |
| `latitude` | float | Geographic latitude |
| `longitude` | float | Geographic longitude |
| `duration_minutes` | int | Visit duration |
| `opening_hours` | object | `{open, close, days}` |
| `category` | string | museum/landmark/park/etc. |
| `priority_score` | float | 0–10 priority |
| `fixed_time` | string? | Mandatory visit time "HH:MM" |
| `preferred_time_of_day` | string | morning/afternoon/evening/any |
| `cost` | float | Entry cost (€) |

## Input Model: UserSettings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `total_days` | int | — | Total trip days available |
| `max_hours_per_day` | float | 8.0 | Max active hours per day |
| `hotel` | object | — | `{latitude, longitude, name}` |
| `transport_mode` | string | `public_transport` | walking/cycling/public_transport/taxi |
| `walking_tolerance_minutes` | float | 30 | Max daily walking tolerance |
| `travel_style` | string | `balanced` | relaxed/balanced/intensive |
| `preferences` | list | `[]` | See below |
| `start_time` | string | `09:00` | Daily start time |
| `lunch_break_minutes` | int | 60 | Lunch break duration |

### Preferences
- `minimize_walking` – reduce walking distance
- `minimize_transport` – prefer compact clusters
- `compact_itinerary` – tighter geographic grouping
- `balanced_days` – even load distribution
- `free_time` – lighter daily schedule
- `group_nearby` – prioritise cluster coherence

---

## Algorithm Details

### 1. Distance Matrix (`engine/distance.py`)
- Haversine great-circle distance between all pairs
- Speed model: walking 4.5 km/h · cycling 14 km/h · transit 22 km/h · taxi 35 km/h
- Boarding overhead: walking 0 min · transit 8 min · taxi 5 min
- Auto-downgrade to walking when distance ≤ threshold

### 2. DBSCAN Clustering (`engine/clustering.py`)
- Metric: Haversine (radians)
- Epsilon: 0.9 km (intensive) → 1.2 km (balanced) → 1.5 km (relaxed)
- min_samples = 1 (no noise points — every attraction in a cluster)
- Clusters are sorted by average priority score

### 3. Day Allocation (`engine/allocator.py`)
- **Phase 1**: First-Fit-Decreasing bin-packing of clusters into days
- **Phase 2**: Local-search swap improvement (20 iterations max) to balance day loads
- **Phase 3**: Split overloaded days (>115% capacity)
- **Phase 4**: Merge shortest days if more days required than available
- Days beyond required attraction capacity become "free days"

### 4. Route Optimization (`engine/route_optimizer.py`)
- **Seed**: Nearest-neighbour heuristic from hotel
- **2-opt**: Edge-swap improvement until no gain (≤200 iterations)
- **Or-opt**: Node/pair relocation for days with ≥5 attractions

### 5. Constraint Scheduling (`engine/scheduler.py`)
- Arrival time = departure from previous + travel time
- Opening hours check → wait if early, defer if late
- Fixed-time reservations respected with ±30 min tolerance
- Preferred time-of-day soft constraint (warns if violated)
- Lunch break inserted around midday

### 6. Scoring (`engine/scorer.py`)
Six weighted dimensions (weights adapt to travel style & preferences):

| Dimension | Description |
|-----------|-------------|
| Distance  | Travel fraction of total day time |
| Balance   | Std-dev of day durations |
| Fatigue   | Daily walking vs tolerance |
| Cluster   | Fraction of consecutive same-cluster pairs |
| Preference| User preference satisfaction |
| Priority  | Coverage of high-priority attractions |

---

## Adding a New City

Create `optimizer/data/<city>.json`:

```json
{
  "city": "Amsterdam",
  "country": "Netherlands",
  "hotel": { "name": "Canal Hotel", "latitude": 52.3676, "longitude": 4.9041 },
  "attractions": [
    {
      "id": "rijksmuseum",
      "title": "Rijksmuseum",
      "latitude": 52.3600,
      "longitude": 4.8852,
      "duration_minutes": 150,
      "opening_hours": { "open": "09:00", "close": "17:00", "days": [0,1,2,3,4,5,6] },
      "category": "museum",
      "priority_score": 9.5,
      "preferred_time_of_day": "morning",
      "cost": 22.5
    }
  ]
}
```

The city will automatically appear in the UI and API without code changes.

---

## Development

```bash
# Run with auto-reload
uvicorn optimizer.main:app --reload

# Run tests (if added)
pytest optimizer/tests/

# Check API interactively
open http://localhost:8000/docs
```
