// -----------------------------------------------------------------------------
// create-trip-zoom — v2, camera pushes in for the filter selection
// -----------------------------------------------------------------------------
// Identical steps to v1 (imported, not copied), plus a camera. The push-in
// starts on the first filter click and pulls back out once the third has
// landed, so the part of the flow that is fiddly on a phone is the part the
// viewer actually sees.
//
// Because the camera is a crop applied in PASS C, the captions rendered in
// PASS B are untouched by it: the picture zooms, the text does not.

import type { Reel } from "../types.js";
import {
  AFTER_FILTERS_STEP,
  CREATE_TRIP_STEPS,
  FIRST_FILTER_STEP,
  OUTRO,
} from "./create-trip.js";

export const createTripZoom: Reel = {
  name: "create-trip-zoom",
  viewport: { width: 1080, height: 1920 },
  fps: 30,
  steps: CREATE_TRIP_STEPS,
  camera: [
    // In on the filters, tracking the cursor vertically with a damped follow
    // (CAMERA_FOLLOW) so it glides rather than twitching at every pixel of
    // mouse movement.
    //
    // Vertical only, anchored near the left edge: the filter options are
    // full-width buttons whose labels ("έως 6ω") sit at their left edge, so a
    // camera that centres on the cursor — which lands in the MIDDLE of the
    // button — crops off the very text the viewer needs to read. 1.55× spends
    // the crop on the empty right-hand side instead.
    {
      at: FIRST_FILTER_STEP,
      scale: 1.55,
      target: "cursor",
      durationMs: 450,
      easing: "easeInOut",
      follow: "y",
      anchorX: 0.12,
    },
    // …and back out for the finish.
    { at: AFTER_FILTERS_STEP, scale: 1.0, target: "cursor", durationMs: 450, easing: "easeInOut" },
  ],
  outro: OUTRO,
};

export default createTripZoom;
