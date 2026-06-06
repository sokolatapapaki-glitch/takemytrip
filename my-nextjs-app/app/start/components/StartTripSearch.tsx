"use client";

// The search bar from the Penpot board: three inputs (destination, dates,
// travelers) of equal size with a Search button, each opening its own dropdown
// modal. Glassmorphism styling, white/orange accents. Standalone — "Search"
// only logs the current selection to the console.

import { useEffect, useMemo, useRef, useState } from "react";
import { DESTINATIONS } from "../data/destinations";
import { formatShort } from "../data/dateUtils";
import type { DateRange, DestinationSelection, Travelers } from "../data/types";
import { DestinationModal } from "./DestinationModal";
import { CalendarModal } from "./CalendarModal";
import { TravelersModal } from "./TravelersModal";
import { Typewriter } from "./Typewriter";
import {
  CalendarIcon,
  MapPinIcon,
  SearchIcon,
  UsersIcon,
  XIcon,
} from "./icons";

type ModalKey = "dest" | "dates" | "travelers";

export default function StartTripSearch() {
  const [open, setOpen] = useState<ModalKey | null>(null);
  const [dest, setDest] = useState<DestinationSelection | null>(null);
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [travelers, setTravelers] = useState<Travelers>({
    adults: 2,
    children: 0,
    childAges: [],
  });

  // Close the open modal when clicking anywhere outside the bar.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const destLabel = useMemo(() => {
    if (!dest) return null;
    const d = DESTINATIONS.find((x) => x.id === dest.destinationId);
    const a = d?.areas.find((x) => x.id === dest.areaId);
    return d ? `${d.name}${a ? ` · ${a.name}` : ""}` : null;
  }, [dest]);

  const dateLabel = !range.start
    ? null
    : !range.end
      ? `${formatShort(range.start)} — …`
      : `${formatShort(range.start)} — ${formatShort(range.end)}`;

  const travelersLabel = useMemo(() => {
    const parts = [`${travelers.adults} adult${travelers.adults !== 1 ? "s" : ""}`];
    if (travelers.children > 0) {
      parts.push(`${travelers.children} child${travelers.children !== 1 ? "ren" : ""}`);
    }
    return parts.join(" · ");
  }, [travelers]);

  function handleSearch() {
    const d = dest ? DESTINATIONS.find((x) => x.id === dest.destinationId) : null;
    const a = d?.areas.find((x) => x.id === dest?.areaId);
    // Standalone page: just report the selection.
    console.log("Trip search:", {
      destination: d?.name ?? null,
      area: a?.name ?? null,
      from: range.start?.toDateString() ?? null,
      to: range.end?.toDateString() ?? null,
      adults: travelers.adults,
      children: travelers.children,
      childAges: travelers.childAges,
    });
  }

  const toggle = (key: ModalKey) => setOpen((o) => (o === key ? null : key));

  return (
    <div ref={rootRef} className="relative">
      <div className="animate-fade-in-up flex items-stretch gap-2 rounded-2xl border border-white/50 bg-white/60 p-2 shadow-xl shadow-orange-900/5 backdrop-blur-md" style={{ animationDelay: "100ms" }}>
        <Field
          active={open === "dest"}
          icon={<MapPinIcon className="h-5 w-5" />}
          placeholder="Search destination"
          value={destLabel}
          iconDelay={400}
          typeDelay={820}
          typewriter
          onClick={() => toggle("dest")}
          onClear={dest ? () => setDest(null) : undefined}
        >
          {open === "dest" && (
            <Dropdown align="left">
              <DestinationModal
                value={dest}
                onSelect={(destinationId, areaId) => {
                  setDest({ destinationId, areaId });
                  setOpen(null);
                }}
              />
            </Dropdown>
          )}
        </Field>

        <Field
          active={open === "dates"}
          icon={<CalendarIcon className="h-5 w-5" />}
          placeholder="From — To"
          value={dateLabel}
          iconDelay={490}
          onClick={() => toggle("dates")}
          onClear={range.start ? () => setRange({ start: null, end: null }) : undefined}
        >
          {open === "dates" && (
            <Dropdown align="center">
              <CalendarModal
                value={range}
                onChange={setRange}
                onClose={() => setOpen(null)}
              />
            </Dropdown>
          )}
        </Field>

        <Field
          active={open === "travelers"}
          icon={<UsersIcon className="h-5 w-5" />}
          placeholder="Travelers"
          value={travelersLabel}
          iconDelay={580}
          onClick={() => toggle("travelers")}
        >
          {open === "travelers" && (
            <Dropdown align="right">
              <TravelersModal value={travelers} onChange={setTravelers} />
            </Dropdown>
          )}
        </Field>

        <button
          type="button"
          onClick={handleSearch}
          style={{ animationDelay: "440ms" }}
          className="animate-pop-in flex shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
        >
          <SearchIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </div>
  );
}

// One input field: an icon, the value (or placeholder), a hover-revealed clear
// button, and its dropdown modal (passed as children).
function Field({
  active,
  icon,
  placeholder,
  value,
  onClick,
  onClear,
  children,
  iconDelay = 0,
  typeDelay = 0,
  typewriter = false,
}: {
  active: boolean;
  icon: React.ReactNode;
  placeholder: string;
  value: string | null;
  onClick: () => void;
  onClear?: () => void;
  children?: React.ReactNode;
  iconDelay?: number;
  typeDelay?: number;
  typewriter?: boolean;
}) {
  return (
    <div className="group relative flex-1">
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
          active
            ? "bg-white shadow-sm ring-1 ring-orange-200"
            : "bg-white/70 hover:bg-white"
        }`}
      >
        <span
          className="animate-icon-pop inline-flex shrink-0 text-zinc-400"
          style={{ animationDelay: `${iconDelay}ms` }}
        >
          {icon}
        </span>
        <span
          className={`flex-1 truncate text-sm ${value ? "text-zinc-800" : "text-zinc-400"} ${
            onClear ? "pr-6" : ""
          }`}
        >
          {value
            ? value
            : typewriter
              ? <Typewriter text={placeholder} startDelay={typeDelay} />
              : placeholder}
        </span>
      </button>
      {onClear && (
        <button
          type="button"
          aria-label="Clear"
          onClick={onClear}
          className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full p-0.5 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500 group-hover:block"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

// The glass dropdown panel anchored under a field.
function Dropdown({
  align,
  children,
}: {
  align: "left" | "center" | "right";
  children: React.ReactNode;
}) {
  const pos =
    align === "left"
      ? "left-0"
      : align === "right"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";
  return (
    <div
      className={`absolute top-full z-30 mt-2 ${pos} overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-2xl shadow-orange-900/10 backdrop-blur-xl`}
    >
      {children}
    </div>
  );
}
