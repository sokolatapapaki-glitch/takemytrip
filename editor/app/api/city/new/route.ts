import { NextResponse } from "next/server";
import { createCity, cityExists } from "@/lib/cityStore";
import { runGenerator } from "@/lib/regenerate";
import type { CityFile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// POST { id, header } -> creates takemytrip/data/<id>.json (empty activities),
// then regenerates. Idempotent-ish: returns ok if it already exists.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { id?: string; header?: Omit<CityFile, "activities"> }
    | null;
  const id = body?.id?.trim();
  const header = body?.header;
  if (!id || !header || !header.city) {
    return NextResponse.json({ error: "id and header.city required" }, { status: 400 });
  }
  if (await cityExists(id)) {
    return NextResponse.json({ ok: true, existed: true });
  }
  try {
    await createCity(id, header);
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message || e) }, { status: 400 });
  }
  const gen = await runGenerator();
  return NextResponse.json({ ok: gen.ok, existed: false, generator: gen.output });
}
