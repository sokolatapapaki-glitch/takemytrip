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
import { StatusToast, type StatusState } from "@/app/components/ui/StatusToast";
import { SIMPLE_TRAVELERS } from "@/app/config";
import {
  CalendarIcon,
  MapPinIcon,
  SearchIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "./icons";

type ModalKey = "dest" | "dates" | "travelers";

// The combined length field shows EITHER a free-typed day count or a date range;
// the calendar icon toggles between the two (and is the only opener of the
// calendar modal).
type LengthMode = "days" | "dates";

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
  // Trip length in days — the PRIMARY way to set how long the trip is (#2). Free
  // typing, no upper limit enforced here (the planner caps it). Dates are now
  // OPTIONAL: a search needs a destination + EITHER a duration OR dates.
  const [durationDays, setDurationDays] = useState<number | null>(null);
  // Which face of the combined length field is showing. Starts on the day count
  // (the primary length input); the calendar icon flips it to date-range mode.
  const [lengthMode, setLengthMode] = useState<LengthMode>("days");
  const [travelers, setTravelers] = useState<Travelers>({
    adults: 2,
    children: 0,
    childAges: [],
  });
  const [searchIconAlert, setSearchIconAlert] = useState(false);
  const searchIconAlertTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The status toast (info/success/error) — currently used for the "fill in the
  // required fields" error when Search is pressed too early. `id` gives each
  // trigger a fresh key so the toast restarts its timer/animation.
  const [notice, setNotice] = useState<{ id: number; state: StatusState; message: string } | null>(null);

  // Close the open modal when clicking anywhere outside the bar. The mobile
  // full-screen pickers are PORTALED to <body> (outside rootRef), so taps
  // inside them must not count as "outside".
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Element;
      if (target.closest?.("[data-fullscreen-picker]")) return;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Bring the bar into view when a field opens. The page's scrollbar is left
  // alone on purpose — locking body overflow here made the scrollbar vanish
  // (and the layout jump) every time an input was focused.
  useEffect(() => {
    if (!open) return;
    rootRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
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

  // Flag on <body> while any input dropdown is open so the homepage hero's
  // scroll fade leaves the open modal fully opaque (it lives inside the faded
  // search block). Dispatch a scroll event so the hero re-applies immediately,
  // even if the user isn't actively scrolling.
  useEffect(() => {
    if (open) document.body.dataset.searchModalOpen = "1";
    else delete document.body.dataset.searchModalOpen;
    window.dispatchEvent(new Event("scroll"));
    return () => {
      delete document.body.dataset.searchModalOpen;
    };
  }, [open]);

  // Let the hero backdrop follow the chosen city (see onDestChange prop).
  useEffect(() => {
    onDestChange?.(dest?.destinationId ?? null);
  }, [dest, onDestChange]);

  const destLabel = useMemo(() => {
    if (!dest) return null;
    const d = DESTINATIONS.find((x) => x.id === dest.destinationId);
    if (!d) return null;
    // Show "City · Start point" unless the point is just the city centre (whose
    // label is the city name), in which case show only the city.
    return dest.pointName && dest.pointName !== d.name
      ? `${d.name} · ${dest.pointName}`
      : d.name;
  }, [dest]);

  // A single chosen day (start only, or start === end) shows just that date —
  // not "Jun 7 — …" or "Jun 7 — Jun 7".
  const dateLabel = !range.start
    ? null
    : !range.end || isSameDay(range.start, range.end)
      ? formatShort(range.start)
      : `${formatShort(range.start)} — ${formatShort(range.end)}`;

  const travelersLabel = useMemo(() => {
    // Simple mode: just the head-count (stored as adults).
    if (SIMPLE_TRAVELERS) {
      return `${travelers.adults} ${travelers.adults === 1 ? "άτομο" : "άτομα"}`;
    }
    const parts = [
      `${travelers.adults} ${travelers.adults === 1 ? "ενήλικας" : "ενήλικες"}`,
    ];
    if (travelers.children > 0) {
      parts.push(
        `${travelers.children} ${travelers.children === 1 ? "παιδί" : "παιδιά"}`
      );
    }
    return parts.join(" · ");
  }, [travelers]);

  // Total people in the party — drives the one/two-person traveller icon.
  const travelerCount = travelers.adults + travelers.children;

  // Search is complete once: a destination, a length, and a valid party. The
  // length comes from whichever mode the combined field is in — a typed day count
  // ("days") OR a chosen start date ("dates"). (#2)
  const hasDuration = durationDays !== null && durationDays >= 1;
  const hasLength = lengthMode === "days" ? hasDuration : !!range.start;
  const canSearch = !!dest && hasLength && travelers.adults >= 1;

  const missingInputs = useMemo(() => {
    const missing: string[] = [];
    if (!dest) missing.push("προορισμό");
    if (!hasLength) missing.push(lengthMode === "days" ? "διάρκεια" : "ημερομηνίες");
    if (travelers.adults < 1) missing.push("ταξιδιώτες");
    return missing;
  }, [dest, hasLength, lengthMode, travelers.adults]);

  // Hand the chosen destination/area/dates AND party to the main planner via query
  // params. The party (adults + each child's age) drives the planner's price totals
  // (see activityPrice / setActiveParty); ages go as a comma list, unset → 0.
  function handleSearch() {
    if (!canSearch) {
      setNotice({
        id: Date.now(),
        state: "error",
        message: `Συμπλήρωσε: ${missingInputs.join(", ")}.`,
      });
      if (searchIconAlertTimeout.current) {
        clearTimeout(searchIconAlertTimeout.current);
      }
      setSearchIconAlert(true);
      searchIconAlertTimeout.current = setTimeout(() => {
        setSearchIconAlert(false);
      }, 900);
      if (!dest) setOpen("dest");
      else if (!hasLength && lengthMode === "dates") setOpen("dates");
      else if (travelers.adults < 1) setOpen("travelers");
      return;
    }
    const params = new URLSearchParams();
    if (dest) {
      params.set("dest", dest.destinationId);
      // The personal start point: its coordinates + label (the plan anchors the
      // route here instead of a city area). See parseStartParams.
      params.set("slat", String(dest.coords.lat));
      params.set("slng", String(dest.coords.lng));
      params.set("sname", dest.pointName);
    }
    // Send only the active mode's length: a typed day count, or the picked dates.
    if (lengthMode === "days") {
      if (hasDuration) params.set("days", String(durationDays));
    } else {
      if (range.start) params.set("start", toISODate(range.start));
      if (range.end) params.set("end", toISODate(range.end));
    }
    params.set("adults", String(travelers.adults));
    if (travelers.children > 0) {
      params.set("ages", travelers.childAges.map((a) => a ?? 0).join(","));
    }
    const qs = params.toString();
    router.push(qs ? `/plan?${qs}` : "/plan");
  }

  const toggle = (key: ModalKey) => setOpen((o) => (o === key ? null : key));

  // The combined length field's calendar icon — the ONLY control that opens the
  // calendar and the toggle between the two faces:
  //   • days mode            → switch to dates mode AND open the calendar
  //   • dates mode, closed   → re-open the calendar (stay in dates mode)
  //   • dates mode, open     → flip back to the day-count input (close calendar)
  const onLengthIconClick = () => {
    if (lengthMode === "days") {
      setLengthMode("dates");
      setOpen("dates");
    } else if (open !== "dates") {
      setOpen("dates");
    } else {
      setLengthMode("days");
      setOpen(null);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 -inset-y-5 rounded-[2rem] bg-gradient-to-r from-orange-300/30 via-pink-300/25 to-sky-300/25 blur-2xl"
      />
      <div
        className={`${playEntranceAnimations ? "animate-fade-in-up" : ""} relative grid grid-cols-1 items-center gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]`}
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
                onChooseDestination={(destinationId) => {
                  const d = DESTINATIONS.find((x) => x.id === destinationId);
                  if (!d) return;
                  // Default the start point to the city centre; the dropdown
                  // stays open so the address/hotel step can refine it.
                  setDest({ destinationId, pointName: d.name, coords: d.center });
                  setDestQuery("");
                }}
                onChoosePoint={(destinationId, point) => {
                  setDest({
                    destinationId,
                    pointName: point.name,
                    coords: point.coords,
                  });
                  setDestQuery("");
                  setOpen(null);
                }}
              />
            </Dropdown>
          )}
        </DestField>

        <TripLengthField
          mode={lengthMode}
          calendarOpen={open === "dates"}
          onIconClick={onLengthIconClick}
          onOpenCalendar={() => setOpen("dates")}
          days={durationDays}
          onDaysChange={setDurationDays}
          dateLabel={dateLabel}
          playEntranceAnimations={playEntranceAnimations}
          onClearDays={durationDays !== null ? () => setDurationDays(null) : undefined}
          onClearDates={range.start ? () => setRange({ start: null, end: null }) : undefined}
        >
          {open === "dates" && (
            <Dropdown align="center" onClose={() => setOpen(null)}>
              <CalendarModal
                value={range}
                onChange={setRange}
                onClose={() => setOpen(null)}
              />
            </Dropdown>
          )}
        </TripLengthField>

        <Field
          active={open === "travelers"}
          icon={<TravelersIcon multiple={travelerCount > 1} />}
          placeholder="Ταξιδιώτες"
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

        {/* The button itself rides the bar's fade-in-up like every input (no
            separate late pop); only its icon pops, continuing the field icons'
            stagger (490 → 580 → 670ms). */}
        <button
          type="button"
          onClick={handleSearch}
          aria-disabled={!canSearch}
          title={canSearch ? undefined : "Αναζήτηση"}
          className={`group flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium lg:w-auto ${homeStyles.primaryButton}`}
        >
          <span
            className={`${playEntranceAnimations ? "animate-icon-pop" : ""} inline-flex shrink-0`}
            style={{ animationDelay: "670ms" }}
          >
            <SearchIcon
              className={`h-5 w-5 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-12 ${searchIconAlert ? "animate-bounce" : ""
                }`}
            />
          </span>
          <span>Αναζήτηση</span>
        </button>
      </div>

      {notice && (
        <StatusToast
          key={notice.id}
          state={notice.state}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}
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
  muted = false,
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
  // When true the chosen value is rendered in the muted placeholder gray
  // instead of the usual dark text (used for the travellers default party).
  muted?: boolean;
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
          className={`flex-1 truncate text-sm ${value && !muted ? "text-zinc-800" : "text-zinc-400"} ${onClear ? "pr-6" : ""
            }`}
        >
          {value ? value : placeholder}
        </span>
      </button>
      {onClear && (
        <button
          type="button"
          aria-label="Καθαρισμός"
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

// The combined trip-length field (#2): one input that flips between a free-typed
// day count and a date range. The calendar ICON is the toggle AND the only opener
// of the calendar modal (clicking the field body never opens it). The calendar
// itself (passed in as `children`) is unchanged from before. Responsive: the icon
// + body sit on one row at every size, and the calendar uses the responsive
// Dropdown (a top overlay on mobile, an anchored panel on desktop).
function TripLengthField({
  mode,
  calendarOpen,
  onIconClick,
  onOpenCalendar,
  days,
  onDaysChange,
  dateLabel,
  playEntranceAnimations,
  onClearDays,
  onClearDates,
  children,
}: {
  mode: LengthMode;
  calendarOpen: boolean;
  onIconClick: () => void;
  // Opens the calendar WITHOUT toggling mode — used when the body is clicked in
  // calendar mode (so the field body behaves like the icon there).
  onOpenCalendar: () => void;
  days: number | null;
  onDaysChange: (days: number | null) => void;
  dateLabel: string | null;
  playEntranceAnimations: boolean;
  onClearDays?: () => void;
  onClearDates?: () => void;
  children?: React.ReactNode;
}) {
  const showClear = mode === "days" ? !!onClearDays : !!onClearDates;
  return (
    <div className="group relative min-w-0 flex-1">
      <div
        className={`flex w-full items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 transition-colors ${calendarOpen ? homeStyles.fieldActive : homeStyles.fieldIdle
          }`}
      >
        {/* Calendar icon: toggles days⇄dates and is the ONLY opener of the modal. */}
        <button
          type="button"
          onClick={onIconClick}
          aria-label={
            mode === "days"
              ? "Άλλαξε σε ημερομηνίες και άνοιξε ημερολόγιο"
              : "Άνοιξε ημερολόγιο ή άλλαξε σε διάρκεια"
          }
          title={mode === "days" ? "Διάλεξε ημερομηνίες" : "Διάλεξε διάρκεια σε μέρες"}
          className={`${playEntranceAnimations ? "animate-icon-pop" : ""} inline-flex shrink-0 cursor-pointer text-zinc-400 transition-transform duration-200 ease-out hover:text-orange-500 group-hover:scale-110 group-hover:-translate-y-0.5`}
          style={{ animationDelay: "490ms" }}
        >
          <CalendarIcon className="h-5 w-5" />
        </button>

        {mode === "days" ? (
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={days ?? ""}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              onDaysChange(Number.isFinite(n) && n >= 1 ? n : null);
            }}
            placeholder="Διάρκεια (μέρες)"
            size={1}
            className={`w-full min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${showClear ? "pr-6" : ""
              }`}
          />
        ) : (
          // Calendar mode: clicking the date display opens the calendar too (same
          // as the icon). In days mode the body is the number input above, which
          // never opens the calendar.
          <button
            type="button"
            onClick={onOpenCalendar}
            className={`flex-1 truncate text-left text-sm ${dateLabel ? "text-zinc-800" : "text-zinc-400"} ${showClear ? "pr-6" : ""
              }`}
          >
            {dateLabel ?? "Από — Έως"}
          </button>
        )}
      </div>

      {showClear && (
        <button
          type="button"
          aria-label="Καθαρισμός"
          onClick={mode === "days" ? onClearDays : onClearDates}
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
            placeholder="Αναζήτησε προορισμό"
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
            <Typewriter text="Αναζήτησε προορισμό" startDelay={820} onDone={onTypingDone} />
          </button>
        )}
      </div>
      {onClear && (
        <button
          type="button"
          aria-label="Καθαρισμός"
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
        className={`animate-pop-in z-[100] origin-top rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-orange-900/10 absolute inset-x-0 top-full mx-auto max-h-[calc(100vh-6rem)] max-w-[calc(100vw-1rem)] overflow-y-auto overflow-x-hidden sm:inset-x-auto sm:top-full sm:mx-0 sm:mt-2 sm:max-h-none sm:max-w-none sm:overflow-hidden ${desktopPos}`}
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
