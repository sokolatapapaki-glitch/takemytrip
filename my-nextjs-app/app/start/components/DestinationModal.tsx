"use client";

// Destination picker: a simple list of destinations on the left. Hovering a row
// reveals a tail-less arrow on its right and opens an areas flyout (default =
// the first area, i.e. a city's centre or a region's main city). The flyout only
// shows while a result is hovered. Clicking a row selects its default area;
// clicking an area in the flyout selects that one.

import { useState } from "react";
import { DESTINATIONS } from "../data/destinations";
import type { DestinationSelection } from "../data/types";
import { ChevronRightIcon } from "./icons";

// Thin, faded scrollbar that only shows while the list is hovered.
const HOVER_SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:#d4d4d8_transparent] " +
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent " +
  "hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300/70";

export function DestinationModal({
  value,
  onSelect,
}: {
  value: DestinationSelection | null;
  onSelect: (destinationId: string, areaId: string) => void;
}) {
  // Which destination's areas are shown in the flyout — null until a row is
  // hovered/focused, so the area modal never shows on its own.
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId ? DESTINATIONS.find((d) => d.id === activeId) ?? null : null;

  return (
    // Clearing on leaving the whole modal (not each row) keeps the flyout open
    // while the cursor travels from a row into it.
    <div className="flex" onMouseLeave={() => setActiveId(null)}>
      <ul className={`max-h-72 w-56 shrink-0 overflow-y-auto p-2 ${HOVER_SCROLLBAR}`}>
        {DESTINATIONS.map((d) => {
          const selected = value?.destinationId === d.id;
          const isActive = activeId === d.id;
          return (
            <li key={d.id}>
              <button
                type="button"
                onMouseEnter={() => setActiveId(d.id)}
                onFocus={() => setActiveId(d.id)}
                onClick={() => onSelect(d.id, d.areas[0].id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
                  isActive ? "bg-orange-50" : "hover:bg-orange-50"
                } ${selected ? "ring-1 ring-orange-300" : ""}`}
              >
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-800">{d.name}</span>
                  <span className="text-xs text-zinc-400">
                    {d.kind === "region" ? "Region" : "City"} · {d.country}
                  </span>
                </span>
                <ChevronRightIcon
                  className={`ml-auto h-4 w-4 shrink-0 text-orange-500 transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      {active && (
        <div className="w-48 shrink-0 border-l border-black/5 p-2">
          <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {active.subLabel}
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
                      <span className="text-[10px] text-emerald-500">default</span>
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
