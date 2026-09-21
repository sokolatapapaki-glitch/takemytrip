// -----------------------------------------------------------------------------
// The app under the camera
// -----------------------------------------------------------------------------
// Reels render against a PRODUCTION build (`next build` + `next start`), not
// `next dev`, for two reasons found the hard way:
//
//   • React StrictMode's double-invoked effects break the homepage's typewriter
//     placeholder in dev — the destination field never becomes writable, so the
//     flow a reel drives does not exist there.
//   • The dev server's HMR socket and overlay inject their own timers and DOM,
//     which is exactly the nondeterminism a frame-exact capture is trying to
//     avoid.
//
// `--dev` opts back into `next dev` for a quick iteration loop when the reel
// being tuned does not touch either of those.

import { spawn, type ChildProcess } from "node:child_process";
import { REPO_ROOT, SERVER_ORIGIN, SERVER_PORT } from "./config.js";

export type ServerHandle = { stop(): Promise<void> };

/** Already serving on the reel port? Then leave it alone and use it. */
async function isUp(): Promise<boolean> {
  try {
    const res = await fetch(SERVER_ORIGIN, { signal: AbortSignal.timeout(1500) });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

export async function startServer(opts: {
  dev: boolean;
  build: boolean;
}): Promise<ServerHandle> {
  if (await isUp()) {
    console.log(`  · reusing the server already on ${SERVER_ORIGIN}`);
    return { async stop() {} };
  }

  if (!opts.dev && opts.build) {
    console.log("  · next build");
    await once("npx", ["next", "build"]);
  }

  const args = opts.dev
    ? ["next", "dev", "-p", String(SERVER_PORT)]
    : ["next", "start", "-p", String(SERVER_PORT)];
  console.log(`  · ${args.join(" ")}`);

  const child = spawn("npx", args, {
    cwd: REPO_ROOT,
    stdio: ["ignore", "ignore", "inherit"],
    detached: false,
  });

  const deadline = Date.now() + 90_000;
  for (;;) {
    if (child.exitCode !== null) {
      throw new Error(`reel server exited with code ${child.exitCode} before serving.`);
    }
    if (await isUp()) break;
    if (Date.now() > deadline) {
      child.kill("SIGKILL");
      throw new Error(`reel server did not come up on ${SERVER_ORIGIN} within 90s.`);
    }
    await sleep(500);
  }

  return {
    async stop() {
      await end(child);
    },
  };
}

function once(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: REPO_ROOT, stdio: ["ignore", "ignore", "inherit"] });
    p.on("error", reject);
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args[0]} exited ${code}`))
    );
  });
}

function end(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    child.once("close", () => resolve());
    child.kill("SIGTERM");
    setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
      resolve();
    }, 5000);
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
