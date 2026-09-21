"use client";

// Modal wrapper around the per-day Leaflet map. The map itself (DayMap) is loaded
// dynamically with ssr:false — Leaflet can't render on the server.

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FaXmark } from "react-icons/fa6";
import type { MapStop } from "./DayMap";

const DayMap = dynamic(() => import("./DayMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
      Φόρτωση χάρτη…
    </div>
  ),
});

export function DayMapModal({
  title,
  stops,
  start,
  circular = false,
  onClose,
}: {
  title: string;
  stops: MapStop[];
  start?: MapStop;
  circular?: boolean;
  onClose: () => void;
}) {
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

  // Portal to <body> so the overlay escapes the trip card's backdrop-blur /
  // transform (those make `fixed` resolve against the card instead of the
  // viewport, trapping the modal inside it). Safe: this modal only ever renders
  // from a client click inside the ssr:false planner, so `document` exists.
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/[.08] px-4 py-3">
          <h2 className="text-base font-semibold text-zinc-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Κλείσιμο"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/[.05] hover:text-zinc-800"
          >
            <FaXmark className="h-4 w-4" />
          </button>
        </div>
        <div className="relative flex-1">
          <DayMap stops={stops} start={start} circular={circular} />
        </div>
      </div>
    </div>,
    document.body
  );
}
