"use client";

// Destination picker: a list of destinations on the left. Clicking a destination
// selects it (its centre as the provisional start point) and opens, on the right
// (or inline on mobile), a search for a PERSONAL START POINT — an address or
// hotel name within that destination (#3). No areas are shown. Picking a
// suggestion finalises the start point; leaving it keeps the city centre.

import { useEffect, useState } from "react";
import { DESTINATIONS } from "../data/destinations";
import type { DestinationSelection } from "../data/types";
import { FaChevronRight } from "react-icons/fa6";
import {
  StartPointSearch,
  type StartPoint,
} from "@/app/components/ActivityCombinations/StartPointSearch";

// Thin, faded scrollbar that only shows while the list is hovered.
const HOVER_SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:#d4d4d8_transparent] " +
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent " +
  "hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300/70";

export function DestinationModal({
  value,
  onChooseDestination,
  onChoosePoint,
  onClose,
  query = "",
}: {
  value: DestinationSelection | null;
  // Row click: pick the destination (start point defaults to its centre). On
  // desktop this also closes the dropdown (onClose); the start-point search is
  // reached by HOVERING the row instead.
  onChooseDestination: (destinationId: string) => void;
  // Suggestion picked in the search: finalise the personal start point + close.
  onChoosePoint: (destinationId: string, point: StartPoint) => void;
  // Closes the dropdown (desktop row click). Omitted on mobile flows.
  onClose?: () => void;
  // Optional free-text filter coming from the writable destination input on the
  // homepage. Matches destination name, country, or English aliases.
  query?: string;
}) {
  // Which destination's start-point search is shown — set on click (desktop) or
  // expanded inline (mobile). Null until a destination is chosen.
  const [activeId, setActiveId] = useState<string | null>(value?.destinationId ?? null);
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
          d.name.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.aliases?.some((a) => a.toLowerCase().includes(q))
      )
    : DESTINATIONS;
  // Don't keep a stale panel open for a destination filtered out of the list.
  const active =
    activeId && shown.some((d) => d.id === activeId)
      ? DESTINATIONS.find((d) => d.id === activeId) ?? null
      : null;

  // The start-point search for one destination (shared by desktop + mobile).
  const startPointSearch = (destination: NonNullable<typeof active>) => (
    <StartPointSearch
      cityName={destination.name}
      near={destination.center}
      currentLabel={
        value?.destinationId === destination.id &&
        value.pointName !== destination.name
          ? value.pointName
          : undefined
      }
      onSelect={(point) => onChoosePoint(destination.id, point)}
    />
  );

  return (
    // Clearing on leaving the WHOLE modal (not each row) keeps the hovered panel
    // open while the cursor travels from a row into the start-point search.
    <div
      className="flex flex-col gap-2 sm:flex-row"
      onMouseLeave={() => !isMobile && setActiveId(null)}
    >
      <ul className={`max-h-72 w-full shrink-0 overflow-y-auto p-2 sm:w-56 ${HOVER_SCROLLBAR}`}>
        {shown.length === 0 && (
          <li className="px-3 py-2 text-sm text-zinc-400">Κανένα αποτέλεσμα</li>
        )}
        {shown.map((d) => {
          const selected = value?.destinationId === d.id;
          const isActive = activeId === d.id;
          return (
            <li key={d.id}>
              <button
                type="button"
                // Desktop: hovering reveals the start-point search panel.
                onMouseEnter={() => !isMobile && setActiveId(d.id)}
                onFocus={() => !isMobile && setActiveId(d.id)}
                onClick={() => {
                  // Click selects the destination into the input (centre as the
                  // default start point). Desktop closes; mobile expands inline.
                  onChooseDestination(d.id);
                  if (isMobile) {
                    setActiveId((cur) => (cur === d.id ? null : d.id));
                  } else {
                    onClose?.();
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

              {/* Mobile: the start-point search expands inline under the row. */}
              {isMobile && isActive ? (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Σημείο εκκίνησης στη/στο {d.name}
                  </p>
                  {startPointSearch(d)}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* Desktop: the start-point search panel for the chosen destination. */}
      {active && !isMobile && (
        <div className="w-full shrink-0 border-t border-black/5 p-3 sm:w-72 sm:border-l sm:border-t-0">
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Σημείο εκκίνησης στη/στο {active.name}
          </p>
          {startPointSearch(active)}
        </div>
      )}
    </div>
  );
}
