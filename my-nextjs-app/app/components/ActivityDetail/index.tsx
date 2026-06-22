"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight, FaXmark } from "react-icons/fa6";
import {
  adultPrice,
  ageBandRows,
  dayHours,
  formatTime,
  isAllDay,
  isClosedDay,
  type Activity,
} from "@/app/components/ActivityCombinations/core/activities.functions";
import { DAYS } from "@/app/components/ActivityCombinations/core/activities.data";
import { CITIES } from "@/app/components/ActivityCombinations/core/cities.data";
import { bestVibe, starsOf } from "@/app/map/components/mapData";
import { VIBE_GRADIENT, VIBE_ICONS } from "@/app/activities/components/vibeStyle";
import { ActivityCard } from "@/app/activities/components/ActivityCard";
import { activityImages } from "@/app/activities/components/activityImages";
import { Stars } from "@/app/components/ui/Stars";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
import { hoverScrollbar } from "@/app/components/ui/scrollbar";
import { SINGLE_ACTIVITY_IMAGE, SHOW_ACTIVITY_STARS, HIDE_ACTIVITY_PRICES } from "@/app/config";

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

const fmtPrice = (n: number): string => (n === 0 ? "Δωρεάν" : `€${n}`);

// The per-age price rows (e.g. "Ηλικίες 4–17 · €13", "Ενήλικες · €21.5") now come
// from the shared `ageBandRows` helper so the modal, cards and trip program agree.

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
        Περισσότερα
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
  // Which gallery image is selected (drives the hover arrows + thumbnail highlight).
  const [activeImage, setActiveImage] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const vibe = bestVibe(current);
  const VibeIcon = VIBE_ICONS[vibe.key];
  const stars = starsOf(current);
  // The activity's photo gallery (empty → gradient fallback in the UI). When the
  // SINGLE_ACTIVITY_IMAGE flag is on, keep only the first image (and the
  // thumbnail tabs are hidden below).
  const allImages = activityImages(current);
  const images = SINGLE_ACTIVITY_IMAGE ? allImages.slice(0, 1) : allImages;
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
  };
  const pop = () => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    setMoreOpen(null);
  };
  const toggleMore = (key: "price" | "hours" | "websites") =>
    setMoreOpen((m) => (m === key ? null : key));

  // Pin the modal's scroll container to the very top on open AND whenever we
  // navigate to another activity in place; reset the gallery to its first image.
  // useLayoutEffect runs before paint, so there's no visible "already scrolled"
  // flash. scrolling the container to 0 (not scrollIntoView) lands exactly at
  // the top, keeping the panel's top padding visible.
  useLayoutEffect(() => {
    topRef.current?.closest("[data-modal-scroll]")?.scrollTo({ top: 0 });
    setActiveImage(0);
  }, [current]);

  return (
    <div ref={topRef} className="flex flex-col gap-6">
      {/* Header bar above all content: the "Previous Activity" back button on the
          left (when there's history) and the close × on the right, at the same
          height. */}
      <div className="flex items-center justify-between gap-3">
        {stack.length > 1 ? (
          <button
            type="button"
            onClick={pop}
            className={`inline-flex items-center gap-1 ${buttonStyles.underline}`}
          >
            <FaChevronLeft className="h-3 w-3" /> Προηγούμενη δραστηριότητα
          </button>
        ) : (
          <span />
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Κλείσιμο"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/[.06] hover:text-zinc-800 dark:hover:bg-white/[.08] dark:hover:text-zinc-100"
          >
            <FaXmark className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* Image placeholder (vibe gradient, like the cards) + thumbnail row. */}
        <div className="flex flex-col gap-3">
          <div
            className={`group relative flex h-56 w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${VIBE_GRADIENT[vibe.key]} md:h-72`}
          >
            <VibeIcon className="h-16 w-16 text-white drop-shadow" />

            {/* Real photo over the gradient when available; a load failure hides
                it (gradient + icon show through). key forces a fresh element per
                src so a previous failure's display:none can't carry over. */}
            {images[activeImage] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={images[activeImage]}
                src={images[activeImage]}
                alt={current.name}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            {/* Hover-only, low-opacity prev/next arrows — only when there's more
                than one image to cycle through. */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImage((i) => (i - 1 + images.length) % images.length)
                  }
                  aria-label="Προηγούμενη εικόνα"
                  className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-200 hover:bg-black/60 group-hover:opacity-60"
                >
                  <FaChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                  aria-label="Επόμενη εικόνα"
                  className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-200 hover:bg-black/60 group-hover:opacity-60"
                >
                  <FaChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {!SINGLE_ACTIVITY_IMAGE && (
          <div className="flex justify-center gap-2">
            {(images.length > 0
              ? images
              : (Array.from({ length: THUMB_COUNT }) as undefined[])
            ).map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`Εικόνα ${i + 1}`}
                className={`relative h-12 w-12 overflow-hidden rounded-xl bg-gradient-to-br ${VIBE_GRADIENT[vibe.key]} transition ${i === activeImage
                  ? "opacity-100 ring-2 ring-orange-400 ring-offset-2 dark:ring-offset-zinc-900"
                  : "opacity-60 hover:opacity-80"
                  }`}
              >
                {src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
          )}
        </div>

        {/* Right column is capped to the left column's height (image md:h-72 +
            gap-3 + thumbnails h-12 = 21.75rem) and scrolls internally, so the
            Related Activities strip below the grid sits just under the image
            instead of far down. Only at md+, where the columns sit side by side. */}
        <div className={`flex min-w-0 flex-col gap-5 md:max-h-[21.75rem] md:overflow-y-auto md:pr-1 ${hoverScrollbar}`}>
          {/* Header: name + stars. */}
          <div>
            <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
              {current.name}
            </h2>
            {SHOW_ACTIVITY_STARS && (
              <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Stars value={stars} />
                <span>{stars.toFixed(1)}/5</span>
              </div>
            )}
          </div>

          {/* Important Info table. */}
          <div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
              Σημαντικές πληροφορίες
            </h3>
            <div className="mt-1">
              <InfoRow label="Ατμόσφαιρα">
                <span className="inline-flex items-center gap-1.5">
                  <VibeIcon className="h-4 w-4" />
                  {vibe.label}
                </span>
              </InfoRow>

              {!HIDE_ACTIVITY_PRICES && (
              <InfoRow
                label="Τιμή"
                more={
                  current.prices && (
                    <MorePopover
                      open={moreOpen === "price"}
                      onToggle={() => toggleMore("price")}
                      onClose={() => setMoreOpen(null)}
                    >
                      <div className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-200">
                        {ageBandRows(current.prices).map((r) => (
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
              )}

              <InfoRow
                label="Ωράριο"
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
                                ? "Κλειστό"
                                : isAllDay(h)
                                  ? "Ανοιχτό όλη μέρα"
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
                  ? "Κλειστό σήμερα"
                  : isAllDay(todayHours)
                    ? "Ανοιχτό όλη μέρα"
                    : `Σήμερα ${formatTime(todayHours.open)}–${formatTime(todayHours.close)}`}
              </InfoRow>

              <InfoRow label="Διάρκεια">~{current.hours}h</InfoRow>

              {current.googleMapUrl && (
                <InfoRow label="Google Maps">
                  <a
                    href={current.googleMapUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-orange-600 hover:underline"
                  >
                    Άνοιγμα στους χάρτες
                  </a>
                </InfoRow>
              )}

              {current.websites.length > 0 && (
                <InfoRow
                  label="Ιστότοποι"
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
              Δες την περιγραφή
            </button>
          </div>

          {/* Notes — one amber bar per note. */}
          {current.notes.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Σημειώσεις</h3>
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

      {/* Nearby restaurants/cafés tied to this activity. Kept OUTSIDE the
          scrollable right column (its own full-width block, like Description)
          so they're always visible instead of clipped below the column's
          internal scroll. */}
      {current.restaurants.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
            Εστιατόρια
          </h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
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
                      Σύνδεσμος
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

      {/* Same-city activities strip — clicking a card's "See more" switches the
          modal to that activity in place (history via the stack above). */}
      {related.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              Σχετικές δραστηριότητες
            </h3>
            {city && (
              <Link
                href={`/activities?city=${city.id}`}
                onClick={onClose}
                className={buttonStyles.underline}
              >
                Δες τα όλα
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
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">Περιγραφή</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {current.description}
        </p>
      </div>
    </div>
  );
}
