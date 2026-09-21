"use client";

import { useState } from "react";
import { FaChevronDown, FaChevronUp, FaRoute, FaTrashCan } from "react-icons/fa6";
import { DAYS_FULL } from "./core/activities.data";
import { activityPrice, partyPriceLines, type Party } from "./core/activities.functions";
import { HIDE_ACTIVITY_PRICES, SHOW_ACTIVITY_STARS, SIMPLE_TRAVELERS, HIDE_TRAVELERS } from "@/app/config";
import { ALL_ACTIVITIES, CITIES, type Area } from "./core/cities.data";
import { DESTINATION_IMAGES } from "@/app/cities/components/destinationImages.generated";
import type { Filter, Selection } from "./core/filters.functions";
import type { LeftoverReason, Trip } from "./core/trip.functions";
import type { ScheduledItem } from "./core/schedule.functions";
import { DayItinerary, type AddWindow } from "./ComboResults";
import { TripDashboard } from "./TripDashboard";
import { DayMapModal } from "./DayMapModal";
import type { MapStop } from "./DayMap";
import { printTrip } from "./tripPrint";
import { buttonStyles } from "@/app/components/ui/buttonStyles";

// Map an activity name → its coordinates (names are unique across every city's
// catalogue), so a scheduled day can be plotted on the per-day map. Lunch slots
// have no entry and are skipped.
const COORDS_BY_NAME = new Map(
  ALL_ACTIVITIES.map((a) => [a.name, a.coords] as const)
);

// The mappable stops of one day's plan, in visiting order (lunch + anything
// without known coords dropped).
function dayMapStops(plan: { items: { name: string; lunch?: boolean }[] }): MapStop[] {
  return plan.items
    .filter((it) => !it.lunch)
    .map((it) => ({ name: it.name, coords: COORDS_BY_NAME.get(it.name) }))
    .filter((s): s is MapStop => !!s.coords);
}

function leftoverText(reason: LeftoverReason): string {
  return reason === "closed"
    ? "κλειστό όλες τις επιλεγμένες ημέρες"
    : reason === "no-room"
      ? "δεν χωράει στον διαθέσιμο χρόνο"
      : reason === "removed"
        ? "αφαιρέθηκε από το πλάνο"
        : reason === "bumped"
          ? "έκανε χώρο για μια υποχρεωτική δραστηριότητα"
          : "θα χαμήλωνε τη μέση βαθμολογία";
}

// Total price = what the chosen traveller party pays across every scheduled
// activity (each used once in a trip) — per-age prices with the cheaper family
// bundle when it matches; see activityPrice. Uses the engine's active party.
function totalPriceOf(trip: Trip): number {
  return trip.days.reduce(
    (sum, d) => sum + d.activities.reduce((s, a) => s + activityPrice(a), 0),
    0
  );
}

// Per-member trip cost (#10): what ONE person of each group (adults, each child
// age) pays across the WHOLE trip, summed from each activity's per-age prices.
// These are catalogue per-age prices (family bundles, applied at the activity
// level, can make the grand total lower) — they answer "πόσο κοστίζει το κάθε
// άτομο", which the previous per-member view showed.
function tripMemberLines(
  trip: Trip,
  party: Party
): { label: string; count: number; perPerson: number }[] {
  const acc = new Map<string, { label: string; count: number; perPerson: number }>();
  for (const d of trip.days) {
    for (const a of d.activities) {
      for (const line of partyPriceLines(a, party)) {
        const cur = acc.get(line.label) ?? {
          label: line.label,
          count: line.count,
          perPerson: 0,
        };
        cur.perPerson += line.perPerson;
        acc.set(line.label, cur);
      }
    }
  }
  return [...acc.values()];
}

// The traveller party in Greek, e.g. "2 ενήλικες, 1 παιδί" (children dropped when
// there are none). Singular/plural agree: ενήλικας/ενήλικες, παιδί/παιδιά.
function travelersLabel(party: Party): string {
  const adults = party.adults;
  // Simple mode: just the head-count, no adults/children split.
  if (SIMPLE_TRAVELERS) {
    return `${adults} ${adults === 1 ? "άτομο" : "άτομα"}`;
  }
  const kids = party.childAges.length;
  const adultPart = `${adults} ${adults === 1 ? "ενήλικας" : "ενήλικες"}`;
  if (kids === 0) return adultPart;
  return `${adultPart}, ${kids} ${kids === 1 ? "παιδί" : "παιδιά"}`;
}

