"use client";

// Full-screen (mobile) / centred fixed modal (desktop) for picking a personal
// start point on a Leaflet map. Opened from the address step of DestinationModal.
//
// - The address/hotel input sits at the top (same StartPointSearch as the address
//   step). Choosing a suggestion recentres the map there and drops the pin.
// - Clicking anywhere on the map selects that spot automatically (reverse-geocoded
//   into an address via Nominatim).
// - "Επιλογή" confirms the current pin (top-right on desktop, full-width bottom
//   on mobile); the top-right X / Esc / backdrop close without selecting.
// - The map opens centred on the chosen destination.

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaXmark } from "react-icons/fa6";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
import {
  StartPointSearch,
  type StartPoint,
} from "@/app/components/ActivityCombinations/StartPointSearch";
import type { LatLng } from "./MapPicker";

// Leaflet can't render on the server, so the map is loaded client-only.
const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
      Φόρτωση χάρτη…
    </div>
  ),
});

export function MapPickerModal({
  cityName,
  cityCenter,
  initialPoint,
  onSelect,
  onClose,
}: {
  cityName: string;
  cityCenter: LatLng;
  // The point already chosen (if any), so reopening shows its pin.
  initialPoint?: StartPoint | null;
  onSelect: (point: StartPoint) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<StartPoint | null>(initialPoint ?? null);
  // A fresh object each input-pick so MapPicker recentres even on a repeat.
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);
  // Latest-wins guard for the async reverse-geocode of a map click.
  const reqId = useRef(0);

  // Esc closes; lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // A suggestion picked in the input: centre the map there + drop the pin.
  const onInputSelect = (point: StartPoint) => {
    setPicked(point);
    setFlyTarget({ ...point.coords });
  };

  // A map click: place the pin immediately, then reverse-geocode for a label.
  const onMapClick = (coords: LatLng) => {
    const id = ++reqId.current;
    setPicked({ name: "Επιλεγμένο σημείο", coords });
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18` +
      `&lat=${coords.lat}&lon=${coords.lng}`;
    fetch(url, { headers: { "Accept-Language": "el" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { display_name?: string } | null) => {
        if (id !== reqId.current || !d) return;
        const full = d.display_name?.trim();
        const short = full ? full.split(",")[0].trim() || full : "Επιλεγμένο σημείο";
        setPicked({ name: short, coords });
      })
      .catch(() => {
        /* keep the provisional "Επιλεγμένο σημείο" label on failure */
      });
  };

  const confirm = () => {
    if (picked) onSelect(picked);
  };

  return createPortal(
    <div
      // data-fullscreen-picker: the homepage search's outside-click handler
      // ignores taps inside this attribute, so interacting with the map doesn't
      // close the underlying destination dropdown.
      data-fullscreen-picker
      className="fixed inset-0 z-[200] flex items-stretch justify-center bg-black/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Αναζήτηση στον χάρτη: ${cityName}`}
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[80vh] sm:max-w-3xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar: the address/hotel input, with Επιλογή (desktop) + X. */}
        <div className="flex items-center gap-2 border-b border-black/[.08] px-3 py-2">
          <div className="min-w-0 flex-1">
            <StartPointSearch
              cityName={cityName}
              near={cityCenter}
              currentLabel={picked?.name}
              autoFocus
              onSelect={onInputSelect}
            />
          </div>
          <button
            type="button"
            onClick={confirm}
            disabled={!picked}
            className={`hidden shrink-0 sm:inline-flex ${buttonStyles.secondary} ${
              picked ? "" : "cursor-not-allowed opacity-50"
            }`}
          >
            Επιλογή
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Κλείσιμο"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/[.05] hover:text-zinc-800"
          >
            <FaXmark className="h-4 w-4" />
          </button>
        </div>

        {/* The map fills the rest. */}
        <div className="relative flex-1">
          <MapPicker
            center={cityCenter}
            marker={picked?.coords ?? null}
            flyTo={flyTarget}
            onMapClick={onMapClick}
          />
        </div>

        {/* Mobile: full-width confirm at the bottom. */}
        <div className="border-t border-black/[.08] p-3 sm:hidden">
          <button
            type="button"
            onClick={confirm}
            disabled={!picked}
            className={`w-full text-center ${buttonStyles.secondary} ${
              picked ? "" : "cursor-not-allowed opacity-50"
            }`}
          >
            Επιλογή
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
