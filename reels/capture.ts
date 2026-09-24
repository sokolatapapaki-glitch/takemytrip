// -----------------------------------------------------------------------------
// PASS A — capture
// -----------------------------------------------------------------------------
// Drives the REAL app in Playwright and writes one image per frame, plus a
// timeline.json describing what the later passes need to know (when each
// caption took over, where the cursor was, where the camera's targets were).
//
// Why a screenshot loop and not page.video(): video records at an uncontrolled,
// load-dependent frame rate and drops frames, so the same reel comes out a
// different length every run. A loop gives exactly duration × fps frames.
//
// Determinism has three parts, all of them here:
//   1. page.clock — JS timers only advance when the loop says so.
//   2. __reel.step(dt) — CSS animations are paused and advanced one frame at a
//      time, so entrance pops and dropdown transitions are sampled evenly.
//   3. The cursor is positioned per frame, never by wall clock.

import fs from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import type { Reel, Timeline } from "./types.js";
import {
  CAPTURE_DEFAULTS,
  CHROMIUM_PATH,
  DEFAULTS,
  REEL_EPOCH,
  SERVER_ORIGIN,
} from "./config.js";
import { CURSOR_INIT_SCRIPT, arcPoint, clamp01, easeInOut } from "./cursor.js";

export type CaptureResult = { timeline: Timeline; framesDir: string };

