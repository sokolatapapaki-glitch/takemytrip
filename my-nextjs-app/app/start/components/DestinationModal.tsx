"use client";

// Destination picker, in two steps that occupy the SAME modal area (identical on
// phone and desktop):
//   1. LIST  — only the destinations. Nothing else shows on hover.
//   2. ADDRESS — clicking a destination selects it (its centre as the default
//      start point, #3) and slides in a search for a PERSONAL START POINT (an
//      address or hotel within that city). A back chevron (top-left) slides back
//      to the list. Picking a suggestion finalises the point; leaving it (or
//      going back / closing) keeps the city centre.

import { useState } from "react";
import { DESTINATIONS } from "../data/destinations";
import type { DestinationSelection } from "../data/types";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
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
  query = "",
}: {
  value: DestinationSelection | null;
  // Row click: pick the destination (start point defaults to its centre) and
  // advance to the address step in place — does NOT close the dropdown.
  onChooseDestination: (destinationId: string) => void;
  // Suggestion picked in the address search: finalise the start point + close.
  onChoosePoint: (destinationId: string, point: StartPoint) => void;
  // Optional free-text filter from the writable destination input on the
  // homepage. Matches destination name, country, or English aliases.
  query?: string;
}) {
  // The modal always opens on the LIST; clicking a destination moves to ADDRESS.
  const [step, setStep] = useState<"list" | "address">("list");
  const [activeId, setActiveId] = useState<string | null>(value?.destinationId ?? null);
  // Bumped on every "back" so the list replays its slide-in-from-left each time
  // (a changing key remounts the pane). 0 on first open → no slide (the
  // Dropdown's own pop-in covers the entrance).
  const [backCount, setBackCount] = useState(0);

  const q = query.trim().toLowerCase();
  const shown = q
    ? DESTINATIONS.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.aliases?.some((a) => a.toLowerCase().includes(q))
      )
    : DESTINATIONS;

  const active = activeId ? DESTINATIONS.find((d) => d.id === activeId) ?? null : null;

  const goToAddress = (destinationId: string) => {
    // Select the destination (centre as the default start point) and slide in
    // the address search. The dropdown stays open.
    onChooseDestination(destinationId);
    setActiveId(destinationId);
    setStep("address");
  };

  const goBack = () => {
    setBackCount((n) => n + 1);
    setStep("list");
  };

  // Consistent width across both steps so the panel doesn't resize as it slides
  // (full-width on mobile via the Dropdown, fixed on desktop).
  return (
    <div className="w-full overflow-hidden sm:w-80">
      {step === "list" || !active ? (
        <ul
          key={`list-${backCount}`}
          className={`max-h-72 w-full overflow-y-auto p-2 ${HOVER_SCROLLBAR} ${
            backCount > 0 ? "animate-panel-in-left" : ""
          }`}
        >
          {shown.length === 0 && (
            <li className="px-3 py-2 text-sm text-zinc-400">Κανένα αποτέλεσμα</li>
          )}
          {shown.map((d) => {
            const selected = value?.destinationId === d.id;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  // Click — NOT hover — advances to the address step.
                  onClick={() => goToAddress(d.id)}
                  className={`group/row flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-orange-50 ${
                    selected ? "ring-1 ring-orange-300" : ""
                  }`}
                >
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-800">{d.name}</span>
                    <span className="text-xs text-zinc-400">
                      {d.kind === "region" ? "Περιφέρεια" : "Πόλη"} · {d.country}
                    </span>
                  </span>
                  <FaChevronRight className="ml-auto h-4 w-4 shrink-0 text-orange-500 opacity-40 transition-opacity group-hover/row:opacity-100" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div key="address" className="animate-panel-in-right p-3">
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={goBack}
              aria-label="Πίσω στους προορισμούς"
              className="inline-flex shrink-0 cursor-pointer rounded-full p-1 text-orange-500 transition-colors hover:bg-orange-50"
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Σημείο εκκίνησης στη/στο {active.name}
            </p>
          </div>
          <StartPointSearch
            cityName={active.name}
            near={active.center}
            autoFocus
            currentLabel={
              value?.destinationId === active.id && value.pointName !== active.name
                ? value.pointName
                : undefined
            }
            onSelect={(point) => onChoosePoint(active.id, point)}
          />
        </div>
      )}
    </div>
  );
}
