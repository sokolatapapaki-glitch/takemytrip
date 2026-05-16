"""Pydantic data models for the Travel Itinerary Optimizer."""

from __future__ import annotations
from typing import Optional, List, Dict, Literal
from pydantic import BaseModel, Field


class OpeningHours(BaseModel):
    open: str = "00:00"   # "HH:MM"
    close: str = "23:59"  # "HH:MM"
    days: List[int] = Field(default_factory=lambda: list(range(7)))  # 0=Mon .. 6=Sun


class Attraction(BaseModel):
    id: str
    title: str
    latitude: float
    longitude: float
    duration_minutes: int = Field(ge=0)
    opening_hours: Optional[OpeningHours] = None
    category: str = "general"
    priority_score: float = Field(default=5.0, ge=0.0, le=10.0)
    fixed_time: Optional[str] = None      # "HH:MM" – mandatory visit time
    preferred_time_of_day: Literal["morning", "afternoon", "evening", "any"] = "any"
    cost: float = 0.0
    tags: List[str] = Field(default_factory=list)


class HotelLocation(BaseModel):
    latitude: float
    longitude: float
    name: str = "Hotel"


class UserSettings(BaseModel):
    total_days: int = Field(ge=1, le=30)
    max_hours_per_day: float = Field(default=8.0, ge=1.0, le=16.0)
    hotel: HotelLocation
    transport_mode: Literal["walking", "cycling", "public_transport", "taxi"] = "public_transport"
    walking_tolerance_minutes: float = Field(default=30.0, ge=0.0, le=120.0)
    travel_style: Literal["relaxed", "balanced", "intensive"] = "balanced"
    pacing_mode: Literal["compact", "balanced", "relaxed", "intensive"] = "balanced"
    preferences: List[Literal[
        "minimize_walking",
        "minimize_transport",
        "compact_itinerary",
        "balanced_days",
        "free_time",
        "group_nearby",
    ]] = Field(default_factory=list)
    start_time: str = "09:00"   # daily start time "HH:MM"
    lunch_break_minutes: int = 60
    city_name: str = ""


# ── Output models ────────────────────────────────────────────────────────────

class PlannedAttraction(BaseModel):
    attraction: Attraction
    arrival_time: str          # "HH:MM"
    departure_time: str        # "HH:MM"
    travel_to_next_minutes: int
    travel_to_next_mode: str
    walk_to_next_minutes: int
    cluster_id: int


class DayPlan(BaseModel):
    day_number: int
    date_label: str
    attractions: List[PlannedAttraction]
    total_duration_minutes: int
    total_travel_minutes: int
    total_walking_minutes: int
    total_cost: float
    optimization_score: float
    cluster_ids: List[int]
    notes: List[str] = Field(default_factory=list)


class ItineraryResult(BaseModel):
    days: List[DayPlan]
    free_days: List[int]           # day numbers with no/minimal activities
    total_attractions: int
    total_days_used: int
    overall_score: float
    scoring_breakdown: Dict[str, float]
    cluster_map: Dict[str, int]    # attraction_id -> cluster_id
    warnings: List[str] = Field(default_factory=list)


class OptimizeRequest(BaseModel):
    attractions: List[Attraction]
    settings: UserSettings
