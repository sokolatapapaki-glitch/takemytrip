import { prisma } from "@/framework/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const images = await prisma.image.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ images });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load images" }, { status: 500 });
  }
}
