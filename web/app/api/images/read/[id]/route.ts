import { prisma } from "@/framework/lib/prisma"
import { NextResponse } from "next/server"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params
  const imageId = Number(id)

  if (!Number.isInteger(imageId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const image = await prisma.image.findUnique({ where: { id: imageId } })

  if (!image?.src) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }

  return new Response(new Uint8Array(image.src), {
    headers: { "Content-Type": "image/png" },
  })
}
