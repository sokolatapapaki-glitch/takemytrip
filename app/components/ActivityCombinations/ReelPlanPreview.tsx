"use client";

// Reel-only clean preview of the whole trip — the "here is your plan" beat at
// the end of a social reel (see reels/README.md §The ending).
//
// Renders NOTHING until the reel generator dispatches a `reel:preview` event on
// window. No user action fires it, so for real users this component is inert:
// no UI, no route, no styling on the normal page. When it does fire, a white
// full-screen layer covers everything (navbar included) and shows only the
// plan — no filters, buttons, map or prices.
//
// Fit: one column when the plan is short enough; otherwise two columns, split
// between WHOLE days (never inside one), days 1..k left and k+1..n right with k
// chosen to balance the column heights. If the taller column still overflows,
// the layer scales down to fit.

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { DAYS_FULL } from "./core/activities.data";
import { formatTime } from "./core/activities.functions";
import type { Trip } from "./core/trip.functions";

/** Below this the text is unreadable on a phone-sized video — fail loudly. */
const MIN_SCALE = 0.7;

type Layout = { split: number | null; scale: number };

export function ReelPlanPreview({
  trip,
  cityName,
  dateLabel,
  dates,
}: {
  trip: Trip;
  cityName?: string;
  dateLabel: string;
  dates: Date[];
}) {
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<Layout | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const halfRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const onPreview = () => setOpen(true);
    window.addEventListener("reel:preview", onPreview);
    return () => window.removeEventListener("reel:preview", onPreview);
  }, []);

  // Measure once the hidden measurers are in the DOM, then pick the layout —
  // synchronously, so the first painted frame is already the final one.
  useLayoutEffect(() => {
    if (!open || layout) return;
    const root = rootRef.current;
    const head = headRef.current;
    const full = fullRef.current;
    const half = halfRef.current;
    if (!root || !head || !full || !half) return;

    const style = getComputedStyle(root);
    const avail =
      root.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) -
      head.offsetHeight;
    const gap = 12; // matches gap-3 between day blocks
    const heights = (el: HTMLElement) =>
      Array.from(el.children).map((c) => (c as HTMLElement).offsetHeight);
    const stack = (hs: number[]) =>
      hs.reduce((s, h) => s + h, 0) + gap * Math.max(0, hs.length - 1);

    const fullH = stack(heights(full));
    if (fullH <= avail || trip.days.length < 2) {
      setLayout({ split: null, scale: Math.min(1, avail / fullH) });
      return;
    }

    const hs = heights(half);
    let best = 1;
    let bestH = Infinity;
    for (let k = 1; k < hs.length; k++) {
      const h = Math.max(stack(hs.slice(0, k)), stack(hs.slice(k)));
      if (h < bestH) {
        bestH = h;
        best = k;
      }
    }
    const scale = Math.min(1, avail / bestH);
    if (scale < MIN_SCALE) {
      console.error(
        `reel: the plan preview needs scale ${scale.toFixed(2)} to fit — below ${MIN_SCALE}.`
      );
    }
    setLayout({ split: best, scale });
  }, [open, layout, trip.days.length]);

  if (!open) return null;

  const days = trip.days.map((td, i) => (
    <DayBlock
      key={i}
      index={i}
      weekday={td.day}
      date={dates[i]}
      items={td.plan.items}
    />
  ));

  // Portalled to <body>: inside the plan page it would sit in a parent stacking
  // context, under the sticky navbar, whatever its z-index.
  return createPortal(
    <div
      ref={rootRef}
      data-reel="plan-preview"
      className="fixed inset-0 z-[100] overflow-hidden bg-white px-4 pb-6 pt-10 text-zinc-900"
    >
      <div
        className="origin-top"
        style={{ transform: layout && layout.scale < 1 ? `scale(${layout.scale})` : undefined }}
      >
        <div ref={headRef} className="pb-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-green-500">
            Το ταξίδι σου
          </p>
          {cityName ? (
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{cityName}</h1>
          ) : null}
          <p className="mt-0.5 text-sm text-zinc-500">
            {trip.days.length} {trip.days.length === 1 ? "ημέρα" : "ημέρες"} · {dateLabel}
          </p>
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-orange-500" />
        </div>

        {layout ? (
          layout.split === null ? (
            <div className="flex flex-col gap-3">{days}</div>
          ) : (
            <div className="grid grid-cols-2 items-start gap-3">
              <div className="flex flex-col gap-3">{days.slice(0, layout.split)}</div>
              <div className="flex flex-col gap-3">{days.slice(layout.split)}</div>
            </div>
          )
        ) : (
          // Measuring pass: the days at full width and at column width,
          // invisible, so the layout can be chosen from real heights.
          <Measurers fullRef={fullRef} halfRef={halfRef}>
            {days}
          </Measurers>
        )}
      </div>
    </div>,
    document.body
  );
}

function Measurers({
  fullRef,
  halfRef,
  children,
}: {
  fullRef: RefObject<HTMLDivElement | null>;
  halfRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  return (
    <div aria-hidden className="invisible relative">
      <div ref={fullRef} className="absolute inset-x-0 top-0">
        {children}
      </div>
      <div className="absolute inset-x-0 top-0 grid grid-cols-2 gap-3">
        <div ref={halfRef}>{children}</div>
      </div>
    </div>
  );
}

function DayBlock({
  index,
  weekday,
  date,
  items,
}: {
  index: number;
  weekday: number;
  date?: Date;
  items: Trip["days"][number]["plan"]["items"];
}) {
  const dateText = date?.toLocaleDateString("el-GR", { day: "numeric", month: "short" });
  return (
    <section className="rounded-xl border border-green-500/25 bg-white p-3 shadow-sm">
      <header className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
          {index + 1}
        </span>
        <h2 className="min-w-0 text-sm font-bold text-green-500">
          {DAYS_FULL[weekday]}
          {dateText ? <span className="font-medium text-zinc-400"> · {dateText}</span> : null}
        </h2>
      </header>
      {items.length === 0 ? (
        <p className="text-xs text-zinc-400">Ελεύθερη μέρα</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li
              key={i}
              className={`flex gap-2 text-xs leading-snug ${item.lunch ? "italic text-zinc-400" : ""}`}
            >
              <span className="shrink-0 font-semibold tabular-nums text-green-500">
                {formatTime(item.start)}
              </span>
              <span className="min-w-0">{item.name}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