export async function capture(reel: Reel, workDir: string): Promise<CaptureResult> {
  const cap = { ...CAPTURE_DEFAULTS, ...(reel.capture ?? {}) };
  const cssWidth = cap.cssWidth;
  // The CSS viewport keeps the output's aspect ratio, so nothing is ever
  // letterboxed or cropped by surprise.
  const cssHeight = Math.round((cssWidth * reel.viewport.height) / reel.viewport.width);
  const dsf = cap.deviceScaleFactor;
  const sourceWidth = cssWidth * dsf;
  const sourceHeight = cssHeight * dsf;

  if (sourceWidth < reel.viewport.width * 2) {
    throw new Error(
      `capture: a ${sourceWidth}px source is thinner than 2× the ${reel.viewport.width}px ` +
        `output — raise capture.deviceScaleFactor, or the camera will upscale.`
    );
  }

  const framesDir = path.join(workDir, "app");
  await fs.rm(framesDir, { recursive: true, force: true });
  await fs.mkdir(framesDir, { recursive: true });

  const frameFormat = cap.frameFormat;
  const frameExt = frameFormat === "png" ? "png" : "jpg";
  const frameMs = 1000 / reel.fps;
  const tick = Math.round(frameMs);

  // Every selector the camera follows, so their positions are recorded as we go
  // (the camera pass runs long after the browser is gone).
  const cameraSelectors = [
    ...new Set(
      (reel.camera ?? []).map((k) => k.target).filter((t): t is string => t !== "cursor")
    ),
  ];

  const browser = await launch();
  const context = await browser.newContext({
    viewport: { width: cssWidth, height: cssHeight },
    deviceScaleFactor: dsf,
    locale: "el-GR",
    timezoneId: "Europe/Athens",
  });

  const timeline: Timeline = {
    name: reel.name,
    title: reel.title,
    fps: reel.fps,
    width: reel.viewport.width,
    height: reel.viewport.height,
    sourceWidth,
    sourceHeight,
    cssWidth,
    cssHeight,
    deviceScaleFactor: dsf,
    frameExt,
    frameCount: 0,
    stepFrames: [],
    captionEvents: [],
    cursor: [],
    targets: Object.fromEntries(cameraSelectors.map((s) => [s, []])),
  };

  try {
    const page = await context.newPage();
    // Pin wall clock BEFORE the first navigation: the plan page renders real
    // dates, so an unpinned clock re-renders the reel differently every day.
    await page.clock.install({ time: REEL_EPOCH });
    await page.addInitScript(CURSOR_INIT_SCRIPT);

    // Start the cursor just below the frame, so its first move reads as the
    // pointer entering the shot.
    let cursor = { x: cssWidth / 2, y: cssHeight + 40 };
    /** Frame the current click pulse started on, or -1 for "no pulse". */
    let pulseFrame = -1;
    /** Frame the current caption took over on — for its minimum hold. */
    let captionStartFrame = 0;

    /** Advance the world by exactly one frame, place the cursor, shoot. */
    const shoot = async (press = 0): Promise<void> => {
      const i = timeline.frameCount;
      let pulse = pulseFrame >= 0 ? clamp01(((i - pulseFrame) * frameMs) / DEFAULTS.clickPulseMs) : -1;
      if (pulse >= 1) {
        pulseFrame = -1;
        pulse = -1;
      }

      await page.clock.runFor(tick);
      await page.evaluate(
        (f) => {
          window.__reel.step(f.dt);
          window.__reel.cursor(f.x, f.y, f.press, f.pulse);
        },
        { dt: tick, x: cursor.x, y: cursor.y, press, pulse }
      );

      timeline.cursor.push({ x: cursor.x, y: cursor.y });
      for (const sel of cameraSelectors) {
        timeline.targets[sel].push(
          await page.evaluate((s) => window.__reel.centre(s), sel)
        );
      }

      await page.screenshot({
        path: path.join(framesDir, `${String(i).padStart(5, "0")}.${frameExt}`),
        type: frameFormat,
        ...(frameFormat === "jpeg" ? { quality: cap.frameQuality } : {}),
        // We step animations ourselves; "disabled" would fast-forward them.
        animations: "allow",
      });
      timeline.frameCount = i + 1;
    };

    /** Hold the current state for `ms`, rounded to whole frames. */
    const holdFor = async (ms: number): Promise<void> => {
      const n = Math.max(0, Math.round(ms / frameMs));
      for (let i = 0; i < n; i++) await shoot();
    };

    /** Move the cursor to `to` along an arc, one frame at a time. */
    const moveTo = async (to: { x: number; y: number }, ms: number = DEFAULTS.moveMs): Promise<void> => {
      const from = { ...cursor };
      const n = Math.max(1, Math.round(ms / frameMs));
      for (let i = 1; i <= n; i++) {
        cursor = arcPoint(from, to, i / n);
        await shoot();
      }
      cursor = { ...to };
    };

    const clickHere = async (selector: string): Promise<void> => {
      // The visual tell fires one frame BEFORE the real click, so the pulse and
      // the UI's reaction land together instead of a frame apart.
      pulseFrame = timeline.frameCount;
      await shoot(1);
      await page.evaluate((sel) => {
        const el = window.__reel.visible(sel);
        if (!el) throw new Error(`reel: no visible element for ${sel}`);
        // A real pointer sequence, not just .click(): the app closes its
        // dropdowns and its on-load hint on a document mousedown.
        const r = el.getBoundingClientRect();
        const opts = {
          bubbles: true,
          cancelable: true,
          clientX: r.left + r.width / 2,
          clientY: r.top + r.height / 2,
        };
        el.dispatchEvent(new MouseEvent("mousedown", opts));
        el.dispatchEvent(new MouseEvent("mouseup", opts));
        el.click();
      }, selector);
      await shoot(0.5);
    };

    const typeText = async (
      selector: string,
      text: string,
      perCharMs: number
    ): Promise<void> => {
      const perFrame = Math.max(1, Math.round(perCharMs / frameMs));
      for (const ch of text) {
        await page.evaluate(
          (a) => {
            const el = window.__reel.visible(a.sel) as HTMLInputElement | null;
            if (!el) throw new Error(`reel: no visible element for ${a.sel}`);
            // React tracks an input's value on the DOM node, so assigning
            // `.value` is swallowed; go through the native setter and then fire
            // the event React actually listens for.
            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              "value"
            )?.set;
            setter?.call(el, el.value + a.ch);
            el.dispatchEvent(new Event("input", { bubbles: true }));
          },
          { sel: selector, ch }
        );
        for (let i = 0; i < perFrame; i++) await shoot();
      }
    };

    for (let si = 0; si < reel.steps.length; si++) {
      const step = reel.steps[si];
      timeline.stepFrames.push(timeline.frameCount);
      const caption = "caption" in step ? step.caption : undefined;
      if (caption) {
        timeline.captionEvents.push({ frame: timeline.frameCount, text: caption.text });
        captionStartFrame = timeline.frameCount;
      }

      switch (step.kind) {
        case "goto": {
          await page.goto(new URL(step.url, SERVER_ORIGIN).toString(), {
            waitUntil: "domcontentloaded",
          });
          await page.waitForFunction(() => !!window.__reel);
          // Let hydration and the first data pass run. Timers are faked, so
          // this advances them deliberately rather than sleeping.
          await page.clock.runFor(1500);
          await holdFor(step.settleMs ?? DEFAULTS.gotoSettleMs);
          break;
        }

        case "click": {
          await moveTo(
            await resolveTarget(page, step.target, frameMs, shoot),
            step.moveMs ?? DEFAULTS.moveMs
          );
          await clickHere(step.target);
          await holdFor(step.settleMs ?? DEFAULTS.settleMs);
          break;
        }

        case "type": {
          await moveTo(
            await resolveTarget(page, step.target, frameMs, shoot),
            step.moveMs ?? DEFAULTS.moveMs
          );
          await clickHere(step.target);
          await typeText(step.target, step.text, step.perCharMs ?? DEFAULTS.perCharMs);
          await holdFor(step.settleMs ?? DEFAULTS.settleMs);
          break;
        }

        case "wait":
        case "hold":
          await holdFor(step.ms);
          break;

        case "preview": {
          // Captions fade out: an empty caption is the overlay's "clear".
          timeline.captionEvents.push({ frame: timeline.frameCount, text: "" });
          // The cursor has nothing left to point at — park it off frame.
          cursor = { x: cssWidth / 2, y: cssHeight + 200 };
          await page.evaluate(() => window.dispatchEvent(new Event("reel:preview")));
          const opened = await page.evaluate(
            () => !!document.querySelector('[data-reel="plan-preview"]')
          );
          if (!opened) {
            throw new Error(
              'reel: the plan preview did not open — is ReelPlanPreview mounted on this page?'
            );
          }
          await holdFor(step.holdMs ?? DEFAULTS.previewHoldMs);
          break;
        }
      }

      if (caption) {
        const shown = (timeline.frameCount - captionStartFrame) * frameMs;
        const want = caption.holdMs ?? DEFAULTS.captionHoldMs;
        if (shown < want) await holdFor(want - shown);
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  await fs.writeFile(
    path.join(workDir, "timeline.json"),
    JSON.stringify(timeline, null, 2),
    "utf8"
  );
  return { timeline, framesDir };
}

/**
 * Find the target and, when it is not comfortably on screen, SCROLL to it
 * across frames first — an instant jump reads as a glitch on video.
 *
 * Fails loudly when the hook is missing. A reel that silently clicked the wrong
 * thing would produce a plausible-looking but wrong video, which is worse than
 * no video at all.
 */
async function resolveTarget(
  page: Page,
  selector: string,
  frameMs: number,
  shoot: (press?: number) => Promise<void>
): Promise<{ x: number; y: number }> {
  const plan = await page.evaluate((sel) => {
    const el = window.__reel.visible(sel);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    // A sticky top bar and the bottom edge both eat into the comfortable band.
    const margin = Math.min(140, window.innerHeight * 0.18);
    let delta = 0;
    if (rect.top < margin) delta = rect.top - margin;
    else if (rect.bottom > window.innerHeight - margin) {
      delta = rect.bottom - (window.innerHeight - margin);
    }
    return { delta };
  }, selector);

  if (!plan) {
    throw new Error(
      `reel: no visible element matches "${selector}". The hook is missing, or the ` +
        `flow never reached the screen it lives on — see reels/README.md §Hooks.`
    );
  }

  if (Math.abs(plan.delta) > 4) {
    const n = Math.max(1, Math.round(DEFAULTS.scrollMs / frameMs));
    const start = await page.evaluate((sel) => window.__reel.scrollTop(sel), selector);
    for (let i = 1; i <= n; i++) {
      const top = Math.max(0, start + plan.delta * easeInOut(i / n));
      await page.evaluate((a) => window.__reel.scrollTo(a.sel, a.top), { sel: selector, top });
      await shoot();
    }
  }

  // Re-read after scrolling — the rect moved.
  const centre = await page.evaluate((sel) => window.__reel.centre(sel), selector);
  if (!centre) throw new Error(`reel: "${selector}" vanished while scrolling to it.`);
  return centre;
}

/**
 * Prefer the image's pre-installed Chromium when it is there — the `playwright`
 * package pins a browser build that a shared image will not always carry.
 */
async function launch(): Promise<Browser> {
  const args = [
    // Greyscale antialiasing only: subpixel (LCD) text renders coloured fringes
    // that survive the 2× downscale as visible colour noise on letter edges.
    "--font-render-hinting=none",
    "--disable-lcd-text",
    // The app is served from 127.0.0.1 and the overlay from file://; an ambient
    // HTTPS_PROXY would otherwise try to tunnel both and fail.
    "--no-proxy-server",
  ];
  try {
    await fs.access(CHROMIUM_PATH);
    return await chromium.launch({ executablePath: CHROMIUM_PATH, args });
  } catch {
    return await chromium.launch({ args });
  }
}
