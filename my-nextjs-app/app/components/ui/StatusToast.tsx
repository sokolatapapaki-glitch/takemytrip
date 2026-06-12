"use client";

import { useEffect, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import {
  FaCircleCheck,
  FaCircleInfo,
  FaTriangleExclamation,
  FaXmark,
} from "react-icons/fa6";

// A small, reusable status toast: a relevant emoji on the left, a title and a
// message. It slides in from the right (top-right on desktop, top-centered on
// mobile), stays for 3s, then slides back out — no backdrop, the rest of the
// page stays interactive. Driven by props; render it only while shown and clear
// your state in `onClose`. Give it a fresh `key` per message so re-triggering
// restarts the timer/animation.
//
//   {notice && (
//     <StatusToast key={notice.id} state={notice.state} message={notice.message}
//       onClose={() => setNotice(null)} />
//   )}
//
// Portaled to <body> so an ancestor transform can't trap its `fixed` position.

export type StatusState = "info" | "success" | "error";

const CONFIG: Record<
  StatusState,
  { Icon: ComponentType<{ className?: string }>; title: string; badge: string }
> = {
  info: {
    Icon: FaCircleInfo,
    title: "Καλό να το ξέρεις",
    badge: "bg-sky-50 text-sky-600 ring-sky-200",
  },
  success: {
    Icon: FaCircleCheck,
    title: "Όλα έτοιμα",
    badge: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  },
  error: {
    Icon: FaTriangleExclamation,
    title: "Ωχ!",
    badge: "bg-orange-50 text-orange-600 ring-orange-200",
  },
};

const AUTO_DISMISS_MS = 3000;
const EXIT_MS = 300; // keep in sync with the slide-out animation duration

export function StatusToast({
  state,
  message,
  title,
  onClose,
}: {
  state: StatusState;
  message: string;
  // Optional override of the per-state default heading.
  title?: string;
  onClose: () => void;
}) {
  const [leaving, setLeaving] = useState(false);

  // Auto-dismiss after a few seconds.
  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, []);

  // Once the exit animation has played, unmount.
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(onClose, EXIT_MS);
    return () => clearTimeout(t);
  }, [leaving, onClose]);

  // Escape dismisses.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLeaving(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (typeof document === "undefined") return null;

  const cfg = CONFIG[state];
  const Icon = cfg.Icon;
  // Enter: slide down (mobile) / in from the right (desktop). Leave: reverse.
  const anim = leaving
    ? "animate-toast-out-up sm:animate-toast-out-right"
    : "animate-slide-down sm:animate-slide-in-right";

  return createPortal(
    // Outer layer is click-through (no backdrop); only the card catches clicks.
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4 sm:inset-x-auto sm:right-4 sm:justify-end sm:px-0">
      <div
        role="alert"
        className={`pointer-events-auto ${anim} flex w-full max-w-sm items-start gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-zinc-900`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${cfg.badge}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {title ?? cfg.title}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLeaving(true)}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-black/[.05] hover:text-zinc-700 dark:hover:bg-white/[.08] dark:hover:text-zinc-100"
        >
          <FaXmark className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}
