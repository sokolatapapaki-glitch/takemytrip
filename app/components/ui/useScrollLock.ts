import { useEffect } from "react";

// Lock the page scroll while `active` is true (e.g. a drawer/modal is open) so
// only the overlay itself scrolls. Targets the ROOT element (<html>), which is
// the actual scrolling element here — `html { height: 100% }` plus the
// overflow-x clip make the document, not <body>, the scroll container, so a
// `body { overflow: hidden }` lock would leave the page scrollable behind the
// overlay (most visible on mobile).
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [active]);
}
