#!/usr/bin/env node
// -----------------------------------------------------------------------------
// Reel CLI — `npm run reel -- <name> [flags]`
// -----------------------------------------------------------------------------
//   npm run reel -- create-trip
//   npm run reel -- create-trip-zoom --keep-frames
//   npm run reel -- create-trip --dev           (render against `next dev`)
//   npm run reel -- create-trip --reuse-frames  (recomposite a cached capture)
//   npm run reel -- --all
//
// The passes are separable on purpose: tweaking a caption, a camera move or
// the outro re-runs PASS B–D against the cached PASS A frames, which is
// seconds instead of a minute.

import fs from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { resolveCamera } from "./camera.js";
import { capture } from "./capture.js";
import { compose } from "./compose.js";
import { OUT_DIR } from "./config.js";
import { renderCaptions } from "./overlay/render.js";
import { renderOutro } from "./outro/render.js";
import { startServer } from "./server.js";
import type { Reel, Timeline } from "./types.js";

import createTrip from "./reels/create-trip.js";
import createTripZoom from "./reels/create-trip-zoom.js";

const REELS: Record<string, Reel> = {
  [createTrip.name]: createTrip,
  [createTripZoom.name]: createTripZoom,
};

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const names = argv.filter((a) => !a.startsWith("--"));

  const wanted = flags.has("--all") ? Object.keys(REELS) : names;
  if (wanted.length === 0) {
    console.error(
      `usage: npm run reel -- <name> [--all] [--dev] [--no-build] [--reuse-frames] [--keep-frames]\n` +
        `reels: ${Object.keys(REELS).join(", ")}`
    );
    process.exit(2);
  }
  for (const n of wanted) {
    if (!REELS[n]) {
      console.error(`unknown reel "${n}". Known: ${Object.keys(REELS).join(", ")}`);
      process.exit(2);
    }
  }

  const reuse = flags.has("--reuse-frames");
  // A reused capture never touches the browser, so it never needs the app up.
  const server = reuse
    ? { async stop() {} }
    : await startServer({ dev: flags.has("--dev"), build: !flags.has("--no-build") });

  try {
    for (const name of wanted) {
      const reel = REELS[name];
      const workDir = path.join(OUT_DIR, ".frames", name);
      await fs.mkdir(workDir, { recursive: true });
      const t0 = performance.now();

      console.log(`\n▶ ${name}`);

      let timeline: Timeline;
      if (reuse) {
        timeline = JSON.parse(
          await fs.readFile(path.join(workDir, "timeline.json"), "utf8")
        ) as Timeline;
        console.log(`  · PASS A skipped — reusing ${timeline.frameCount} cached frames`);
      } else {
        console.log("  · PASS A  capture");
        ({ timeline } = await capture(reel, workDir));
        console.log(
          `    ${timeline.frameCount} frames ` +
            `(${(timeline.frameCount / timeline.fps).toFixed(1)}s @ ${timeline.fps}fps, ` +
            `${timeline.sourceWidth}×${timeline.sourceHeight})`
        );
      }

      console.log("  · PASS B  captions");
      await renderCaptions(timeline, workDir);

      let outroDir: string | null = null;
      if (reel.outro) {
        console.log("  · PASS D  outro");
        const o = await renderOutro(timeline, reel.outro, workDir);
        outroDir = o.dir;
        console.log(`    ${o.frameCount} frames (${(o.frameCount / timeline.fps).toFixed(1)}s)`);
      }

      console.log("  · PASS C  composite");
      const crops = resolveCamera(timeline, reel.camera);
      if (crops) {
        const zooms = crops.map((c) => timeline.sourceWidth / c.w);
        console.log(`    camera: ${Math.min(...zooms).toFixed(2)}×–${Math.max(...zooms).toFixed(2)}×`);
      }
      const out = await compose(timeline, workDir, crops, outroDir);

      if (!flags.has("--keep-frames")) {
        await fs.rm(path.join(workDir, "captions"), { recursive: true, force: true });
        await fs.rm(path.join(workDir, "camera"), { recursive: true, force: true });
        await fs.rm(path.join(workDir, "outro"), { recursive: true, force: true });
      }

      const { size } = await fs.stat(out);
      console.log(
        `✔ ${path.relative(process.cwd(), out)} — ` +
          `${(size / 1e6).toFixed(1)} MB in ${((performance.now() - t0) / 1000).toFixed(1)}s`
      );
    }
  } finally {
    await server.stop();
  }
}

main().catch((err) => {
  console.error(`\n✖ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
