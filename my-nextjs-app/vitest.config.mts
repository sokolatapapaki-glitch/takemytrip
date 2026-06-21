import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.planner.test.ts"],
    // Run test FILES in parallel (separate worker threads). Vitest 4 moved the
    // old poolOptions.threads.maxThreads to a top-level maxWorkers (there is
    // no minWorkers anymore).
    pool: "threads",
    maxWorkers: 8,
    // Property tests run hundreds of full planTrip solves per test, so the
    // per-test ceiling is well above a single solve's 1.5s budget.
    testTimeout: 60_000,
    reporters: ["verbose"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
