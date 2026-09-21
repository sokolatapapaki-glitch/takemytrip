// -----------------------------------------------------------------------------
// PASS B — caption frames
// -----------------------------------------------------------------------------
// Renders the caption stack + title on a transparent page and screenshots it
// once per frame with alpha (omitBackground). Keeping this out of the app
// capture is what lets PASS C zoom the picture without zooming the text.
//
// Most frames are visually identical to the one before them (a caption only
// moves during its 350ms transition), so frames are rendered once per distinct
// state and hard-linked for the rest. On a 15s reel that is ~40 screenshots
// instead of ~450.

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { CHROMIUM_PATH, DEFAULTS, REELS_DIR } from "../config.js";
import type { Timeline } from "../types.js";

export async function renderCaptions(
  timeline: Timeline,
  workDir: string
): Promise<string> {
  const outDir = path.join(workDir, "captions");
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  const frameMs = 1000 / timeline.fps;
  const items = timeline.captionEvents.map((e) => e.text);

  /** Which caption is current on a frame, and how far into its entrance. */
  const stateOf = (frame: number): { index: number; progress: number } => {
    let index = -1;
    for (let i = 0; i < timeline.captionEvents.length; i++) {
      if (timeline.captionEvents[i].frame <= frame) index = i;
      else break;
    }
    if (index < 0) return { index: -1, progress: 1 };
    const since = (frame - timeline.captionEvents[index].frame) * frameMs;
    // The very first caption has nothing to slide out of the way, so it still
    // gets its rise — it just has empty slots beneath it.
    return { index, progress: Math.min(1, since / DEFAULTS.captionTransitionMs) };
  };

  const browser = await launch();
  try {
    const page = await browser.newPage({
      viewport: { width: timeline.width, height: timeline.height },
      deviceScaleFactor: 1,
    });
    await page.goto(
      pathToFileURL(path.join(REELS_DIR, "overlay", "template.html")).toString(),
      { waitUntil: "load" }
    );
    if (!(await page.evaluate(() => window.__reelOverlay!.ensureFont()))) {
      throw new Error(
        "overlay: the bundled Greek font did not load — every caption would " +
          "render as tofu. Run `npm run reel:font` to fetch " +
          "reels/overlay/fonts/NotoSans-Bold.ttf."
      );
    }

    // state key → the frame that was actually screenshotted for it.
    const rendered = new Map<string, number>();

    for (let f = 0; f < timeline.frameCount; f++) {
      const { index, progress } = stateOf(f);
      // Quantise progress to whole frames so the key is stable; identical
      // states then collapse onto one screenshot.
      const key = `${index}:${Math.round(progress * 1000)}`;
      const file = path.join(outDir, `${String(f).padStart(5, "0")}.png`);

      const done = rendered.get(key);
      if (done !== undefined) {
        await link(path.join(outDir, `${String(done).padStart(5, "0")}.png`), file);
        continue;
      }

      await page.evaluate(
        (s) => window.__reelOverlay!.render(s),
        { title: timeline.title, items, index, progress }
      );
      await page.screenshot({ path: file, omitBackground: true, animations: "disabled" });
      rendered.set(key, f);
    }
  } finally {
    await browser.close();
  }

  return outDir;
}

/** Hard-link where possible, copy where the filesystem refuses. */
async function link(from: string, to: string): Promise<void> {
  try {
    await fs.link(from, to);
  } catch {
    await fs.copyFile(from, to);
  }
}

async function launch() {
  // See capture.ts for why the proxy is off and LCD text is disabled.
  const args = ["--font-render-hinting=none", "--disable-lcd-text", "--no-proxy-server"];
  try {
    await fs.access(CHROMIUM_PATH);
    return await chromium.launch({ executablePath: CHROMIUM_PATH, args });
  } catch {
    return await chromium.launch({ args });
  }
}
