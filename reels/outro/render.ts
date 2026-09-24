// -----------------------------------------------------------------------------
// PASS D — outro frames
// -----------------------------------------------------------------------------
// Renders the closing scene: the last app frame (the plan preview) slides up
// and away, revealing the globe, the plane and its trail, the headline and the
// tagline. One opaque 1080×1920 PNG per frame; compose.ts appends them after
// the main part of the reel.
//
// Every frame is computed by scene.ts from `t` alone and written into the page,
// so this pass is as deterministic as the other three.

import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { CHROMIUM_PATH, REELS_DIR } from "../config.js";
import type { Outro, Timeline } from "../types.js";
import { outroDuration, outroScene, outroSetup } from "./scene.js";

export async function renderOutro(
  timeline: Timeline,
  outro: Outro,
  workDir: string
): Promise<{ dir: string; frameCount: number }> {
  const outDir = path.join(workDir, "outro");
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  if (timeline.width !== 1080 || timeline.height !== 1920) {
    throw new Error(
      `outro: the scene is laid out for 1080×1920, not ${timeline.width}×${timeline.height}.`
    );
  }

  // The frame the outro slides away: the last one PASS A captured, which is
  // the plan preview when the reel ends on a preview() step.
  const last = path.join(
    workDir,
    "app",
    `${String(timeline.frameCount - 1).padStart(5, "0")}.${timeline.frameExt}`
  );
  await fs.access(last);

  const frameMs = 1000 / timeline.fps;
  const frameCount = Math.round(outroDuration(outro) / frameMs);
  const scene = outroScene(outro);

  const browser = await launch();
  try {
    const page = await browser.newPage({
      viewport: { width: timeline.width, height: timeline.height },
      deviceScaleFactor: 1,
    });
    await page.goto(
      pathToFileURL(path.join(REELS_DIR, "outro", "template.html")).toString(),
      { waitUntil: "load" }
    );
    if (!(await page.evaluate(() => window.__reelOutro!.ensureFont()))) {
      throw new Error(
        "outro: the bundled font did not load — run `npm run reel:font` to fetch " +
          "reels/overlay/fonts/NotoSans-Bold.ttf."
      );
    }
    await page.evaluate(
      (s) => window.__reelOutro!.init(s),
      outroSetup(outro, pathToFileURL(last).toString())
    );

    for (let f = 0; f < frameCount; f++) {
      await page.evaluate((s) => window.__reelOutro!.render(s), scene(f * frameMs));
      await page.screenshot({
        path: path.join(outDir, `${String(f).padStart(5, "0")}.png`),
        animations: "disabled",
      });
    }
  } finally {
    await browser.close();
  }

  return { dir: outDir, frameCount };
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
