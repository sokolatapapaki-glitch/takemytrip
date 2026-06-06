"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` at import time, so the whole map experience is loaded
// CLIENT-ONLY via `ssr: false` (only valid inside a Client Component, hence this
// wrapper — same pattern as the planner's PlannerClient).
const MapExperience = dynamic(() => import("./components/MapExperience"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
      Loading map…
    </div>
  ),
});

export default function MapClient() {
  return <MapExperience />;
}
