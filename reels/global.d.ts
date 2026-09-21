// The cursor overlay's page-side API (injected by CURSOR_INIT_SCRIPT), declared
// once so every page.evaluate in the capture pass is plainly typed.
declare global {
  interface Window {
    __reel: {
      /** Place the cursor for this frame. `press` and `pulse` are 0–1; pulse < 0 = none. */
      cursor(x: number, y: number, press: number, pulse: number): void;
      /** Advance every running CSS animation by `dt` ms. */
      step(dt: number): void;
      /** Centre of the first VISIBLE match, in CSS pixels, or null. */
      centre(selector: string): { x: number; y: number } | null;
      /** The first VISIBLE match, or null. */
      visible(selector: string): HTMLElement | null;
      /** The element's own scroll container, or null when the window scrolls it. */
      scroller(selector: string): HTMLElement | null;
      /** Current scroll offset of whatever scrolls the target. */
      scrollTop(selector: string): number;
      /** Scroll whatever scrolls the target to `top`. */
      scrollTo(selector: string, top: number): void;
    };
    /** The overlay page's per-frame renderer (PASS B). */
    __reelOverlay?: {
      render(state: {
        title: string;
        items: string[];
        index: number;
        progress: number;
      }): void;
      /** Loads the bundled Greek font; false if it is missing or cannot draw Greek. */
      ensureFont(): Promise<boolean>;
    };
  }
}

export {};
