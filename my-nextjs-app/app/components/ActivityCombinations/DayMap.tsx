"use client";

// A real Leaflet map of ONE day's route: the trip's start area as an "S" marker,
// each activity as a numbered pin at its exact coordinates, and an orange line
// connecting start → 1 → 2 → … in visiting order. Leaflet touches `window` at
// import time, so this module is only ever loaded client-side (dynamic ssr:false
// from DayMapModal).

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import type { Coords } from "./core/activities.functions";

export type MapStop = { name: string; coords: Coords };

// White text halo so the name label reads over any tiles (same trick as the
// main map's markers).
const HALO =
  "text-shadow: -1px -1px 1.5px #fff, 1px -1px 1.5px #fff, -1px 1px 1.5px #fff, 1px 1px 1.5px #fff;";

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// A round numbered pin with the place name beside it. `bg` is a literal Tailwind
// class (bg-orange-500 / bg-emerald-600) so the JIT keeps it. The icon box is the
// 28px circle and is anchored at its CENTRE (iconAnchor 14,14), so the marker's
// coordinate lands on the circle's centre — the route polyline (drawn through the
// same coordinates) then meets each circle dead centre. The name label is
// absolutely positioned, so it doesn't shift the circle off its point.
function pinIcon(label: string, name: string, bg: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="relative h-7 w-7">
      <div class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white ${bg} text-xs font-bold text-white shadow-md shadow-slate-900/30">${escapeHtml(label)}</div>
      <span class="absolute left-9 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-semibold leading-none text-zinc-800" style="${HALO}">${escapeHtml(name)}</span>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Fit the map to all points once they're known (or centre on a lone point).
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(points, { padding: [48, 48] });
  }, [map, points]);
  return null;
}

export default function DayMap({
  stops,
  start,
  circular = false,
}: {
  stops: MapStop[];
  start?: MapStop;
  // Circular day: the route returns to the start area after the last stop, so a
  // closing leg start → … → last → start is drawn.
  circular?: boolean;
}) {
  // The full ordered path: start (if any) → each stop in visiting order.
  const ordered: MapStop[] = start ? [start, ...stops] : stops;
  const points = ordered.map(
    (s) => [s.coords.lat, s.coords.lng] as [number, number]
  );
  // For a circular day, close the loop back to the start after the last stop.
  const linePoints =
    circular && start && stops.length > 0
      ? [...points, [start.coords.lat, start.coords.lng] as [number, number]]
      : points;
  const center = points[0] ?? ([37.9838, 23.7275] as [number, number]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* The route line, in visiting order (looped back to start when circular). */}
      {linePoints.length > 1 ? (
        <Polyline
          positions={linePoints}
          pathOptions={{ color: "#f97316", weight: 3, opacity: 0.9 }}
        />
      ) : null}

      {/* Start area marker. */}
      {start ? (
        <Marker
          position={[start.coords.lat, start.coords.lng]}
          icon={pinIcon("S", start.name, "bg-orange-500")}
        />
      ) : null}

      {/* Numbered activity markers at their exact coordinates. */}
      {stops.map((s, i) => (
        <Marker
          key={s.name}
          position={[s.coords.lat, s.coords.lng]}
          icon={pinIcon(String(i + 1), s.name, "bg-emerald-600")}
        />
      ))}

      <FitBounds points={points} />
    </MapContainer>
  );
}
