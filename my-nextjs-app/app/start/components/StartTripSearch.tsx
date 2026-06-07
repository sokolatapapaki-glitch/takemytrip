"use client";

// The search bar from the Penpot board: three inputs (destination, dates,
// travelers) of equal size with a Search button, each opening its own dropdown
// modal. Glassmorphism styling, white/orange accents. Standalone — "Search"
// only logs the current selection to the console.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DESTINATIONS } from "../data/destinations";
import { homeStyles } from "../data/palette";
import { formatShort, isSameDay } from "../data/dateUtils";
import type { DateRange, DestinationSelection, Travelers } from "../data/types";
import { DestinationModal } from "./DestinationModal";
import { CalendarModal } from "./CalendarModal";
import { TravelersModal } from "./TravelersModal";
import { Typewriter } from "./Typewriter";
import {
  CalendarIcon,
  MapPinIcon,
  SearchIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "./icons";

type ModalKey = "dest" | "dates" | "travelers";

// Local date → "YYYY-MM-DD" (no timezone shift, unlike toISOString).
const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function StartTripSearch({
  // The hero backdrop shows photos of the chosen city's activities, so it needs
  // to know which destination is selected (null = nothing picked yet).
  onDestChange,
}: {
  onDestChange?: (destinationId: string | null) => void;
} = {}) {
  const router = useRouter();
  const [open, setOpen] = useState<ModalKey | null>(null);
  const [dest, setDest] = useState<DestinationSelection | null>(null);
  // The destination field starts as an animated typewriter placeholder, then
  // becomes a real writable input once the typing finishes. `destQuery` is the
  // free text the user types, which filters the destination dropdown.
  const [destTypingDone, setDestTypingDone] = useState(false);
  const [destQuery, setDestQuery] = useState("");
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

  // Let the hero backdrop follow the chosen city (see onDestChange prop).
  useEffect(() => {
    onDestChange?.(dest?.destinationId ?? null);
  }, [dest, onDestChange]);

  const destLabel = useMemo(() => {
    if (!dest) return null;
    const d = DESTINATIONS.find((x) => x.id === dest.destinationId);
    if (!d) return null;
    const a = d.areas.find((x) => x.id === dest.areaId);
    // The city centre (a city's default first area, named "Centre") shows just
    // the city name — e.g. "Rome", not "Rome · Centre". Any other area keeps the
    // "City · Area" form. (Regions always show "Region · City".)
    const isCityCentre = d.kind === "city" && d.areas[0]?.id === dest.areaId;
    return a && !isCityCentre ? `${d.name} · ${a.name}` : d.name;
  }, [dest]);

  // A single chosen day (start only, or start === end) shows just that date —
  // not "Jun 7 — …" or "Jun 7 — Jun 7".
  const dateLabel = !range.start
    ? null
    : !range.end || isSameDay(range.start, range.end)
      ? formatShort(range.start)
      : `${formatShort(range.start)} — ${formatShort(range.end)}`;

  const travelersLabel = useMemo(() => {
    const parts = [`${travelers.adults} adult${travelers.adults !== 1 ? "s" : ""}`];
    if (travelers.children > 0) {
      parts.push(`${travelers.children} child${travelers.children !== 1 ? "ren" : ""}`);
    }
    return parts.join(" · ");
  }, [travelers]);

  // Total people in the party — drives the one/two-person traveller icon.
  const travelerCount = travelers.adults + travelers.children;

  // Search is only allowed once all three fields are filled: a destination, at
  // least one date, and a valid party (always ≥ 1 adult, so dest + date gate it).
  const canSearch = !!dest && !!range.start && travelers.adults >= 1;

  // Hand the chosen destination/area/dates to the main planner via query params.
  // (Travelers are one adult for now — not passed; the planner doesn't use them.)
  function handleSearch() {
    if (!canSearch) return;
    const params = new URLSearchParams();
    if (dest) {
      params.set("dest", dest.destinationId);
      params.set("area", dest.areaId);
    }
    if (range.start) params.set("start", toISODate(range.start));
    if (range.end) params.set("end", toISODate(range.end));
    const qs = params.toString();
    router.push(qs ? `/plan?${qs}` : "/plan");
  }

  const toggle = (key: ModalKey) => setOpen((o) => (o === key ? null : key));

  return (
    <div ref={rootRef} className="relative">
      <div className="animate-fade-in-up flex items-center gap-2" style={{ animationDelay: "100ms" }}>
        <DestField
          active={open === "dest"}
          value={destLabel}
          query={destQuery}
          onQueryChange={(q) => {
            setDestQuery(q);
            setOpen("dest");
          }}
          typingDone={destTypingDone}
          onTypingDone={() => setDestTypingDone(true)}
          onOpen={() => setOpen("dest")}
          onClear={
            dest || destQuery
              ? () => {
                  setDest(null);
                  setDestQuery("");
                }
              : undefined
          }
        >
          {open === "dest" && (
            <Dropdown align="left">
              <DestinationModal
                value={dest}
                query={destQuery}
                onSelect={(destinationId, areaId) => {
                  setDest({ destinationId, areaId });
                  setDestQuery("");
                  setOpen(null);
                }}
              />
            </Dropdown>
          )}
        </DestField>

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
          icon={<TravelersIcon multiple={travelerCount > 1} />}
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
          disabled={!canSearch}
          aria-disabled={!canSearch}
          title={canSearch ? undefined : "Pick a destination, dates and travellers first"}
          style={{ animationDelay: "440ms" }}
          className={`animate-pop-in flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 font-medium ${homeStyles.primaryButton} ${homeStyles.primaryButtonDisabled}`}
        >
          <SearchIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </div>
  );
}

// One input field: an icon, the value (or placeholder), a hover-revealed clear
// button, and its dropdown modal (passed as children). Used for dates/travelers;
// the destination field is the richer DestField below.
function Field({
  active,
  icon,
  placeholder,
  value,
  onClick,
  onClear,
  children,
  iconDelay = 0,
}: {
  active: boolean;
  icon: React.ReactNode;
  placeholder: string;
  value: string | null;
  onClick: () => void;
  onClear?: () => void;
  children?: React.ReactNode;
  iconDelay?: number;
}) {
  return (
    <div className="group relative min-w-0 flex-1">
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-xl border border-black px-4 py-3 text-left transition-colors ${
          active ? homeStyles.fieldActive : homeStyles.fieldIdle
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
          {value ? value : placeholder}
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

// The destination field: an animated typewriter placeholder that becomes a real
// writable text input once typing finishes. A selected destination shows as a
// (clickable) label; typing filters the dropdown via `onQueryChange`.
function DestField({
  active,
  value,
  query,
  onQueryChange,
  typingDone,
  onTypingDone,
  onOpen,
  onClear,
  children,
}: {
  active: boolean;
  value: string | null;
  query: string;
  onQueryChange: (q: string) => void;
  typingDone: boolean;
  onTypingDone: () => void;
  onOpen: () => void;
  onClear?: () => void;
  children?: React.ReactNode;
}) {
  // Give the pin a little jump each time a place is freshly picked (null → set).
  const [jump, setJump] = useState(false);
  const prevValue = useRef<string | null>(value);
  useEffect(() => {
    if (!prevValue.current && value) {
      setJump(true);
      const t = setTimeout(() => setJump(false), 500);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
    prevValue.current = value;
  }, [value]);

  return (
    <div className="group relative min-w-0 flex-1">
      <div
        className={`flex w-full items-center gap-3 rounded-xl border border-black px-4 py-3 transition-colors ${
          active ? homeStyles.fieldActive : homeStyles.fieldIdle
        }`}
      >
        <span
          className="animate-icon-pop inline-flex shrink-0 text-zinc-400"
          style={{ animationDelay: "400ms" }}
        >
          {/* Inner span carries the one-shot jump so it can't clash with the
              entrance pop on the outer span. */}
          <span className={`inline-flex ${jump ? "animate-pin-jump" : ""}`}>
            <MapPinIcon className="h-5 w-5" />
          </span>
        </span>

        {value ? (
          // A destination is chosen: show it as a clickable label.
          <button
            type="button"
            onClick={onOpen}
            className={`flex-1 truncate text-left text-sm text-zinc-800 ${onClear ? "pr-6" : ""}`}
          >
            {value}
          </button>
        ) : typingDone ? (
          // Placeholder finished typing → a real, writable input.
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={onOpen}
            placeholder="Search destination"
            size={1}
            className={`w-full min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 ${
              onClear ? "pr-6" : ""
            }`}
          />
        ) : (
          // Still typing the placeholder out.
          <button
            type="button"
            onClick={onOpen}
            className="flex-1 truncate text-left text-sm text-zinc-400"
          >
            <Typewriter text="Search destination" startDelay={820} onDone={onTypingDone} />
          </button>
        )}
      </div>
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

// The glass dropdown panel anchored under a field. Pops in when opened.
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
      className={`animate-pop-in absolute top-full z-30 mt-2 ${pos} origin-top overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-2xl shadow-orange-900/10 backdrop-blur-xl`}
    >
      {children}
    </div>
  );
}

// Travellers field icon: a single person when the party is one, crossfading into
// the two-person icon when it grows past one (and back again when it shrinks).
// The CSS transition plays in reverse for free when `multiple` flips back.
function TravelersIcon({ multiple }: { multiple: boolean }) {
  const base = "absolute inset-0 h-5 w-5 transition-all duration-300 ease-out";
  return (
    <span className="relative inline-flex h-5 w-5">
      <UserIcon
        className={`${base} ${multiple ? "scale-75 opacity-0" : "scale-100 opacity-100"}`}
      />
      <UsersIcon
        className={`${base} ${multiple ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
      />
    </span>
  );
}
