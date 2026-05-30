import { prisma } from "@/framework/lib/prisma";
import { NextRequest } from "next/server";
import { resolveModel } from "../../lib/allowedModels";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ model: string }> }
) {
  const { model } = await params;

  const normalizedModel = resolveModel(model);
  if (normalizedModel instanceof Response) return normalizedModel;

  try {
    const { where, data } = await req.json();

    if (!where || Object.keys(where).length === 0) {
      return Response.json(
        { error: "A 'where' condition is required to update records" },
        { status: 400 }
      );
    }

    if (!data || Object.keys(data).length === 0) {
      return Response.json(
        { error: "A 'data' object is required to update records" },
        { status: 400 }
      );
    }

    const updated = await (prisma as any)[normalizedModel].updateMany({ where, data });

    return Response.json(updated);
  } catch (error: any) {
    return Response.json(
      { error: error.message ?? "Failed to update records" },
      { status: 500 }
    );
  }
}
