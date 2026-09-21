// -----------------------------------------------------------------------------
// Camera — keyframes → one crop rectangle per frame
// -----------------------------------------------------------------------------
// The camera is a CROP of the captured frame, not a transform of the app. That
// is the whole reason the pipeline has three passes: captions are composited
// AFTER this, so zooming the picture never zooms the text.
//
// Capturing at 2× the output width means a 2× zoom still crops real pixels
// rather than upscaling — see MAX_ZOOM.

import { CAMERA_FOLLOW, MAX_ZOOM } from "./config.js";
import { clamp01, easeInOut } from "./cursor.js";
import type { CameraKeyframe, Timeline } from "./types.js";

/** A crop rectangle in SOURCE pixels, to be scaled down to the output size. */
export type CropRect = { x: number; y: number; w: number; h: number };

/**
 * Resolve the camera to one rectangle per frame.
 *
 * Returns null when the reel has no camera at all — the caller then takes the
 * much cheaper "scale the whole frame once" path in compose.ts.
 */
export function resolveCamera(
  timeline: Timeline,
  keyframes: CameraKeyframe[] | undefined
): CropRect[] | null {
  if (!keyframes || keyframes.length === 0) return null;

  const { frameCount, fps, sourceWidth, sourceHeight, deviceScaleFactor: dsf } = timeline;
  const frameMs = 1000 / fps;

  // Keyframes address STEPS; turn them into frames, in order.
  const keys = [...keyframes]
    .map((k) => {
      const frame = timeline.stepFrames[k.at];
      if (frame === undefined) {
        throw new Error(
          `camera: keyframe at step ${k.at}, but the reel has ${timeline.stepFrames.length} steps.`
        );
      }
      return { ...k, frame, scale: Math.min(k.scale, MAX_ZOOM) };
    })
    .sort((a, b) => a.frame - b.frame);

  // --- scale per frame ---------------------------------------------------------
  // Before the first keyframe the camera sits at full frame; each keyframe eases
  // from whatever scale was in force to its own, then holds.
  const scales = new Array<number>(frameCount).fill(1);
  let prevScale = 1;
  for (let ki = 0; ki < keys.length; ki++) {
    const k = keys[ki];
    const end = ki + 1 < keys.length ? keys[ki + 1].frame : frameCount;
    const steps = Math.max(1, Math.round(k.durationMs / frameMs));
    for (let f = k.frame; f < end; f++) {
      const t = clamp01((f - k.frame) / steps);
      const eased = k.easing === "linear" ? t : easeInOut(t);
      scales[f] = prevScale + (k.scale - prevScale) * eased;
    }
    prevScale = k.scale;
  }

  // --- follow target per frame -------------------------------------------------
  // Which keyframe is in force on a given frame — it carries the target and the
  // framing rules as well as the scale.
  const keyAt = (f: number): (typeof keys)[number] | null => {
    let cur: (typeof keys)[number] | null = null;
    for (const k of keys) {
      if (k.frame <= f) cur = k;
      else break;
    }
    return cur;
  };

  const rects: CropRect[] = [];
  // The smoothed centre, in CSS pixels. Seeded on the first frame so the camera
  // does not have to ease in from the middle of the frame.
  let cx = timeline.cssWidth / 2;
  let cy = timeline.cssHeight / 2;
  let seeded = false;

  for (let f = 0; f < frameCount; f++) {
    const key = keyAt(f);
    const sel = key?.target ?? "cursor";
    const want =
      sel === "cursor"
        ? timeline.cursor[f]
        : lastKnown(timeline.targets[sel], f) ?? timeline.cursor[f];

    if (!seeded) {
      cx = want.x;
      cy = want.y;
      seeded = true;
    } else {
      // Damped follow: without it a 2× zoom jitters on every pixel of cursor
      // movement, which is far more distracting on video than a lazy camera.
      cx += (want.x - cx) * CAMERA_FOLLOW;
      cy += (want.y - cy) * CAMERA_FOLLOW;
    }

    const s = scales[f];
    // Crop size in source pixels. Even numbers keep libx264 happy and keep the
    // downscale free of half-pixel offsets.
    const w = even(Math.round(sourceWidth / s));
    const h = even(Math.round((w * timeline.height) / timeline.width));

    // Centre on the follow point, then clamp so the crop never leaves the frame
    // (a camera that shows the void past the edge of the app looks broken).
    const x =
      key?.follow === "y"
        ? Math.round((key.anchorX ?? 0.5) * (sourceWidth - w))
        : clamp(Math.round(cx * dsf - w / 2), 0, sourceWidth - w);
    const y = clamp(Math.round(cy * dsf - h / 2), 0, sourceHeight - h);
    rects.push({ x: even(clamp(x, 0, sourceWidth - w)), y: even(y), w, h });
  }

  return rects;
}

/** The target's position on frame `f`, or the most recent one before it. */
function lastKnown(
  track: ({ x: number; y: number } | null)[] | undefined,
  f: number
): { x: number; y: number } | null {
  if (!track) return null;
  for (let i = Math.min(f, track.length - 1); i >= 0; i--) {
    if (track[i]) return track[i];
  }
  return null;
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const even = (v: number) => v - (v % 2);
