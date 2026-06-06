"use client";

import "leaflet/dist/leaflet.css";

import { useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";
import type {
  Activity,
  VibeKey,
} from "@/app/components/ActivityCombinations/core/activities.functions";
import {
  ALL_CITIES,
  DEFAULT_FILTERS,
  cityOf,
  filterAndSort,
  type ActivityFilters,
} from "./mapData";
import { MapLayers } from "./MapLayers";
import { SearchSidebar } from "./SearchSidebar";
import { VibeBar } from "./VibeBar";
import { CityLabel } from "./CityLabel";
import { HoveredActivityCard } from "./HoveredActivityCard";

// Initial view: most of Western/Southern Europe, so every city pill is visible.
const INITIAL_CENTER: [number, number] = [44, 7];
const INITIAL_ZOOM = 5;
const ACTIVITY_ZOOM = 12; // at/after this zoom, activity pins replace city pills

// The whole /map experience: an interactive Leaflet map with city/activity
// markers under a glass search sidebar, a vibe bar, and a current-city label.
// Loaded client-only (see MapClient) because Leaflet needs the browser.
export default function MapExperience() {
  const [filters, setFilters] = useState<ActivityFilters>(DEFAULT_FILTERS);
  const [clicked, setClicked] = useState<Activity | null>(null);
  const [centeredCity, setCenteredCity] = useState<string | null>(null);
  // The city the map is zoomed into (null when zoomed out) — scopes the results.
  const [focusedCityId, setFocusedCityId] = useState<string | null>(null);
  // The hovered activity + its on-screen position (for the floating card).
  const [hovered, setHovered] = useState<{ activity: Activity; x: number; y: number } | null>(
    null
  );
  const mapRef = useRef<LeafletMap | null>(null);
  // A short close delay lets the cursor travel from the pin onto the card
  // without it disappearing; hovering the card cancels it.
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };
  const scheduleHide = () => {
    cancelHide();
    hideTimer.current = setTimeout(() => setHovered(null), 160);
  };
  const showHover = (activity: Activity, x: number, y: number) => {
    cancelHide();
    setHovered({ activity, x, y });
  };

  // One filtered/sorted list feeds both the results and the map markers. When
  // zoomed into a city (and NOT actively searching by name), scope it to that
  // city's activities; a search query widens the search back to all cities.
  const results = useMemo(() => {
    const base = filterAndSort(filters);
    const scopeCityId = filters.query.trim() ? null : focusedCityId;
    if (!scopeCityId) return base;
    return base.filter((a) => cityOf(a)?.id === scopeCityId);
  }, [filters, focusedCityId]);

  // Open an activity's detail and fly the map to it (used by markers + results).
  const openActivity = (a: Activity) => {
    setClicked(a);
    const map = mapRef.current;
    if (map) {
      const z = Math.max(map.getZoom(), ACTIVITY_ZOOM);
      map.flyTo([a.coords.lat, a.coords.lng], z);
    }
  };

  // Clear any open detail when jumping to a new city.
  const onCityClick = () => setClicked(null);

  return (
    <div className="relative isolate flex-1">
      <MapContainer
        center={INITIAL_CENTER}
        zoom={INITIAL_ZOOM}
        zoomControl={false}
        className="absolute inset-0 z-0 h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapLayers
          activities={results}
          cities={ALL_CITIES}
          activityZoom={ACTIVITY_ZOOM}
          selectedName={clicked?.name ?? null}
          onCityClick={onCityClick}
          onActivityClick={openActivity}
          onActivityHover={showHover}
          onActivityHoverEnd={scheduleHide}
          onCenteredCity={setCenteredCity}
          onFocusedCity={setFocusedCityId}
          onMapReady={(map) => {
            mapRef.current = map;
          }}
        />
      </MapContainer>

      {/* Overlays. The wrapper ignores pointer events so the map stays draggable;
          each panel re-enables them for itself. */}
      <div className="pointer-events-none absolute inset-0 z-[1000]">
        <div className="pointer-events-auto absolute bottom-4 left-4 top-4">
          <SearchSidebar
            filters={filters}
            onFiltersChange={setFilters}
            results={results}
            clicked={clicked}
            selectedName={clicked?.name ?? null}
            onPick={openActivity}
            onCloseClicked={() => setClicked(null)}
          />
        </div>

        <div className="pointer-events-auto absolute left-1/2 top-4 -translate-x-1/2">
          <VibeBar
            active={filters.vibe}
            onChange={(vibe: VibeKey | null) => setFilters((f) => ({ ...f, vibe }))}
          />
        </div>

        <div className="pointer-events-auto absolute bottom-4 right-4">
          <CityLabel name={centeredCity} />
        </div>

        {/* Floating hover card — stays open while the cursor is over it, and
            clicking it opens the activity's detail. Positioned just above the pin. */}
        {hovered && (
          <div
            className="pointer-events-auto absolute z-[1100] -translate-x-1/2 -translate-y-full cursor-pointer pb-3"
            style={{ left: hovered.x, top: hovered.y }}
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
            onClick={() => {
              openActivity(hovered.activity);
              setHovered(null);
            }}
          >
            <div className="rounded-xl border border-white/60 bg-white/95 p-2 shadow-xl shadow-orange-900/10 backdrop-blur-md">
              <HoveredActivityCard activity={hovered.activity} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
