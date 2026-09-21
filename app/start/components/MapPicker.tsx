"use client";

// The Leaflet map used inside MapPickerModal to pick a personal start point.
// Leaflet touches `window` at import time, so this module is only ever loaded
// client-side (dynamic ssr:false from MapPickerModal).
//
// - Initially centred on the chosen destination (passed `center`).
// - `flyTo` (set when a suggestion is picked in the input) recentres the map.
// - Clicking anywhere on the map reports the coordinate (the modal then
//   reverse-geocodes it into an address).

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";

export type LatLng = { lat: number; lng: number };

// A small orange map-pin (divIcon, so we don't depend on Leaflet's bundled icon
// images). Anchored at the tip so the point sits exactly on the coordinate.
function pinIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<svg width="28" height="28" viewBox="0 0 24 24" fill="#f97316" stroke="#ffffff" stroke-width="1.5" aria-hidden="true">
      <path d="M12 2c-3.9 0-7 3.1-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.9-3.1-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5" fill="#ffffff" stroke="none"/>
    </svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

// Reports map clicks up to the modal.
function ClickCapture({ onPick }: { onPick: (c: LatLng) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

// Flies the map to `to` whenever it changes (a fresh object is passed each time a
// suggestion is chosen, so re-picking the same place still recentres).
function Recenter({ to }: { to: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (to) map.flyTo([to.lat, to.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [map, to]);
  return null;
}

// Fixes Leaflet's size once the modal has laid out (the container starts at the
// dimensions it had during the dynamic-import frame).
function FixSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function MapPicker({
  center,
  marker,
  flyTo,
  onMapClick,
}: {
  center: LatLng;
  marker: LatLng | null;
  flyTo: LatLng | null;
  onMapClick: (coords: LatLng) => void;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {marker && <Marker position={[marker.lat, marker.lng]} icon={pinIcon()} />}
      <ClickCapture onPick={onMapClick} />
      <Recenter to={flyTo} />
      <FixSize />
    </MapContainer>
  );
}
