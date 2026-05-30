import { prisma } from "@/framework/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const imageId = Number(id);

  if (!Number.isInteger(imageId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    await prisma.image.update({
      where: { id: imageId },
      data: { src: bytes },
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return NextResponse.json({ id: imageId });
}
