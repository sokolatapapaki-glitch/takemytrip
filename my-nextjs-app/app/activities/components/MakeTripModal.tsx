"use client";

// The "Make Trip" modal on the activities page: the home-page search inputs in
// the app's centered modal. The DESTINATION is FIXED to the page's city (your
// selection only lives there). Below it the home-page "where to stay" (Διαμονή)
// accommodation search is open by default; the travellers and trip-length inputs
// start EMPTY and must be filled. Search hands off to /plan exactly like the
// homepage (dest + slat/slng/sname + days|dates + party), plus one ?only= per
// selected activity so the planner builds the trip from ONLY those activities.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaMapLocationDot } from "react-icons/fa6";
import { useApp } from "@/app/context/AppContext";
import type { City } from "@/app/components/ActivityCombinations/core/cities.data";
import {
  StartPointSearch,
  type StartPoint,
} from "@/app/components/ActivityCombinations/StartPointSearch";
import { MapPickerModal } from "@/app/start/components/MapPickerModal";
import { CalendarModal } from "@/app/start/components/CalendarModal";
import { TravelersModal } from "@/app/start/components/TravelersModal";
import { formatShort, isSameDay } from "@/app/start/data/dateUtils";
import type { DateRange, Travelers } from "@/app/start/data/types";
import { homeStyles } from "@/app/start/data/palette";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
import { SIMPLE_TRAVELERS } from "@/app/config";
import {
  CalendarIcon,
  MapPinIcon,
  SearchIcon,
  UsersIcon,
} from "@/app/start/components/icons";

type Section = "stay" | "length" | "travelers" | null;
// The length field flips between a free-typed day count and a date range, just
// like the homepage's combined length field (the calendar icon is the toggle).
type LengthMode = "days" | "dates";

