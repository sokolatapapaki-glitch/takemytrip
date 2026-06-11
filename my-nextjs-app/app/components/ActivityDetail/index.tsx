"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { FaBookmark, FaRegBookmark } from "react-icons/fa6";
import {
  adultPrice,
  dayHours,
  formatTime,
  isAllDay,
  isClosedDay,
  type Activity,
  type PriceTable,
} from "@/app/components/ActivityCombinations/core/activities.functions";
import { DAYS } from "@/app/components/ActivityCombinations/core/activities.data";
import { CITIES } from "@/app/components/ActivityCombinations/core/cities.data";
import { bestVibe, starsOf } from "@/app/map/components/mapData";
import { VIBE_GRADIENT, VIBE_ICONS } from "@/app/activities/components/vibeStyle";
import { ActivityCard } from "@/app/activities/components/ActivityCard";
import { Stars } from "@/app/components/ui/Stars";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
import { hoverScrollbar } from "@/app/components/ui/scrollbar";
import { ChevronLeftIcon, ChevronRightIcon } from "@/app/start/components/icons";

// How many thumbnail images the gallery shows (placeholders for now).
const THUMB_COUNT = 5;

// The activity detail modal, from the Penpot "Activity Modal Full" board:
// image placeholder + thumbnails on the left; name/stars/fav-bookmark, the
// "Important Info" table (rows with a small anchored "More" popover), a
// "See Description" jump link, the amber Notes bars and the Restaurants cards
// on the right; then a same-city Activities strip and the full description.
//
// Opened app-wide via useApp().openActivity(activity) — see AppContext.
// Navigation happens IN PLACE: clicking a related card switches the modal to
// that activity (pushing history) and "Previous Activity" pops back.

const fmtPrice = (n: number): string => (n === 0 ? "Free" : `€${n}`);

// Collapse the per-age price map (e.g. {"0":0,…,"17":21.5,"adult":21.5}) into
// readable rows: consecutive ages with the same price become one "4–17" range.
function ageRows(prices: PriceTable): { label: string; price: number }[] {
  const ages = Object.keys(prices.ages)
    .filter((k) => k !== "adult")
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  const rows: { from: number; to: number; price: number }[] = [];
  for (const age of ages) {
    const price = prices.ages[String(age)];
    const last = rows[rows.length - 1];
    if (last && last.price === price && age === last.to + 1) last.to = age;
    else rows.push({ from: age, to: age, price });
  }

  const out = rows.map((r) => ({
    label: r.from === r.to ? `Age ${r.from}` : `Ages ${r.from}–${r.to}`,
    price: r.price,
  }));
  if (typeof prices.ages.adult === "number") {
    out.push({ label: "Adults", price: prices.ages.adult });
  }
  return out;
}

// "2_adults_2_children" → "2 adults 2 children" for the family-bundle rows.
const familyLabel = (key: string): string => key.replaceAll("_", " ");

// The small "More" popover: anchored under its button (not centered, no
// overlay), in front of the modal. Closes on outside click.
function MorePopover({
  open,
  onToggle,
  onClose,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button type="button" onClick={onToggle} className={buttonStyles.common}>
        More
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-2xl shadow-orange-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/95">
          {children}
        </div>
      )}
    </div>
  );
}

// One "Important Info" row: label | value | optional More button.
function InfoRow({
  label,
  children,
  more,
}: {
  label: string;
  children: ReactNode;
  more?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-200/80 py-2 dark:border-white/10">
      <span className="w-28 shrink-0 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-500 dark:text-zinc-400">
        {children}
      </span>
      {more}
    </div>
  );
}

