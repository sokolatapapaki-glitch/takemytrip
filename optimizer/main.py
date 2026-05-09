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
import os
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from optimizer.models import OptimizeRequest, ItineraryResult, Attraction
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

# ── static frontend ───────────────────────────────────────────────────────────

_ROOT_DIR = Path(__file__).parent.parent

# Mount the optimizer's own static assets
_STATIC_DIR = _ROOT_DIR / "optimizer-frontend"
if _STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(_STATIC_DIR)), name="static")


# ── routes ────────────────────────────────────────────────────────────────────

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
    """
    Run the full multi-day itinerary optimization pipeline.

    - Clusters attractions geographically (DBSCAN)
    - Allocates clusters to days (bin-packing + balance improvement)
    - Optimises daily routes (2-opt TSP)
    - Schedules visits with opening hours & constraints
    - Scores the complete itinerary
    """
    if len(request.attractions) == 0:
        raise HTTPException(status_code=422, detail="At least one attraction is required.")

    if len(request.attractions) > 100:
        raise HTTPException(status_code=422, detail="Maximum 100 attractions per request.")

    optimizer = ItineraryOptimizer(request.attractions, request.settings)
    result = optimizer.run()
    return result


# ── frontend entrypoint ───────────────────────────────────────────────────────

@app.get("/optimizer", include_in_schema=False)
@app.get("/optimizer/", include_in_schema=False)
def serve_frontend():
    frontend = _ROOT_DIR / "itinerary-optimizer.html"
    if frontend.exists():
        return FileResponse(str(frontend))
    raise HTTPException(status_code=404, detail="Frontend not found.")


@app.get("/", include_in_schema=False)
def root_redirect():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/optimizer")
