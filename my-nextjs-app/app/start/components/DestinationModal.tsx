"use client";

// Destination picker: a simple list of destinations on the left. Hovering a row
// reveals a tail-less arrow on its right and opens an areas flyout (default =
// the first area, i.e. a city's centre or a region's main city). The flyout only
// shows while a result is hovered. Clicking a row selects its default area;
// clicking an area in the flyout selects that one.

import { useEffect, useState } from "react";
import { DESTINATIONS } from "../data/destinations";
import type { DestinationSelection } from "../data/types";
import { FaChevronRight } from "react-icons/fa6";

// Thin, faded scrollbar that only shows while the list is hovered.
const HOVER_SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:#d4d4d8_transparent] " +
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent " +
  "hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300/70";

export function DestinationModal({
  value,
  onSelect,
  query = "",
}: {
  value: DestinationSelection | null;
  onSelect: (destinationId: string, areaId: string) => void;
  // Optional free-text filter coming from the writable destination input on the
  // homepage. Matches destination name or country (case-insensitive).
  query?: string;
}) {
  // Which destination's areas are shown in the flyout — null until a row is
  // hovered/focused, so the area modal never shows on its own.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const q = query.trim().toLowerCase();
  const shown = q
    ? DESTINATIONS.filter(
        (d) =>
          d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q)
      )
    : DESTINATIONS;
  // Don't show a stale flyout for a destination filtered out of the list.
  const active =
    activeId && shown.some((d) => d.id === activeId)
      ? DESTINATIONS.find((d) => d.id === activeId) ?? null
      : null;

  return (
    // Clearing on leaving the whole modal (not each row) keeps the flyout open
    // while the cursor travels from a row into it.
    <div className="flex flex-col gap-2 sm:flex-row" onMouseLeave={() => setActiveId(null)}>
      <ul className={`max-h-72 w-full shrink-0 overflow-y-auto p-2 sm:w-56 ${HOVER_SCROLLBAR}`}>
        {shown.length === 0 && (
          <li className="px-3 py-2 text-sm text-zinc-400">Κανένα αποτέλεσμα</li>
        )}
        {shown.map((d) => {
          const selected = value?.destinationId === d.id;
          const isActive = activeId === d.id;
          const isExpanded = expandedId === d.id;
          return (
            <li key={d.id}>
              <button
                type="button"
                onMouseEnter={() => setActiveId(d.id)}
                onFocus={() => setActiveId(d.id)}
                onClick={() => {
                  if (isMobile) {
                    setExpandedId((current) => (current === d.id ? null : d.id));
                    setActiveId(d.id);
                  } else {
                    onSelect(d.id, d.areas[0].id);
                  }
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
                  isActive ? "bg-orange-50" : "hover:bg-orange-50"
                } ${selected ? "ring-1 ring-orange-300" : ""}`}
              >
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-800">{d.name}</span>
                  <span className="text-xs text-zinc-400">
                    {d.kind === "region" ? "Περιφέρεια" : "Πόλη"} · {d.country}
                  </span>
                </span>
                <FaChevronRight
                  className={`ml-auto h-4 w-4 shrink-0 text-orange-500 transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>

              {isMobile && isExpanded ? (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                  <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {d.subLabel === "Cities" ? "Πόλεις" : "Περιοχές"}
                  </p>
                  <ul className="space-y-1">
                    {d.areas.map((a, i) => {
                      const selectedArea =
                        value?.destinationId === d.id && value?.areaId === a.id;
                      return (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => {
                              onSelect(d.id, a.id);
                              setExpandedId(null);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                              selectedArea
                                ? "bg-orange-500 text-white"
                                : "text-zinc-700 hover:bg-orange-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <span>{a.name}</span>
                            {i === 0 && !selectedArea ? (
                              <span className="text-[10px] text-emerald-500">προεπιλογή</span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {active && !isMobile && (
        <div className="w-full shrink-0 border-t border-black/5 p-2 sm:w-48 sm:border-l sm:border-t-0">
          <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {active.subLabel === "Cities" ? "Πόλεις" : "Περιοχές"}
          </p>
          <ul className={`max-h-60 overflow-y-auto ${HOVER_SCROLLBAR}`}>
            {active.areas.map((a, i) => {
              const selected =
                value?.destinationId === active.id && value?.areaId === a.id;
              const isDefault = i === 0;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(active.id, a.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                      selected
                        ? "bg-orange-500 text-white"
                        : "text-zinc-700 hover:bg-orange-50"
                    }`}
                  >
                    <span>{a.name}</span>
                    {isDefault && !selected && (
                      <span className="text-[10px] text-emerald-500">προεπιλογή</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