export function ActivityDetail({
  activity,
  onClose,
}: {
  activity: Activity;
  // Closes the surrounding modal (passed in by AppContext) — used by "See all",
  // which navigates to the activities page.
  onClose?: () => void;
}) {
  // In-place navigation history; the last entry is the activity on display.
  const [stack, setStack] = useState<Activity[]>([activity]);
  const current = stack[stack.length - 1];
  const [moreOpen, setMoreOpen] = useState<"price" | "hours" | "websites" | null>(null);
  // Bookmark is a visual placeholder for now (no persistence).
  const [saved, setSaved] = useState(false);
  // Which gallery image is selected (drives the hover arrows + thumbnail highlight).
  const [activeImage, setActiveImage] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const vibe = bestVibe(current);
  const VibeIcon = VIBE_ICONS[vibe.key];
  const stars = starsOf(current);
  // The city this activity belongs to (names are unique across catalogues) —
  // drives the related-activities strip and the "See all" link.
  const city = CITIES.find((c) => c.activities.some((a) => a.name === current.name));
  const related = city
    ? city.activities
        .filter((a) => a.name !== current.name)
        .sort((a, b) => starsOf(b) - starsOf(a))
        .slice(0, 8)
    : [];
  const today = (new Date().getDay() + 6) % 7; // JS Sunday-first → program's Mon-first
  const todayHours = dayHours(current, today);

  const push = (a: Activity) => {
    setStack((s) => [...s, a]);
    setMoreOpen(null);
    setSaved(false);
  };
  const pop = () => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    setMoreOpen(null);
    setSaved(false);
  };
  const toggleMore = (key: "price" | "hours" | "websites") =>
    setMoreOpen((m) => (m === key ? null : key));

  // Jump back to the top when navigating between activities in place, and reset
  // the gallery to its first image.
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "nearest" });
    setActiveImage(0);
  }, [current]);

  return (
    <div ref={topRef} className="flex flex-col gap-6">
      {stack.length > 1 && (
        <button type="button" onClick={pop} className={`self-start ${buttonStyles.underline}`}>
          ← Previous Activity
        </button>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Image placeholder (vibe gradient, like the cards) + thumbnail row. */}
        <div className="flex flex-col gap-3">
          <div
            className={`group relative flex h-56 w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${VIBE_GRADIENT[vibe.key]} md:h-72`}
          >
            <VibeIcon className="h-16 w-16 text-white drop-shadow" />

            {/* Hover-only, low-opacity prev/next arrows that cycle the gallery. */}
            <button
              type="button"
              onClick={() => setActiveImage((i) => (i - 1 + THUMB_COUNT) % THUMB_COUNT)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-200 hover:bg-black/60 group-hover:opacity-60"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveImage((i) => (i + 1) % THUMB_COUNT)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-200 hover:bg-black/60 group-hover:opacity-60"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex justify-center gap-2">
            {Array.from({ length: THUMB_COUNT }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`Image ${i + 1}`}
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${VIBE_GRADIENT[vibe.key]} transition ${i === activeImage
                  ? "opacity-100 ring-2 ring-orange-400 ring-offset-2 dark:ring-offset-zinc-900"
                  : "opacity-60 hover:opacity-80"
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Right column is capped to the left column's height (image md:h-72 +
            gap-3 + thumbnails h-12 = 21.75rem) and scrolls internally, so the
            Related Activities strip below the grid sits just under the image
            instead of far down. Only at md+, where the columns sit side by side. */}
        <div className={`flex min-w-0 flex-col gap-5 md:max-h-[21.75rem] md:overflow-y-auto md:pr-1 ${hoverScrollbar}`}>
          {/* Header: name, stars, bookmark. pr-8 clears the modal's × button. */}
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
                {current.name}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Stars value={stars} />
                <span>{stars.toFixed(1)}/5</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSaved((s) => !s)}
              aria-label={saved ? "Remove from favourites" : "Add to favourites"}
              className="mt-1 shrink-0 text-xl text-orange-500 transition-transform hover:scale-110"
            >
              {saved ? <FaBookmark /> : <FaRegBookmark />}
            </button>
          </div>

          {/* Important Info table. */}
          <div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
              Important Info
            </h3>
            <div className="mt-1">
              <InfoRow
                label="Price"
                more={
                  current.prices && (
                    <MorePopover
                      open={moreOpen === "price"}
                      onToggle={() => toggleMore("price")}
                      onClose={() => setMoreOpen(null)}
                    >
                      <div className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-200">
                        {ageRows(current.prices).map((r) => (
                          <div key={r.label} className="flex justify-between gap-3">
                            <span>{r.label}</span>
                            <span className="font-medium">{fmtPrice(r.price)}</span>
                          </div>
                        ))}
                        {Object.entries(current.prices.family).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-3">
                            <span>{familyLabel(k)}</span>
                            <span className="font-medium">{fmtPrice(v)}</span>
                          </div>
                        ))}
                      </div>
                    </MorePopover>
                  )
                }
              >
                {fmtPrice(adultPrice(current))}
              </InfoRow>

              <InfoRow
                label="Hours"
                more={
                  <MorePopover
                    open={moreOpen === "hours"}
                    onToggle={() => toggleMore("hours")}
                    onClose={() => setMoreOpen(null)}
                  >
                    <div className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-200">
                      {DAYS.map((d, i) => {
                        const h = dayHours(current, i);
                        return (
                          <div key={d} className="flex justify-between gap-3">
                            <span className={i === today ? "font-semibold" : undefined}>{d}</span>
                            <span>
                              {isClosedDay(h)
                                ? "Closed"
                                : isAllDay(h)
                                  ? "Open all day"
                                  : `${formatTime(h.open)}–${formatTime(h.close)}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </MorePopover>
                }
              >
                {isClosedDay(todayHours)
                  ? "Closed today"
                  : isAllDay(todayHours)
                    ? "Open all day"
                    : `Today ${formatTime(todayHours.open)}–${formatTime(todayHours.close)}`}
              </InfoRow>

              <InfoRow label="Time needed">~{current.hours}h</InfoRow>

              {current.googleMapUrl && (
                <InfoRow label="Google Maps">
                  <a
                    href={current.googleMapUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-orange-600 hover:underline"
                  >
                    Open in Maps
                  </a>
                </InfoRow>
              )}

              {current.websites.length > 0 && (
                <InfoRow
                  label="Websites"
                  more={
                    current.websites.length > 1 && (
                      <MorePopover
                        open={moreOpen === "websites"}
                        onToggle={() => toggleMore("websites")}
                        onClose={() => setMoreOpen(null)}
                      >
                        <div className="flex flex-col gap-1 text-sm">
                          {current.websites.map((w) => (
                            <a
                              key={w.url}
                              href={w.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="truncate text-orange-600 hover:underline"
                            >
                              {w.name}
                            </a>
                          ))}
                        </div>
                      </MorePopover>
                    )
                  }
                >
                  <a
                    href={current.websites[0].url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-orange-600 hover:underline"
                  >
                    {current.websites[0].name}
                  </a>
                </InfoRow>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                descriptionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className={`mt-3 ${buttonStyles.underline}`}
            >
              See Description
            </button>
          </div>

          {/* Nearby restaurants/cafés tied to this activity. */}
          {current.restaurants.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
                Restaurants
              </h3>
              <div className="mt-2 flex flex-col gap-3">
                {current.restaurants.map((r) => (
                  <div
                    key={r.name}
                    className="rounded-2xl bg-white p-3 shadow-sm shadow-zinc-900/5 transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {r.name}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                        {r.type}
                      </span>
                      {r.link && (
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={`ml-auto shrink-0 ${buttonStyles.underline}`}
                        >
                          Link
                        </a>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                      {r.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes — one amber bar per note, below the restaurants. */}
          {current.notes.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Notes</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {current.notes.map((n) => (
                  <li
                    key={n}
                    className="rounded-xl border border-l-4 border-amber-300 border-l-amber-400 bg-amber-100 px-5 py-3.5 text-sm text-amber-900 shadow-sm shadow-amber-900/10 transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md dark:border-amber-400/30 dark:border-l-amber-400 dark:bg-amber-400/10 dark:text-amber-100"
                  >
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Same-city activities strip — clicking a card's "See more" switches the
          modal to that activity in place (history via the stack above). */}
      {related.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              Related Activities
            </h3>
            {city && (
              <Link
                href={`/activities?city=${city.id}`}
                onClick={onClose}
                className={buttonStyles.underline}
              >
                See all
              </Link>
            )}
          </div>
          <div className={`mt-3 flex gap-4 overflow-x-auto py-3 ${hoverScrollbar}`}>
            {related.map((a, i) => (
              <div key={a.name} className="w-64 shrink-0">
                <ActivityCard activity={a} index={i} hideSelect onSeeMore={push} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full description (the "See Description" link scrolls here). */}
      <div ref={descriptionRef}>
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Description</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {current.description}
        </p>
      </div>
    </div>
  );
}
