"use client";

import { useEffect, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Marker, useMap, useMapEvents } from "react-leaflet";
import {
  distanceKm,
  type Activity,
} from "@/app/components/ActivityCombinations/core/activities.functions";
import type { City } from "@/app/components/ActivityCombinations/core/cities.data";
import { activityIcon, cityIcon } from "./markerIcons";
import { emojiOf } from "./mapData";

// The Leaflet layers + map-event wiring. Lives INSIDE <MapContainer>, so it can
// use the map hooks. Shows city pills when zoomed out and activity pins when
// zoomed in (>= activityZoom), reports the centred city for the corner label,
// and hands the map instance up so the sidebar can fly to a clicked result.
export function MapLayers({
  activities,
  cities,
  activityZoom,
  selectedName,
  onCityClick,
  onActivityClick,
  onActivityHover,
  onActivityHoverEnd,
  onCenteredCity,
  onFocusedCity,
  onMapReady,
}: {
  activities: Activity[];
  cities: City[];
  activityZoom: number;
  selectedName: string | null;
  onCityClick: (city: City) => void;
  onActivityClick: (a: Activity) => void;
  // Marker hover: reports the activity and its on-screen (container) position so
  // the parent can show a persistent, hoverable card above the pin.
  onActivityHover: (a: Activity, x: number, y: number) => void;
  onActivityHoverEnd: () => void;
  onCenteredCity: (name: string | null) => void;
  // The city we're zoomed into (nearest to centre, only once zoomed past the
  // activity threshold) — null when zoomed out. Used to scope the results list.
  onFocusedCity: (cityId: string | null) => void;
  onMapReady: (map: LeafletMap) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  // The city whose centre is nearest the current map centre → corner label, and
  // (when zoomed in) the focused city used to scope the results.
  const reportCentered = () => {
    const c = map.getCenter();
    const here = { lat: c.lat, lng: c.lng };
    let nearest: City | null = null;
    let best = Infinity;
    for (const city of cities) {
      const d = distanceKm(here, city.center);
      if (d < best) {
        best = d;
        nearest = city;
      }
    }
    onCenteredCity(nearest ? nearest.name : null);
    onFocusedCity(map.getZoom() >= activityZoom && nearest ? nearest.id : null);
  };

  useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
      reportCentered();
    },
    moveend: reportCentered,
  });

  // Hand the map up once, and report the initial centred city.
  useEffect(() => {
    onMapReady(map);
    reportCentered();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showActivities = zoom >= activityZoom;

  if (!showActivities) {
    return (
      <>
        {cities.map((city) => (
          <Marker
            key={city.id}
            position={[city.center.lat, city.center.lng]}
            icon={cityIcon(city.name, city.activities.length)}
            eventHandlers={{
              click: () => {
                map.flyTo([city.center.lat, city.center.lng], activityZoom + 1);
                onCityClick(city);
              },
            }}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {activities.map((a) => (
        <Marker
          key={a.name}
          position={[a.coords.lat, a.coords.lng]}
          icon={activityIcon(emojiOf(a), selectedName === a.name)}
          eventHandlers={{
            click: () => onActivityClick(a),
            mouseover: () => {
              const p = map.latLngToContainerPoint([a.coords.lat, a.coords.lng]);
              onActivityHover(a, p.x, p.y);
            },
            mouseout: () => onActivityHoverEnd(),
          }}
        />
      ))}
    </>
  );
}
