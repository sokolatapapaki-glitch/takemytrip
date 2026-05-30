import { prisma } from "@/framework/lib/prisma";
import { NextRequest } from "next/server";
import { resolveModel } from "../../lib/allowedModels";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ model: string }> }
) {
  const { model } = await params;

  const normalizedModel = resolveModel(model);
  if (normalizedModel instanceof Response) return normalizedModel;

  try {
    const { where } = await req.json();

    if (!where || Object.keys(where).length === 0) {
      return Response.json(
        { error: "A 'where' condition is required to delete records" },
        { status: 400 }
      );
    }

    const deleted = await (prisma as any)[normalizedModel].deleteMany({ where });

    return Response.json(deleted);
  } catch (error: any) {
    return Response.json(
      { error: error.message ?? "Failed to delete records" },
      { status: 500 }
    );
  }
}
