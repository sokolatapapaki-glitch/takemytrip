import { readFile, writeFile, rename, readdir, access } from "node:fs/promises";
import { join } from "node:path";
import { JSON_DIR } from "./paths";
import type { CityFile } from "./types";

const fileFor = (id: string) => join(JSON_DIR, `${id}.json`);

export async function cityExists(id: string): Promise<boolean> {
  try { await access(fileFor(id)); return true; } catch { return false; }
}

// Create a brand-new city JSON from a header (city/country/currency/location/…).
// Fails if it already exists. Activities start empty; batch/append fills them.
export async function createCity(
  id: string,
  header: Omit<CityFile, "activities"> & { activities?: CityFile["activities"] }
): Promise<void> {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error("invalid city id");
  if (await cityExists(id)) throw new Error("city already exists");
  const data: CityFile = { ...header, activities: header.activities ?? [] };
  await writeCity(id, data);
}

export async function listCities() {
  const files = (await readdir(JSON_DIR)).filter((f) => f.endsWith(".json"));
  const out = [];
  for (const f of files.sort()) {
    const id = f.replace(/\.json$/, "");
    const data = JSON.parse(await readFile(join(JSON_DIR, f), "utf8")) as CityFile;
    const acts = Array.isArray(data.activities) ? data.activities : [];
    out.push({
      id,
      label: data.city || id,
      count: acts.filter((a) => a.archived !== true).length,
      archivedCount: acts.filter((a) => a.archived === true).length,
    });
  }
  return out;
}

export async function readCity(id: string): Promise<CityFile> {
  return JSON.parse(await readFile(fileFor(id), "utf8")) as CityFile;
}

// Atomic write: serialize -> temp file in same dir -> rename over the target.
export async function writeCity(id: string, data: CityFile): Promise<void> {
  const target = fileFor(id);
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  const json = JSON.stringify(data, null, 2) + "\n";
  await writeFile(tmp, json, "utf8");
  await rename(tmp, target);
}
