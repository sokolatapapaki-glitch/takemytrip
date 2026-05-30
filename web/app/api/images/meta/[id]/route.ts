import { prisma } from "@/framework/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const imageId = Number(id);

  if (!Number.isInteger(imageId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const image = await prisma.image.findUnique({
    where: { id: imageId },
    select: {
      id: true,
      alt: true,
      blur: true,
      overlayColor: true,
      objectFit: true,
      positionX: true,
      positionY: true,
      rotate: true,
      scale: true,
      cropX: true,
      cropY: true,
      cropWidth: true,
      cropHeight: true,
      flipHorizontal: true,
      flipVertical: true,
      createdAt: true,
    },
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return NextResponse.json({ image });
}
