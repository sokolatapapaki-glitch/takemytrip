import { NextResponse } from "next/server";
import { readCity, writeCity } from "@/lib/cityStore";
import { runGenerator } from "@/lib/regenerate";
import type { CityFile } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ cityId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { cityId } = await params;
  try {
    return NextResponse.json(await readCity(cityId));
  } catch {
    return NextResponse.json({ error: "city not found" }, { status: 404 });
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  const { cityId } = await params;
  const body = (await req.json()) as CityFile;
  if (!body || !Array.isArray(body.activities)) {
    return NextResponse.json({ error: "invalid city payload" }, { status: 400 });
  }
  await writeCity(cityId, body);
  const gen = await runGenerator();
  return NextResponse.json({ ok: gen.ok, generator: gen.output });
}
