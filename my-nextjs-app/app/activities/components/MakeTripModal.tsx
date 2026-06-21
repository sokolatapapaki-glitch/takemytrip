"use client";

// The "Make Trip" modal on the activities page: the home-page search inputs
// (destination / dates / travelers + Search) in the app's centered modal. The
// DESTINATION is fixed to the page's city (your selection only exists there) —
// only its AREA is choosable, defaulting to the city centre. Search hands off
// to /plan exactly like the homepage, plus one ?include= per selected activity
// so the planner builds trips that MUST contain them.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/context/AppContext";
import type { City, Area } from "@/app/components/ActivityCombinations/core/cities.data";
import { CalendarModal } from "@/app/start/components/CalendarModal";
import { TravelersModal } from "@/app/start/components/TravelersModal";
import { formatShort, isSameDay } from "@/app/start/data/dateUtils";
import type { DateRange, Travelers } from "@/app/start/data/types";
import { homeStyles } from "@/app/start/data/palette";
import {
  CalendarIcon,
  MapPinIcon,
  SearchIcon,
  UsersIcon,
} from "@/app/start/components/icons";

type Section = "area" | "dates" | "travelers" | null;

// Local date → "YYYY-MM-DD" (no timezone shift) — same as the homepage search.
const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// One field row, styled like the homepage search fields. Clicking it toggles
// its panel, which renders IN FLOW below (no anchored dropdowns — they'd be
// clipped by the modal's scroll container).
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

  // City – Centre by default; only the area is changeable.
  const [area, setArea] = useState<Area>(city.areas[0]);
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [travelers, setTravelers] = useState<Travelers>({
    adults: 2,
    children: 0,
    childAges: [],
  });
  const [open, setOpen] = useState<Section>("dates");
  const [dateAlert, setDateAlert] = useState(false);

  const toggle = (s: Exclude<Section, null>) => setOpen((o) => (o === s ? null : s));

  const dateLabel = !range.start
    ? null
    : !range.end || isSameDay(range.start, range.end)
      ? formatShort(range.start)
      : `${formatShort(range.start)} — ${formatShort(range.end)}`;

  const travelersLabel = useMemo(() => {
    const parts = [`${travelers.adults} adult${travelers.adults !== 1 ? "s" : ""}`];
    if (travelers.children > 0)
      parts.push(`${travelers.children} child${travelers.children !== 1 ? "ren" : ""}`);
    return parts.join(" · ");
  }, [travelers]);

  // Same hand-off as the homepage search, plus ?include= per selected activity.
  function search() {
    if (!range.start) {
      setDateAlert(true);
      setOpen("dates");
      return;
    }
    const params = new URLSearchParams();
    params.set("dest", city.id);
    params.set("area", area.id);
    params.set("start", toISODate(range.start));
    if (range.end) params.set("end", toISODate(range.end));
    params.set("adults", String(travelers.adults));
    if (travelers.children > 0) {
      params.set("ages", travelers.childAges.map((a) => a ?? 0).join(","));
    }
    for (const name of selectedNames) params.append("include", name);
    closeModal();
    router.push(`/plan?${params.toString()}`);
  }

  const panelClass = "rounded-2xl border border-black/[.06] bg-white shadow-sm";

  return (
    <div className="flex flex-col gap-3">
      <div className="pr-8">
        <h3 className="text-lg font-semibold text-zinc-800">
          Φτιάξε ταξίδι στην πόλη: {city.name}
        </h3>
        <p className="text-sm text-zinc-500">
          {selectedNames.length === 1
            ? "1 επιλεγμένη δραστηριότητα θα συμπεριληφθεί"
            : `${selectedNames.length} επιλεγμένες δραστηριότητες θα συμπεριληφθούν`}{" "}
          στο πλάνο σου.
        </p>
      </div>

      {/* Destination: the city is fixed; the area below it is choosable. */}
      <FieldRow
        active={open === "area"}
        icon={<MapPinIcon className="h-5 w-5" />}
        value={`${city.name} · ${area.name}`}
        placeholder="Προορισμός"
        onClick={() => toggle("area")}
      />
      {open === "area" ? (
        <div className={`${panelClass} flex flex-col gap-1 p-2`}>
          {city.areas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setArea(a);
                setOpen(null);
              }}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                a.id === area.id
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
      ) : null}

      <FieldRow
        active={open === "dates"}
        icon={<CalendarIcon className="h-5 w-5" />}
        value={dateLabel}
        placeholder="Από — Έως"
        onClick={() => toggle("dates")}
      />
      {open === "dates" ? (
        <div className={`${panelClass} flex justify-center`}>
          <CalendarModal
            value={range}
            onChange={(r) => {
              setRange(r);
              setDateAlert(false);
            }}
            onClose={() => setOpen(null)}
          />
        </div>
      ) : null}
      {dateAlert ? (
        <p className="text-sm text-orange-600">Διάλεξε πρώτα τις ημερομηνίες σου.</p>
      ) : null}

      <FieldRow
        active={open === "travelers"}
        icon={<UsersIcon className="h-5 w-5" />}
        value={travelersLabel}
        placeholder="Ταξιδιώτες"
        onClick={() => toggle("travelers")}
      />
      {open === "travelers" ? (
        <div className={`${panelClass} flex justify-center`}>
          <TravelersModal value={travelers} onChange={setTravelers} />
        </div>
      ) : null}

      <button
        type="button"
        onClick={search}
        className={`mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium ${homeStyles.primaryButton}`}
      >
        <SearchIcon className="h-5 w-5" />
        <span>Αναζήτηση</span>
      </button>
    </div>
  );
}
