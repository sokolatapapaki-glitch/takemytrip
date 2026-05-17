"""
Travel Itinerary Optimizer – FastAPI application.

Endpoints
---------
POST /api/optimize          Run the full optimization pipeline
GET  /api/datasets          List available built-in city datasets
GET  /api/datasets/{city}   Return attractions for a built-in city
GET  /health                Health check
"""

from __future__ import annotations
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from optimizer.models import OptimizeRequest, ItineraryResult
from optimizer.engine.optimizer import ItineraryOptimizer

app = FastAPI(
    title="Travel Itinerary Optimizer",
    description=(
        "Deterministic multi-day travel itinerary optimization using "
        "geographic clustering, 2-opt TSP routing, and constraint-based scheduling."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_DATA_DIR = Path(__file__).parent / "data"
_ROOT_DIR  = Path(__file__).parent.parent   # /home/user/takemytrip


# ── API routes (must be declared before the catch-all static mount) ───────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "travel-itinerary-optimizer"}


@app.get("/api/datasets")
def list_datasets():
    """List available built-in city attraction datasets."""
    if not _DATA_DIR.exists():
        return {"cities": []}
    cities = [f.stem for f in _DATA_DIR.glob("*.json")]
    return {"cities": sorted(cities)}


@app.get("/api/datasets/{city}")
def get_dataset(city: str):
    """Return attractions for a built-in city dataset."""
    path = _DATA_DIR / f"{city}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Dataset '{city}' not found.")
    with open(path) as f:
        return json.load(f)


@app.post("/api/optimize", response_model=ItineraryResult)
def optimize_itinerary(request: OptimizeRequest):
    """Run the full multi-day itinerary optimization pipeline."""
    if len(request.attractions) == 0:
        raise HTTPException(status_code=422, detail="At least one attraction is required.")
    if len(request.attractions) > 100:
        raise HTTPException(status_code=422, detail="Maximum 100 attractions per request.")

    optimizer = ItineraryOptimizer(request.attractions, request.settings)
    result = optimizer.run()
    return result


# ── Frontend HTML entry-point ─────────────────────────────────────────────────

@app.get("/optimizer", include_in_schema=False)
@app.get("/optimizer/", include_in_schema=False)
def serve_frontend():
    frontend = _ROOT_DIR / "itinerary-optimizer.html"
    if not frontend.exists():
        raise HTTPException(status_code=404, detail="Frontend not found.")
    return FileResponse(str(frontend), media_type="text/html")


@app.get("/", include_in_schema=False)
def root_redirect():
    return RedirectResponse(url="/optimizer")


# ── Static assets (CSS, JS and everything else in the repo root) ──────────────
# Mounted AFTER all explicit routes so it never shadows the API.
app.mount("/", StaticFiles(directory=str(_ROOT_DIR)), name="root_static")

