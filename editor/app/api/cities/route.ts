import { NextResponse } from "next/server";
import { listCities } from "@/lib/cityStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const cities = await listCities();
  return NextResponse.json({ cities });
}
