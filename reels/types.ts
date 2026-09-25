// -----------------------------------------------------------------------------
// Reel DSL — the types a reel file is written against
// -----------------------------------------------------------------------------
// A reel is a plain TypeScript file exporting a `Reel`. Everything the renderer
// needs — what to click, what the captions say, where the camera goes — lives in
// that one object, so a reel is diff-able, type-checked and re-renderable.
//
// See reels/README.md for the pipeline these types feed.

/** One line of narration. Rendered uppercase (Greek uppercase drops accents). */
export type Caption = {
  /** 2–4 Greek words. */
  text: string;
  /**
   * Minimum time this caption stays on screen, in ms. If its step finishes
   * sooner the renderer holds the frame until the caption has had its time, so
   * a fast click never produces an unreadable flash. Default 1200.
   */
  holdMs?: number;
};

/**
 * One beat of the flow. Every step may carry a caption, which becomes the
 * current caption on the step's first frame.
 *
 * Timing fields are all optional and all have defaults (see DEFAULTS in
 * config.ts) — a reel should only set them where it wants a different rhythm.
 */
export type Step =
  /** Navigate. `url` is relative to the reel server's origin. */
  | { kind: "goto"; url: string; settleMs?: number; caption?: Caption }
  /**
   * Move the synthetic cursor to `target`, pulse, and really click it.
   * `target` is any CSS selector; reels should use the `data-reel` hooks.
   */
  | {
      kind: "click";
      target: string;
      /** Cursor travel time to the target. Default 520. */
      moveMs?: number;
      /** Frames held after the click so the UI's reaction is visible. Default 700. */
      settleMs?: number;
      caption?: Caption;
    }
  /** Move to `target`, click it, then type `text` one character per tick. */
  | {
      kind: "type";
      target: string;
      text: string;
      /** Milliseconds per character. Default 90. */
      perCharMs?: number;
      moveMs?: number;
      settleMs?: number;
      caption?: Caption;
    }
  /**
   * Slowly scroll through `target` — a showcase pan, not a jump to a click
   * target. Starts from wherever the page is and ends with the target's bottom
   * edge at the bottom of the frame, so the whole of it has passed by. The
   * cursor stays put, the way a thumb rests while the page moves under it.
   *
   * `durationMs` is the scroll itself, fixed rather than derived from the
   * target's height, so the reel's length never changes when the content does.
   */
  | {
      kind: "scroll";
      target: string;
      durationMs: number;
      /** Default "easeInOut": starts and lands gently. */
      easing?: "easeInOut" | "linear";
      caption?: Caption;
    }
  /** Hold the frame for `ms`, optionally changing the caption. */
  | { kind: "wait"; ms: number; caption?: Caption }
  /** Let the UI breathe. Same as `wait` but can never change the caption. */
  | { kind: "hold"; ms: number }
  /**
   * The ending's "here is your plan" beat: opens the app's reel-only clean plan
   * view (ReelPlanPreview, via a `reel:preview` event), hides the cursor, fades
   * the captions out, and holds for `holdMs` (default 3000). Should be the last
   * step — the outro slides this exact frame away.
   */
  | { kind: "preview"; holdMs?: number }
  /**
   * `preview` without the preview: clears the captions, parks the cursor off
   * frame and holds for `holdMs` (default 900), leaving the app exactly where
   * the previous step left it.
   *
   * What it is for: a reel that ends on its own last frame — a showcase
   * `scroll`, say — rather than on the clean plan view. Without it the outro
   * would slide away a frame with a stale caption and a cursor still on it.
   */
  | { kind: "finish"; holdMs?: number };

/**
 * A camera move. Keyframes are attached to STEP INDEXES, not timestamps, so
 * re-timing a step never desynchronises the camera.
 */
