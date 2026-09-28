import { NextResponse } from "next/server";
import { readCity, writeCity } from "@/lib/cityStore";
import { runGenerator } from "@/lib/regenerate";
import type { EditorActivity } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Ctx = { params: Promise<{ cityId: string }> };

// POST an EditorActivity -> append it to the city's JSON (new max id + strip any
// transient __ fields), write atomically, regenerate. Used to save a verified draft.
export async function POST(req: Request, { params }: Ctx) {
  const { cityId } = await params;
  const incoming = (await req.json().catch(() => null)) as EditorActivity | null;
  if (!incoming || !incoming.name) {
    return NextResponse.json({ error: "activity with a name required" }, { status: 400 });
  }
  let city;
  try { city = await readCity(cityId); } catch {
    return NextResponse.json({ error: "city not found" }, { status: 404 });
  }
  const activities = Array.isArray(city.activities) ? city.activities : [];
  const maxId = activities.reduce(
    (m, a) => (typeof a.id === "number" && a.id > m ? a.id : m), 0
  );
  // Drop any transient UI-only keys (defensive; client also strips them).
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(incoming)) if (!k.startsWith("__")) clean[k] = v;
  clean.id = maxId + 1;

  city.activities = [...activities, clean as EditorActivity];
  await writeCity(cityId, city);
  const gen = await runGenerator();
  return NextResponse.json({ ok: gen.ok, generator: gen.output, id: clean.id });
}
