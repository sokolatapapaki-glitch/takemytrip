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
  playEntranceAnimations = true,
}: {
  onDestChange?: (destinationId: string | null) => void;
  playEntranceAnimations?: boolean;
} = {}) {
  const router = useRouter();
  const [open, setOpen] = useState<ModalKey | null>(null);
  const [dest, setDest] = useState<DestinationSelection | null>(null);
  // The destination field starts as an animated typewriter placeholder, then
  // becomes a real writable input once the typing finishes. `destQuery` is the
  // free text the user types, which filters the destination dropdown.
  const [destTypingDone, setDestTypingDone] = useState(!playEntranceAnimations);
  const [destQuery, setDestQuery] = useState("");
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [travelers, setTravelers] = useState<Travelers>({
    adults: 2,
    children: 0,
    childAges: [],
  });
  const [searchIconAlert, setSearchIconAlert] = useState(false);
  const searchIconAlertTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (!open) return;
    rootRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (searchIconAlertTimeout.current) {
        clearTimeout(searchIconAlertTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (playEntranceAnimations && !dest) {
      setDestTypingDone(false);
    }
  }, [playEntranceAnimations, dest]);

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

  // Search is complete once all required fields are filled: a destination, at
  // least one date, and a valid party.
  const canSearch = !!dest && !!range.start && travelers.adults >= 1;

  const missingInputs = useMemo(() => {
    const missing: string[] = [];
    if (!dest) missing.push("destination");
    if (!range.start) missing.push("dates");
    if (travelers.adults < 1) missing.push("travelers");
    return missing;
  }, [dest, range.start, travelers.adults]);

  // Hand the chosen destination/area/dates AND party to the main planner via query
  // params. The party (adults + each child's age) drives the planner's price totals
  // (see activityPrice / setActiveParty); ages go as a comma list, unset → 0.
  function handleSearch() {
    if (!canSearch) {
      window.alert(`Please fill in: ${missingInputs.join(", ")}.`);
      if (searchIconAlertTimeout.current) {
        clearTimeout(searchIconAlertTimeout.current);
      }
      setSearchIconAlert(true);
      searchIconAlertTimeout.current = setTimeout(() => {
        setSearchIconAlert(false);
      }, 900);
      if (!dest) setOpen("dest");
      else if (!range.start) setOpen("dates");
      else if (travelers.adults < 1) setOpen("travelers");
      return;
    }
    const params = new URLSearchParams();
    if (dest) {
      params.set("dest", dest.destinationId);
      params.set("area", dest.areaId);
    }
    if (range.start) params.set("start", toISODate(range.start));
    if (range.end) params.set("end", toISODate(range.end));
    params.set("adults", String(travelers.adults));
    if (travelers.children > 0) {
      params.set("ages", travelers.childAges.map((a) => a ?? 0).join(","));
    }
    const qs = params.toString();
    router.push(qs ? `/plan?${qs}` : "/plan");
  }

  const toggle = (key: ModalKey) => setOpen((o) => (o === key ? null : key));

  return (
    <div ref={rootRef} className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 -inset-y-5 rounded-[2rem] bg-gradient-to-r from-orange-300/30 via-pink-300/25 to-sky-300/25 blur-2xl"
      />
      <div
        className={`${playEntranceAnimations ? "animate-fade-in-up" : ""} relative grid grid-cols-1 items-center gap-2 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]`}
        style={{ animationDelay: "100ms" }}
      >
        <DestField
          active={open === "dest"}
          value={destLabel}
          query={destQuery}
          onQueryChange={(q) => {
            setDestQuery(q);
            setOpen("dest");
          }}
          playEntranceAnimations={playEntranceAnimations}
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
            <Dropdown align="left" onClose={() => setOpen(null)}>
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
          playEntranceAnimations={playEntranceAnimations}
          onClick={() => toggle("dates")}
          onClear={range.start ? () => setRange({ start: null, end: null }) : undefined}
        >
          {open === "dates" && (
            <>
              <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col sm:hidden">
                <div className="flex items-center justify-end border-b border-black/5 px-4 py-4">
                  <button
                    type="button"
                    onClick={() => setOpen(null)}
                    className="rounded-full border border-black/[.08] px-3 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 pt-0">
                  <div className="h-full">
                    <CalendarModal
                      value={range}
                      onChange={setRange}
                      onClose={() => setOpen(null)}
                    />
                  </div>
                </div>
              </div>
              <div className="hidden sm:block">
                <Dropdown align="center" onClose={() => setOpen(null)}>
                  <CalendarModal
                    value={range}
                    onChange={setRange}
                    onClose={() => setOpen(null)}
                  />
                </Dropdown>
              </div>
            </>
          )}
        </Field>

        <Field
          active={open === "travelers"}
          icon={<TravelersIcon multiple={travelerCount > 1} />}
          placeholder="Travelers"
          value={travelersLabel}
          iconDelay={580}
          playEntranceAnimations={playEntranceAnimations}
          onClick={() => toggle("travelers")}
        >
          {open === "travelers" && (
            <Dropdown align="right" onClose={() => setOpen(null)}>
              <TravelersModal value={travelers} onChange={setTravelers} />
            </Dropdown>
          )}
        </Field>

        <button
          type="button"
          onClick={handleSearch}
          aria-disabled={!canSearch}
          title={canSearch ? undefined : "Search"}
          style={{ animationDelay: "440ms" }}
          className={`${playEntranceAnimations ? "animate-pop-in" : ""} group flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium lg:w-auto ${homeStyles.primaryButton}`}
        >
          <SearchIcon
            className={`h-5 w-5 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-12 ${searchIconAlert ? "animate-bounce" : ""
              }`}
          />
          <span>Search</span>
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
  playEntranceAnimations,
}: {
  active: boolean;
  icon: React.ReactNode;
  placeholder: string;
  value: string | null;
  onClick: () => void;
  onClear?: () => void;
  children?: React.ReactNode;
  iconDelay?: number;
  playEntranceAnimations: boolean;
}) {
  return (
    <div className="group relative min-w-0 flex-1">
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 text-left transition-colors ${active ? homeStyles.fieldActive : homeStyles.fieldIdle
          }`}
      >
        <span
          className={`${playEntranceAnimations ? "animate-icon-pop" : ""} inline-flex shrink-0 text-zinc-400 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-translate-y-0.5`}
          style={{ animationDelay: `${iconDelay}ms` }}
        >
          {icon}
        </span>
        <span
          className={`flex-1 truncate text-sm ${value ? "text-zinc-800" : "text-zinc-400"} ${onClear ? "pr-6" : ""
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
  playEntranceAnimations,
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
  playEntranceAnimations: boolean;
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
        className={`flex w-full items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 transition-colors ${active ? homeStyles.fieldActive : homeStyles.fieldIdle
          }`}
      >
        <span
          className={`${playEntranceAnimations ? "animate-icon-pop" : ""} inline-flex shrink-0 text-zinc-400 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-translate-y-0.5`}
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
            className={`w-full min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 ${onClear ? "pr-6" : ""
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

// The glass dropdown panel. On desktop it's anchored under its field (`align`
// picks the side). On mobile it becomes a fixed, full-width overlay pinned near
// the top of the screen, over a dimmed tap-to-close backdrop.
function Dropdown({
  align,
  onClose,
  children,
}: {
  align: "left" | "center" | "right";
  onClose?: () => void;
  children: React.ReactNode;
}) {
  const desktopPos =
    align === "left"
      ? "sm:left-0"
      : align === "right"
        ? "sm:right-0"
        : "sm:left-1/2 sm:-translate-x-1/2";
  return (
    <>
      {/* Mobile-only transparent backdrop; tap anywhere to close. */}
      <div className="fixed inset-0 z-[90] bg-transparent sm:hidden" onClick={onClose} />
      <div
        className={`animate-pop-in z-[100] origin-top rounded-2xl border border-white/60 bg-white/90 shadow-2xl shadow-orange-900/10 backdrop-blur-xl absolute inset-x-0 top-full mx-auto max-h-[calc(100vh-6rem)] overflow-y-auto sm:inset-x-auto sm:top-full sm:mx-0 sm:mt-2 sm:max-h-none sm:max-w-none sm:overflow-hidden ${desktopPos}`}
      >
        {children}
      </div>
    </>
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