// Local date → "YYYY-MM-DD" (no timezone shift) — same as the homepage search.
const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// One field row, styled like the homepage search fields. Clicking it toggles its
// panel, which renders IN FLOW below (no anchored dropdowns — they'd be clipped
// by the modal's scroll container).
function FieldRow({
  active,
  icon,
  value,
  placeholder,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  value: string | null;
  placeholder: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 text-left transition-colors ${
        active ? homeStyles.fieldActive : homeStyles.fieldIdle
      }`}
    >
      <span className="inline-flex shrink-0 text-zinc-400">{icon}</span>
      <span className={`flex-1 truncate text-sm ${value ? "text-zinc-800" : "text-zinc-400"}`}>
        {value ?? placeholder}
      </span>
    </button>
  );
}

export function MakeTripModal({
  city,
  selectedNames,
}: {
  city: City;
  selectedNames: string[];
}) {
  const router = useRouter();
  const { closeModal } = useApp();

  // The city centre — the search bias / map centre for the accommodation picker.
  const cityCenter = city.areas[0].coords;

  // Where to stay (Διαμονή) — starts empty; the panel opens by default.
  const [point, setPoint] = useState<StartPoint | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  // Trip length — starts empty (no value), days mode first like the homepage.
  const [lengthMode, setLengthMode] = useState<LengthMode>("days");
  const [durationDays, setDurationDays] = useState<number | null>(null);
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  // Travellers — starts empty; opening the panel seeds a default so the steppers
  // are usable (so the field only gets a value once you deliberately open it).
  const [travelers, setTravelers] = useState<Travelers | null>(null);
  // The "where to stay" panel is open by default.
  const [open, setOpen] = useState<Section>("stay");
  const [formError, setFormError] = useState<string | null>(null);

  const toggle = (s: Exclude<Section, null>) => {
    if (s === "travelers" && !travelers) {
      setTravelers({ adults: 2, children: 0, childAges: [] });
    }
    setOpen((o) => (o === s ? null : s));
  };

  const dateLabel = !range.start
    ? null
    : !range.end || isSameDay(range.start, range.end)
      ? formatShort(range.start)
      : `${formatShort(range.start)} — ${formatShort(range.end)}`;

  const travelersLabel = useMemo(() => {
    if (!travelers) return null;
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

  const hasDuration = durationDays !== null && durationDays >= 1;
  const hasLength = lengthMode === "days" ? hasDuration : !!range.start;

  // The combined length field's calendar icon — the toggle between the two faces
  // and the only opener of the calendar (mirrors the homepage).
  const onLengthIconClick = () => {
    if (lengthMode === "days") {
      setLengthMode("dates");
      setOpen("length");
    } else if (open !== "length") {
      setOpen("length");
    } else {
      setLengthMode("days");
      setOpen(null);
    }
  };

  // Same hand-off as the homepage search, plus ?only= per selected activity so
  // the planner builds the trip from ONLY those activities.
  function search() {
    const missing: string[] = [];
    if (!point) missing.push("διαμονή");
    if (!hasLength) missing.push(lengthMode === "days" ? "διάρκεια" : "ημερομηνίες");
    if (!travelers || travelers.adults < 1) missing.push("ταξιδιώτες");
    if (missing.length > 0) {
      setFormError(`Συμπλήρωσε: ${missing.join(", ")}.`);
      // Open the first missing input.
      if (!point) setOpen("stay");
      else if (!hasLength && lengthMode === "dates") setOpen("length");
      else if (!travelers || travelers.adults < 1) setOpen("travelers");
      return;
    }

    const params = new URLSearchParams();
    params.set("dest", city.id);
    // The accommodation point: coords + label (the plan anchors the route here
    // instead of a city area). See parseStartParams.
    params.set("slat", String(point!.coords.lat));
    params.set("slng", String(point!.coords.lng));
    params.set("sname", point!.name);
    if (lengthMode === "days") {
      params.set("days", String(durationDays));
    } else {
      params.set("start", toISODate(range.start!));
      if (range.end) params.set("end", toISODate(range.end));
    }
    params.set("adults", String(travelers!.adults));
    if (!SIMPLE_TRAVELERS && travelers!.children > 0) {
      params.set("ages", travelers!.childAges.map((a) => a ?? 0).join(","));
    }
    for (const name of selectedNames) params.append("only", name);
    closeModal();
    router.push(`/plan?${params.toString()}`);
  }

  const panelClass = "rounded-2xl border border-black/[.06] bg-white shadow-sm";

  return (
    <div className="flex flex-col gap-3">
      <div className="pr-8">
        <h3 className="text-lg font-semibold text-zinc-800">
          Δημιουργία ταξιδιού στην πόλη: {city.name}
        </h3>
        <p className="text-sm text-zinc-500">
          {selectedNames.length === 1
            ? "Το ταξίδι θα φτιαχτεί από 1 επιλεγμένη δραστηριότητα."
            : `Το ταξίδι θα φτιαχτεί από ${selectedNames.length} επιλεγμένες δραστηριότητες.`}
        </p>
      </div>

      {/* Destination — FIXED to the page's city (not editable). */}
      <div className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
        <span className="inline-flex shrink-0 text-zinc-400">
          <MapPinIcon className="h-5 w-5" />
        </span>
        <span className="flex-1 truncate text-sm font-medium text-zinc-800">
          {city.name}
        </span>
      </div>

      {/* Where to stay (Διαμονή) — the homepage accommodation search, open by
          default. Picking a suggestion (or a map point) fills it. */}
      <FieldRow
        active={open === "stay"}
        icon={<MapPinIcon className="h-5 w-5" />}
        value={point?.name ?? null}
        placeholder="Διαμονή (πού θα μείνεις)"
        onClick={() => toggle("stay")}
      />
      {open === "stay" ? (
        <div className={`${panelClass} p-3`}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Διαμονή στη/στο {city.name}
          </p>
          <StartPointSearch
            cityName={city.name}
            near={cityCenter}
            autoFocus
            currentLabel={point?.name}
            onSelect={(p) => {
              setPoint(p);
              setFormError(null);
              setOpen(null);
            }}
          />
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className={`mt-2 inline-flex w-full items-center justify-center gap-2 ${buttonStyles.common}`}
          >
            <FaMapLocationDot className="h-4 w-4 text-orange-500" />
            Αναζήτηση στον χάρτη
          </button>
        </div>
      ) : null}

      {/* Trip length — days number (primary) or a date range via the calendar
          icon, exactly like the homepage's combined length field. */}
      <div
        className={`flex w-full items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 transition-colors ${
          open === "length" ? homeStyles.fieldActive : homeStyles.fieldIdle
        }`}
      >
        <button
          type="button"
          onClick={onLengthIconClick}
          aria-label={
            lengthMode === "days"
              ? "Άλλαξε σε ημερομηνίες και άνοιξε ημερολόγιο"
              : "Άνοιξε ημερολόγιο ή άλλαξε σε διάρκεια"
          }
          className="inline-flex shrink-0 cursor-pointer text-zinc-400 transition-colors hover:text-orange-500"
        >
          <CalendarIcon className="h-5 w-5" />
        </button>
        {lengthMode === "days" ? (
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={durationDays ?? ""}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setDurationDays(Number.isFinite(n) && n >= 1 ? n : null);
              setFormError(null);
            }}
            placeholder="Διάρκεια (μέρες)"
            size={1}
            className="w-full min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setOpen("length")}
            className={`flex-1 truncate text-left text-sm ${dateLabel ? "text-zinc-800" : "text-zinc-400"}`}
          >
            {dateLabel ?? "Από — Έως"}
          </button>
        )}
      </div>
      {open === "length" && lengthMode === "dates" ? (
        <div className={`${panelClass} flex justify-center`}>
          <CalendarModal
            value={range}
            onChange={(r) => {
              setRange(r);
              setFormError(null);
            }}
            onClose={() => setOpen(null)}
          />
        </div>
      ) : null}

      {/* Travellers — starts empty; opening it seeds a default. */}
      <FieldRow
        active={open === "travelers"}
        icon={<UsersIcon className="h-5 w-5" />}
        value={travelersLabel}
        placeholder="Ταξιδιώτες"
        onClick={() => toggle("travelers")}
      />
      {open === "travelers" && travelers ? (
        <div className={`${panelClass} flex justify-center`}>
          <TravelersModal
            value={travelers}
            onChange={(t) => {
              setTravelers(t);
              setFormError(null);
            }}
          />
        </div>
      ) : null}

      {formError ? (
        <p className="text-sm text-orange-600">{formError}</p>
      ) : null}

      <button
        type="button"
        onClick={search}
        className={`mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium ${homeStyles.primaryButton}`}
      >
        <SearchIcon className="h-5 w-5" />
        <span>Αναζήτηση</span>
      </button>

      {mapOpen ? (
        <MapPickerModal
          cityName={city.name}
          cityCenter={cityCenter}
          initialPoint={point}
          onSelect={(p) => {
            setPoint(p);
            setFormError(null);
            setMapOpen(false);
            setOpen(null);
          }}
          onClose={() => setMapOpen(false)}
        />
      ) : null}
    </div>
  );
}
