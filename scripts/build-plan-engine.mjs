// -----------------------------------------------------------------------------
// Bundle the headless trip planner into ONE self-contained CJS file.
// -----------------------------------------------------------------------------
// esbuild inlines all the TS planner code (+ its data) into a single file with no
// external deps, so the n8n Docker container can run it with plain `node` (it has
// no TypeScript toolchain / node_modules). Output lands under the Desktop bind-
// mount, visible to the container at /files/Dimitris/n8n_data/tmt_marketing/.
//
// Run from the app folder, and RE-RUN after changing any planner/filter/data code:
//   node scripts/build-plan-engine.mjs
import { build } from "esbuild";
import path from "path";

const root = process.cwd();
const outfile = "C:/Users/kopot/OneDrive/Desktop/Dimitris/n8n_data/tmt_marketing/plan-engine.cjs";

await build({
  entryPoints: [path.join(root, "scripts/plan-engine.entry.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  outfile,
  // Resolve the "@/..." path alias the app source uses.
  tsconfig: path.join(root, "tsconfig.json"),
  logLevel: "info",
});

console.log("Built " + outfile);
