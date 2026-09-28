import { execFile } from "node:child_process";
import { NEXTAPP_DIR } from "./paths";

// Run the existing catalogue generator inside my-nextjs-app. Never throws:
// returns ok=false plus captured output so the API can surface failures.
export function runGenerator(): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    execFile(
      process.execPath, // the node binary running this server
      ["scripts/gen-activities.mjs"],
      { cwd: NEXTAPP_DIR, windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        const output = `${stdout || ""}${stderr || ""}`.trim();
        resolve({ ok: !err, output });
      }
    );
  });
}
