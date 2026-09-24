// -----------------------------------------------------------------------------
// PASS C — composite
// -----------------------------------------------------------------------------
// Applies the camera (a crop of the 2× capture, scaled down to the output size),
// overlays the caption frames, appends the outro frames (PASS D) when the reel
// has one, and encodes H.264.
//
// Two paths, because the cheap one covers most reels:
//
//   no camera — one ffmpeg run. The whole sequence is scaled 2160→1080 and the
//               captions are overlaid in the same filter graph.
//   camera    — the crop changes every frame, and ffmpeg has no way to vary a
//               crop rectangle across a batch without building an expression
//               hundreds of branches deep. So each frame is cropped by its own
//               tiny ffmpeg run (in parallel), then the overlay+encode runs once
//               over the result.

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { ENCODE_ARGS, OUT_DIR } from "./config.js";
import type { CropRect } from "./camera.js";
import type { Timeline } from "./types.js";

const FFMPEG = ffmpegPath as unknown as string;

export async function compose(
  timeline: Timeline,
  workDir: string,
  crops: CropRect[] | null,
  outroDir: string | null = null
): Promise<string> {
  const { width, height, fps, frameExt } = timeline;
  const appDir = path.join(workDir, "app");
  const capDir = path.join(workDir, "captions");
  await fs.mkdir(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, `${timeline.name}.mp4`);

  // Where the encoder reads the picture from, and what it still has to do to it.
  let pictureDir = appDir;
  let pictureExt = frameExt;
  let pictureFilter = `scale=${width}:${height}:flags=lanczos`;

  if (crops) {
    pictureDir = await applyCamera(timeline, workDir, crops);
    pictureExt = frameExt;
    // applyCamera already produced output-sized frames.
    pictureFilter = "null";
  }

  // Main part: picture + captions. With an outro, its opaque frames are
  // concatenated straight after, in the same graph — one encode, no seam.
  const main = `[0:v]${pictureFilter},format=rgba[bg];[bg][1:v]overlay=0:0:format=auto,format=yuv420p,setsar=1`;
  const graph = outroDir
    ? `${main}[main];[2:v]format=yuv420p,setsar=1[outro];[main][outro]concat=n=2:v=1:a=0[v]`
    : `${main}[v]`;

  await run(FFMPEG, [
    "-y",
    "-framerate", String(fps),
    "-i", path.join(pictureDir, `%05d.${pictureExt}`),
    "-framerate", String(fps),
    "-i", path.join(capDir, "%05d.png"),
    ...(outroDir
      ? ["-framerate", String(fps), "-i", path.join(outroDir, "%05d.png")]
      : []),
    "-filter_complex",
    graph,
    "-map", "[v]",
    ...ENCODE_ARGS,
    "-r", String(fps),
    outFile,
  ]);

  return outFile;
}

/**
 * Crop+scale every frame to the output size, one ffmpeg run per frame, a few at
 * a time. Cheap enough (a few hundred sub-100ms runs) for an offline generator,
 * and exact — no expression rounding, no zoompan jitter.
 */
async function applyCamera(
  timeline: Timeline,
  workDir: string,
  crops: CropRect[]
): Promise<string> {
  const camDir = path.join(workDir, "camera");
  await fs.rm(camDir, { recursive: true, force: true });
  await fs.mkdir(camDir, { recursive: true });

  const appDir = path.join(workDir, "app");
  const { width, height, frameExt } = timeline;
  const pool = Math.max(2, Math.min(8, os.cpus().length));

  let next = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const f = next++;
      if (f >= timeline.frameCount) return;
      const c = crops[f];
      const name = `${String(f).padStart(5, "0")}.${frameExt}`;
      await run(FFMPEG, [
        "-y",
        "-loglevel", "error",
        "-i", path.join(appDir, name),
        "-vf", `crop=${c.w}:${c.h}:${c.x}:${c.y},scale=${width}:${height}:flags=lanczos`,
        ...(frameExt === "jpg" ? ["-q:v", "2"] : []),
        path.join(camDir, name),
      ]);
    }
  };

  await Promise.all(Array.from({ length: pool }, worker));
  return camDir;
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => {
      err += d.toString();
    });
    p.on("error", reject);
    p.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${path.basename(cmd)} exited ${code}\n${err.slice(-4000)}`))
    );
  });
}
