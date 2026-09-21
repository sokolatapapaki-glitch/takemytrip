// -----------------------------------------------------------------------------
// PASS A helper — the synthetic cursor
// -----------------------------------------------------------------------------
// Screenshots never contain the real pointer, so the reel draws its own. The
// overlay is injected with addInitScript (so it survives every navigation) and
// is driven ONE FRAME AT A TIME by the capture loop — never by wall clock and
// never by a CSS animation, so two runs of the same reel are identical.

/** Ease-in-out, the curve a hand actually moves on. */
export const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/**
 * Position along a cursor move from `a` to `b` at progress `t`.
 *
 * The path bows sideways instead of running straight: a perfectly straight
 * cursor track reads as robotic on video. The bow is perpendicular to the
 * travel direction and scales with distance, so short hops stay almost
 * straight and long sweeps arc.
 */
export function arcPoint(
  a: { x: number; y: number },
  b: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const e = easeInOut(clamp01(t));
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return { x: b.x, y: b.y };
  // Perpendicular unit vector, offset by a half-sine so the bow starts and ends
  // exactly on the straight line.
  const nx = -dy / dist;
  const ny = dx / dist;
  const bow = Math.min(dist * 0.12, 60) * Math.sin(Math.PI * e);
  return { x: a.x + dx * e + nx * bow, y: a.y + dy * e + ny * bow };
}

/**
 * The init script. Defines `window.__reel` in the page:
 *   __reel.cursor(x, y, press, pulse)  — place the cursor for THIS frame
 *   __reel.step(dtMs)                  — advance every running CSS animation
 *
 * `press` (0–1) squashes the arrow; `pulse` (0–1, or <0 for "no pulse") drives
 * the expanding ring. Both are computed by the capture loop, so the click tell
 * is frame-exact rather than a CSS transition racing the screenshot.
 */
export const CURSOR_INIT_SCRIPT = `
(() => {
  if (window.__reel) return;

  const SIZE = 26;
  let root = null, arrow = null, ring = null;

  function mount() {
    if (root && root.isConnected) return;
    root = document.createElement("div");
    root.id = "__reel_cursor";
    root.setAttribute("aria-hidden", "true");
    root.style.cssText = [
      "position:fixed", "left:0", "top:0", "width:0", "height:0",
      "pointer-events:none", "z-index:2147483647", "will-change:transform",
    ].join(";");

    ring = document.createElement("div");
    ring.style.cssText = [
      "position:absolute", "left:0", "top:0", "width:" + SIZE * 2 + "px",
      "height:" + SIZE * 2 + "px", "margin-left:" + -SIZE + "px",
      "margin-top:" + -SIZE + "px", "border-radius:50%",
      "border:3px solid rgba(249,115,22,0.95)", "opacity:0",
      "transform:scale(0)", "pointer-events:none",
    ].join(";");

    arrow = document.createElement("div");
    arrow.style.cssText = [
      "position:absolute", "left:0", "top:0", "width:" + SIZE + "px",
      "height:" + SIZE + "px", "transform-origin:2px 2px",
      "filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))", "pointer-events:none",
    ].join(";");
    arrow.innerHTML =
      '<svg viewBox="0 0 24 24" width="' + SIZE + '" height="' + SIZE + '">' +
      '<path d="M4 2 L4 19.5 L8.6 15.2 L11.6 21.8 L14.9 20.3 L11.9 13.9 L18.2 13.6 Z" ' +
      'fill="#ffffff" stroke="#111827" stroke-width="1.4" stroke-linejoin="round"/></svg>';

    root.appendChild(ring);
    root.appendChild(arrow);
    (document.body || document.documentElement).appendChild(root);
  }

  // Every CSS animation/transition the capture loop has already seen, so a
  // freshly started one begins at 0 instead of jumping to the global time.
  const seen = new WeakSet();

  window.__reel = {
    cursor(x, y, press, pulse) {
      mount();
      root.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      arrow.style.transform = "scale(" + (1 - 0.18 * press) + ")";
      if (pulse >= 0 && pulse <= 1) {
        ring.style.opacity = String(1 - pulse);
        ring.style.transform = "scale(" + (0.15 + pulse * 0.95) + ")";
      } else {
        ring.style.opacity = "0";
        ring.style.transform = "scale(0)";
      }
    },

    // Advance every running animation by exactly one frame. Pausing first takes
    // them off wall-clock time, which is what makes a screenshot loop sample
    // entrance pops and dropdown transitions evenly.
    step(dt) {
      let list = [];
      try { list = document.getAnimations(); } catch { return; }
      for (const a of list) {
        try {
          if (!seen.has(a)) { seen.add(a); a.pause(); a.currentTime = 0; continue; }
          a.pause();
          a.currentTime = Number(a.currentTime || 0) + dt;
        } catch {
          // Some animations (e.g. already-finished ones) refuse a seek; the
          // frame is still correct without them.
        }
      }
    },

    // Centre of a selector, in CSS pixels — used by the camera to follow an
    // element. Only ever reads the VISIBLE match: the plan page renders the
    // filter sidebar twice (desktop column + mobile drawer).
    centre(sel) {
      const el = window.__reel.visible(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },

    // Whichever thing actually scrolls the target: its own overflow container
    // (the filter drawer) or the window.
    scroller(sel) {
      const el = window.__reel.visible(sel);
      const sc = el && el.closest(".overflow-y-auto");
      return sc && sc.scrollHeight > sc.clientHeight + 1 ? sc : null;
    },

    scrollTop(sel) {
      const sc = window.__reel.scroller(sel);
      return sc ? sc.scrollTop : window.scrollY;
    },

    scrollTo(sel, top) {
      const sc = window.__reel.scroller(sel);
      if (sc) sc.scrollTop = top;
      else window.scrollTo(0, top);
    },

    visible(sel) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && el.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) !== false) {
          return el;
        }
      }
      return null;
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
`;
