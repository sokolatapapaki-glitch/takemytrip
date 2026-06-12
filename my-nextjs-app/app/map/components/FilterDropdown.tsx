"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { FaChevronRight } from "react-icons/fa6";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
// A single filter "chip" (Price / Vibe / Sorted by / Distance) that opens a glass
// popup with its options. Controlled by the parent so only one is open at a time.
// The chips live in a horizontally-scrolling row (which clips overflow), so the
// popup is positioned `fixed` from the chip's rect to escape that clip — while
// staying inside the DOM subtree so the parent's click-outside logic still works.
export function FilterDropdown({
  label,
  summary,
  active,
  open,
  onToggle,
  children,
}: {
  label: string;
  summary?: string | null; // short selected-value hint shown on the chip
  active: boolean; // a non-default value is set
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const popupWidth = 224;

  // Anchor the popup to the chip's on-screen position whenever it opens (and on
  // resize), so the scrolling row can't clip it.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const left =
        r.left + popupWidth > window.innerWidth - 16
          ? Math.max(16, r.right - popupWidth)
          : r.left;
      setCoords({ top: r.bottom + 8, left });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={onToggle}
        className={buttonStyles.common + ` flex items-center gap-2 ${open ? "bg-zinc-50" : ""}`}
      >
        <span>{summary ? `${label}: ${summary}` : label}</span>
        <FaChevronRight
          className={`h-4 w-4 text-current transition-transform ${open ? "rotate-90" : "rotate-0 opacity-50"}`}
        />
      </button>
      {open && coords && (
        <div
          style={{ position: "fixed", top: coords.top, left: coords.left, width: popupWidth }}
          className="animate-pop-in z-[1100] origin-top rounded-2xl border border-white/60 bg-white/95 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur-xl"
        >
          {children}
        </div>
      )}
    </div>
  );
}