export type CameraKeyframe = {
  /** Index into `Reel.steps` — the step on whose first frame this move starts. */
  at: number;
  /** 1 = full frame, 2 = 2× zoom. Capped at MAX_ZOOM (see config.ts). */
  scale: number;
  /** What the camera centres on: a CSS selector, or the cursor itself. */
  target: string | "cursor";
  /** Transition length into this scale, in ms. */
  durationMs: number;
  easing?: "easeInOut" | "linear";
  /**
   * Which axes the camera tracks the target on. Default "both".
   *
   * "y" tracks vertically only and holds the crop at `anchorX`. On a phone
   * layout that is usually what you want: the controls are full-width, so a
   * camera that pans horizontally with the cursor slices their labels off —
   * the cursor sits at the CENTRE of a full-width button, but the text that
   * says what the button does is at its left edge.
   */
  follow?: "both" | "y";
  /**
   * Where the crop sits horizontally when `follow` is "y": 0 flush left, 0.5
   * centred, 1 flush right. Default 0.5. A small value keeps left-aligned
   * labels whole and spends the crop on the empty right-hand side instead.
   */
  anchorX?: number;
};

/** How the app is captured. Every field has a default — see DEFAULTS. */
export type CaptureSettings = {
  /**
   * CSS viewport width. This is what the app's media queries see, so it decides
   * whether the reel shows the phone or the desktop layout. Default 432 (a
   * phone; 432×768 is exactly 9:16).
   */
  cssWidth?: number;
  /**
   * Device pixel ratio. cssWidth × deviceScaleFactor is the captured frame
   * width, which must be ≥ 2× the output width so the camera can crop into real
   * pixels rather than upscaling. Default 5 → 2160×3840.
   */
  deviceScaleFactor?: number;
  /** "jpeg" (default, ~5× smaller) or "png" (lossless, large). */
  frameFormat?: "jpeg" | "png";
  /** JPEG quality, 0–100. Default 94. */
  frameQuality?: number;
};

/**
 * The closing scene (PASS D): the last captured frame slides up and away,
 * revealing a rotating globe with a plane, the headline and the tagline.
 * Every timing defaults from OUTRO_DEFAULTS in config.ts.
 */
export type Outro = {
  /** One entry per word; each pops in on its own. */
  headline: string[];
  /** The longer, smaller line under the globe. */
  tagline: string;
  /** Preview slide-up length. */
  slideMs?: number;
  /** Plane flight, left limb → right limb. */
  flightMs?: number;
  /** Hold on the finished frame. */
  endHoldMs?: number;
};

export type Reel = {
  /** Also the output filename: reels/out/<name>.mp4. */
  name: string;
  /** Optional: 4–8 Greek words, pinned to the top of the frame for the whole reel. */
  title?: string;
  /** Output size. 1080×1920 for Instagram/TikTok. */
  viewport: { width: number; height: number };
  fps: number;
  steps: Step[];
  /** Omitted → a static, full-frame camera. */
  camera?: CameraKeyframe[];
  capture?: CaptureSettings;
  /** Omitted → the reel ends where its steps end. */
  outro?: Outro;
};

// --- What capture.ts hands to the later passes --------------------------------

/** Per-frame state recorded during PASS A, consumed by PASS B and PASS C. */
export type Timeline = {
  name: string;
  title?: string;
  fps: number;
  width: number;
  height: number;
  /** Captured frame size, in real pixels. */
  sourceWidth: number;
  sourceHeight: number;
  cssWidth: number;
  cssHeight: number;
  deviceScaleFactor: number;
  frameExt: string;
  frameCount: number;
  /** The frame index each step starts on — camera keyframes resolve through this. */
  stepFrames: number[];
  /** Caption changes: the frame each new caption takes over on. Empty text = clear. */
  captionEvents: { frame: number; text: string }[];
  /** Cursor position per frame, in CSS pixels. */
  cursor: { x: number; y: number }[];
  /**
   * Per-frame centre of every selector named by a camera keyframe, in CSS
   * pixels. Keyed by selector; missing frames (element not in the DOM) fall back
   * to the last known position.
   */
  targets: Record<string, ({ x: number; y: number } | null)[]>;
};
