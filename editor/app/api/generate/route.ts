import { NextResponse } from "next/server";
import { generateDrafts } from "@/lib/n8n";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// POST { city, names: string[] } -> { drafts } . Calls the Oracle VM n8n workflow
// once per name; NEVER auto-saves — the drafts are returned for review.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const city = body?.city;
  const names: string[] = Array.isArray(body?.names) ? body.names : [];
  if (!city || names.length === 0) {
    return NextResponse.json({ error: "city and names[] required" }, { status: 400 });
  }
  const drafts = await generateDrafts(city, names);
  return NextResponse.json({ drafts });
}
