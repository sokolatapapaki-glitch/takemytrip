import { prisma } from "@/framework/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Convert file to bytes
  const bytes = Buffer.from(await file.arrayBuffer());

  // Create the image
  const savedImage = await prisma.image.create({
    data: { src: bytes },
  });

  return NextResponse.json({ id: savedImage.id });
}