// A reusable trip card with two states toggled within the SAME component:
//   • closed (default) — the compact summary: image, City – Area, total price,
//     total days, and a "See Activities" button that expands it.
//   • open — the full program: per-day timeline (reusing DayItinerary, so the
//     "Hours" view + per-day total hours are kept), then the "Why this trip?"
//     proof BELOW the days, and a "Not scheduled" toggle at the bottom.
// Glass styling matches the Cities / Map / Activities pages. The component is
// page-agnostic so it can be reused elsewhere; the Plan page opens the best trip
// by default via `defaultOpen`.
export function TripCard({
  trip,
  title,
  description,
  cityName,
  areaName,
  party,
  showProof,
  showLeftover = true,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  onReplace,
  onRemove,
  onAdd,
  onSave,
  onDelete,
  selections,
  startHours,
  endHours,
  circulars,
  area,
  filters,
}: {
  trip: Trip;
  title: string;
  description?: string;
  cityName?: string; // for the "City – Area" line
  areaName?: string;
  party?: Party; // the traveller party — shown in the header (adults + children)
  showProof: boolean;
  // The "Not scheduled" (Μη προγραμματισμένες) section at the bottom. Shown on
  // My Trips; the plan page hides it via showLeftover={false}.
  showLeftover?: boolean;
  defaultOpen?: boolean;
  // Optional CONTROLLED open state: when `open` is provided the card's expansion
  // is driven by the parent (and `onOpenChange` fires on toggle). Omitted = the
  // card manages its own open state from `defaultOpen`.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Opt-in (My Trips page): a "Replace" button on each activity row, left of
  // "See more". The handler gets the row's scheduled slot + day.
  onReplace?: (item: ScheduledItem, day: number) => void;
  // Opt-in (My Trips page): a "Remove" button on each activity row.
  onRemove?: (item: ScheduledItem, day: number) => void;
  // Opt-in (My Trips page): "+ Add" buttons in each day's free time.
  onAdd?: (win: AddWindow, day: number) => void;
  // Makes the "Save Trip" button live; omitted (e.g. on /my-trips, where the
  // trip IS the saved copy) the button is hidden.
  onSave?: () => void;
  // Renders a "Delete" button in the card header (My Trips page) — removes the
  // saved trip. Omitted elsewhere, so plan-page cards show no Delete.
  onDelete?: () => void;
  // The proof inputs — only needed when showProof is true (the plan page).
  // Saved trips can't carry them (filters hold functions), so they're optional.
  selections?: Selection[];
  startHours?: number[];
  endHours?: number[];
  circulars?: boolean[];
  area?: Area;
  filters?: Filter[];
}) {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = controlledOpen ?? openState;
  const toggleOpen = () => {
    const next = !open;
    if (controlledOpen === undefined) setOpenState(next);
    onOpenChange?.(next);
  };
  const [proofOpen, setProofOpen] = useState(false);
  const [leftoverOpen, setLeftoverOpen] = useState(false);
  // Which day's route map is open (by day SLOT index, so the slot's circular
  // flag lines up), or null when closed.
  const [mapSlot, setMapSlot] = useState<number | null>(null);
  // Brief "Saved ✓" feedback on the Save Trip button.
  const [justSaved, setJustSaved] = useState(false);

  const totalPrice = totalPriceOf(trip);
  // Show "City – Area", but collapse to just the city when the area name is the
  // city itself (e.g. the centre area named after the city) so it never reads
  // like "Rome – Rome".
  const cityArea = cityName
    ? areaName && areaName !== cityName
      ? `${cityName} – ${areaName}`
      : cityName
    : title;
  // The destination's cover photo (cities are matched by name — TripCard only
  // receives cityName). Missing → the gradient + route-icon placeholder.
  const coverImage = cityName
    ? DESTINATION_IMAGES[CITIES.find((c) => c.name === cityName)?.id ?? ""] ?? null
    : null;

  // Indicative savings (#10): the city's pass, plus any magic combo whose every
  // activity is in this trip — its bundle price is the party's summed activity
  // prices minus the combo's (indicative) discount. Both are clearly labelled
  // "ενδεικτικά" in the UI.
  const cityObj = cityName ? CITIES.find((c) => c.name === cityName) : undefined;
  const cityPass = cityObj?.cityPass ?? null;
  const tripActByName = new Map(
    trip.days.flatMap((d) => d.activities).map((a) => [a.name, a] as const)
  );
  const applicableCombos = (cityObj?.magicCombos ?? [])
    .filter((c) => c.activityNames.every((n) => tripActByName.has(n)))
    .map((c) => {
      const full = c.activityNames.reduce(
        (s, n) => s + activityPrice(tripActByName.get(n)!, party),
        0
      );
      const bundle = Math.round(full * (1 - c.discountPercent / 100));
      return { combo: c, full, bundle, saving: full - bundle };
    })
    .filter((x) => x.full > 0 && x.saving > 0);

  const cardClass =
    "animate-card-pop overflow-hidden rounded-3xl border border-white/80 bg-white/80 shadow-xl shadow-orange-900/10 ring-1 ring-black/5 backdrop-blur-md transition duration-200 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/10";
  const imageClass =
    "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 via-rose-400 to-fuchsia-500 text-white";
  // Common button (see buttonStyles.ts) + the inline-flex layout for its arrow.
  const toggleBtn = `inline-flex items-center gap-1.5 ${buttonStyles.common}`;
  // The delete + show/hide-activities buttons. On desktop they sit together
  // (under the cost, or on the header's right when the star rating shows); on
  // mobile they're split — delete to the top-right, the toggle to the
  // bottom-right of the header (see the header markup below).
  const deleteButton = onDelete ? (
    <button
      type="button"
      onClick={onDelete}
      title="Διαγραφή ταξιδιού"
      aria-label="Διαγραφή ταξιδιού"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/[.05] hover:text-red-600 dark:hover:bg-white/[.08] dark:hover:text-red-400"
    >
      <FaTrashCan className="h-4 w-4" />
    </button>
  ) : null;
  const toggleButton = (
    <button
      type="button"
      onClick={toggleOpen}
      aria-expanded={open}
      className={`inline-flex shrink-0 items-center gap-1.5 ${buttonStyles.underline}`}
    >
      {open ? "Απόκρυψη" : "Δες δραστηριότητες"}
      {open ? (
        <FaChevronUp className="h-3 w-3" />
      ) : (
        <FaChevronDown className="h-3 w-3" />
      )}
    </button>
  );
  const headerButtons = (
    <>
      {deleteButton}
      {toggleButton}
    </>
  );

  // Save + Λήψη PDF. On desktop these live in the header (right side); on mobile
  // they stay in the body, below the header (so they don't crowd the header).
  const tripActions = (
    <>
      {onSave ? (
        <button
          type="button"
          onClick={() => {
            onSave();
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2000);
          }}
          className={`${buttonStyles.common} whitespace-nowrap`}
        >
          {justSaved ? "Αποθηκεύτηκε ✓" : "Αποθήκευση ταξιδιού"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => printTrip(trip, cityArea)}
        className={`${buttonStyles.secondary} whitespace-nowrap`}
      >
        Λήψη PDF
      </button>
    </>
  );

  // The header looks identical whether the card is open or closed; only the
  // toggle's label/arrow flips. (The divider below it shows only when a body
  // follows, i.e. when open.)
  const header = (
    <header
      className={`relative flex flex-wrap items-start gap-4 p-2 sm:flex-nowrap sm:p-3 ${open ? "border-b border-black/[.08] bg-white/55" : ""
        }`}
    >
      {/* Destination cover — a bigger square (height = width); falls back to
          the gradient + route icon when the city has no cover. */}
      <div className={`${imageClass} aspect-square h-24 w-24`} aria-hidden>
        <FaRoute className="h-9 w-9 drop-shadow" />
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
      <div className={`min-w-0 flex-1 ${onDelete ? "pr-10 sm:pr-0" : ""}`}>
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {title}
        </span>
        <h3 className="mt-0.5 truncate text-lg font-semibold text-zinc-800">
          {cityArea}
        </h3>
        {!HIDE_ACTIVITY_PRICES && (
          <p className="text-sm text-zinc-500">Συνολική τιμή: €{totalPrice}</p>
        )}
        {party && !HIDE_TRAVELERS ? (
          <p className="text-sm text-zinc-500">Ταξιδιώτες: {travelersLabel(party)}</p>
        ) : null}
        {party && !HIDE_ACTIVITY_PRICES ? (
          <p className="mt-0.5 text-xs text-zinc-500">
            Ανά άτομο:{" "}
            {tripMemberLines(trip, party)
              .map(
                (l) =>
                  `${l.label}${l.count > 1 ? ` ×${l.count}` : ""}: €${l.perPerson}`
              )
              .join(" · ")}
          </p>
        ) : null}
        {/* Desktop only: delete + toggle sit under the cost (or, when the star
            rating shows, on the header's right via the block below). On mobile
            they're repositioned to the header's top-right / bottom-right corners
            (see the mobile-only blocks at the end of the header). */}
        <div className={`mt-2 hidden items-center gap-2 ${SHOW_ACTIVITY_STARS ? "" : "sm:flex"}`}>
          {headerButtons}
        </div>
      </div>
      {SHOW_ACTIVITY_STARS && (
        <div className="hidden w-auto items-center justify-end gap-2 sm:flex sm:items-center">
          {headerButtons}
        </div>
      )}
      {/* Desktop: the Save / PDF actions live on the header's right (only when the
          card is open). On mobile they render in the body instead (see below). */}
      {open && (
        <div className="hidden shrink-0 items-center gap-2 self-start sm:flex">
          {tripActions}
        </div>
      )}

      {/* Mobile only: delete in the top-right corner, the show/hide toggle in
          the bottom-right corner of the header. */}
      {onDelete ? (
        <div className="absolute right-2 top-2 sm:hidden">{deleteButton}</div>
      ) : null}
      <div className="absolute bottom-2 right-2 sm:hidden">{toggleButton}</div>
    </header>
  );

  // -- Closed (compact) — just the shared header. ----------------------------
  if (!open) {
    return <article className={cardClass}>{header}</article>;
  }

  // -- Open (expanded) -------------------------------------------------------
  return (
    <article className={cardClass}>
      {header}

      <div className="flex flex-col gap-3 p-3 sm:p-4">
        {/* Mobile only: the Save / PDF actions stay below the header. On desktop
            they're shown in the header instead (see above). */}
        <div className="flex justify-center gap-3 sm:hidden">
          {tripActions}
        </div>

        {/* The day-by-day program (timeline reused as-is). */}
        <div className="flex flex-col gap-3">
          {trip.days.map((td, slot) => (
            <div
              key={td.day}
              className="rounded-2xl border border-white/60 bg-white/70 px-3 py-0 sm:px-4"
            >
              {td.activities.length === 0 ? (
                <>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {DAYS_FULL[td.day]}
                  </h4>
                  <p className="mt-1 text-xs italic text-zinc-400">
                    Δεν έχουν τοποθετηθεί δραστηριότητες.
                  </p>
                  {onAdd ? (
                    <button
                      type="button"
                      onClick={() => onAdd({ start: 9, end: 21 }, td.day)}
                      className={`mb-2 mt-1 ${buttonStyles.common}`}
                    >
                      + Προσθήκη (09:00–21:00)
                    </button>
                  ) : null}
                </>
              ) : (
                <>
                  <DayItinerary
                    plan={td.plan}
                    day={td.day}
                    note={`βαθμός ${td.score.toFixed(2)} · ${td.load.toFixed(1)}ω · με μεσημεριανό`}
                    showSeeMore
                    showDetails
                    fullDayName
                    party={party}
                    onReplace={onReplace}
                    onRemove={onRemove}
                    onAdd={onAdd}
                    connectors
                  />
                  {dayMapStops(td.plan).length > 0 ? (
                    <div className="pb-3 pl-7">
                      <button
                        type="button"
                        onClick={() => setMapSlot(slot)}
                        className={buttonStyles.underline}
                      >
                        Δες τη διαδρομή στον χάρτη
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Indicative savings: city pass + magic combos (#10). Hidden entirely
            when prices are off. */}
        {!HIDE_ACTIVITY_PRICES && (cityPass || applicableCombos.length > 0) ? (
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4 dark:border-emerald-400/20 dark:bg-emerald-950/20">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Προτάσεις εξοικονόμησης
              </h4>
              <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-700/70 dark:text-emerald-300/70">
                ενδεικτικά
              </span>
            </div>

            {cityPass ? (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  Κάρτα πόλης: {cityPass.name}
                </span>{" "}
                — γλιτώνεις ~{cityPass.discountPercent}%.{" "}
                <span className="text-zinc-500 dark:text-zinc-400">{cityPass.description}</span>{" "}
                <a
                  href={cityPass.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={buttonStyles.underline}
                >
                  Δες την κάρτα
                </a>
              </p>
            ) : null}

            {applicableCombos.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1.5">
                {applicableCombos.map(({ combo, full, bundle, saving }) => (
                  <li key={combo.name} className="text-sm text-zinc-600 dark:text-zinc-300">
                    <span className="font-medium text-zinc-800 dark:text-zinc-100">
                      Magic combo «{combo.name}»
                    </span>
                    : {combo.activityNames.length} μαζί ~€{bundle} αντί €{full}{" "}
                    <span className="text-emerald-700 dark:text-emerald-400">(−€{saving})</span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {combo.description}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {/* "Why this trip?" — BELOW the days (not inline with them). Needs the
            live proof inputs, which saved trips don't carry. */}
        {showProof && selections && startHours && endHours && circulars && area && filters ? (
          <div>
            <button
              type="button"
              onClick={() => setProofOpen((v) => !v)}
              aria-expanded={proofOpen}
              className={toggleBtn}
            >
              {proofOpen ? "Απόκρυψη ανάλυσης" : "Γιατί αυτό το ταξίδι;"}
              {proofOpen ? (
                <FaChevronUp className="h-3 w-3" />
              ) : (
                <FaChevronDown className="h-3 w-3" />
              )}
            </button>
            {proofOpen ? (
              <TripDashboard
                trip={trip}
                selections={selections}
                filters={filters}
                startHours={startHours}
                endHours={endHours}
                circulars={circulars}
                area={area}
              />
            ) : null}
          </div>
        ) : null}

        {/* Not scheduled — a toggle at the bottom of the expanded card. */}
        {showLeftover && trip.leftover.length > 0 ? (
          <div className="border-t border-white/60 pt-3">
            <button
              type="button"
              onClick={() => setLeftoverOpen((v) => !v)}
              aria-expanded={leftoverOpen}
              className={toggleBtn}
            >
              {leftoverOpen
                ? `Απόκρυψη μη προγραμματισμένων (${trip.leftover.length})`
                : `Μη προγραμματισμένες (${trip.leftover.length})`}
              {leftoverOpen ? (
                <FaChevronUp className="h-3 w-3" />
              ) : (
                <FaChevronDown className="h-3 w-3" />
              )}
            </button>
            {leftoverOpen ? (
              <ul className="mt-2 flex flex-col gap-1">
                {trip.leftover.map(({ activity, reason }) => (
                  <li
                    key={activity.name}
                    className="flex items-baseline gap-2 text-xs text-zinc-500"
                  >
                    <span className="text-zinc-700">{activity.name}</span>
                    <span className="text-zinc-400">· {leftoverText(reason)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Per-day route map (Leaflet), opened by a day's "Δες τη διαδρομή στον
          χάρτη" button. */}
      {mapSlot !== null
        ? (() => {
            const td = trip.days[mapSlot];
            if (!td) return null;
            return (
              <DayMapModal
                title={`Διαδρομή — ${DAYS_FULL[td.day]}`}
                stops={dayMapStops(td.plan)}
                start={area ? { name: area.name, coords: area.coords } : undefined}
                circular={circulars?.[mapSlot] ?? false}
                onClose={() => setMapSlot(null)}
              />
            );
          })()
        : null}
    </article>
  );
}
