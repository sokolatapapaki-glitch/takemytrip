import { describe, it, expect, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TMP = mkdtempSync(join(tmpdir(), "regen-"));
vi.mock("./paths", () => ({ JSON_DIR: "", NEXTAPP_DIR: TMP }));

describe("runGenerator", () => {
  it("ok=true and captures stdout when the script exits 0", async () => {
    const scripts = join(TMP, "scripts");
    mkdirSync(scripts, { recursive: true });
    writeFileSync(join(scripts, "gen-activities.mjs"), 'console.log("GEN_OK");\n', "utf8");
    const { runGenerator } = await import("./regenerate");
    const res = await runGenerator();
    expect(res.ok).toBe(true);
    expect(res.output).toContain("GEN_OK");
    rmSync(TMP, { recursive: true, force: true });
  });
});
