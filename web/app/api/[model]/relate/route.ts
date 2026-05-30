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
    const { where, field, action, targetId } = await req.json();

    if (!where || Object.keys(where).length === 0) {
      return Response.json(
        { error: "A 'where' condition is required" },
        { status: 400 }
      );
    }
    if (!field || typeof field !== "string") {
      return Response.json(
        { error: "A 'field' string is required" },
        { status: 400 }
      );
    }
    if (action !== "connect" && action !== "disconnect") {
      return Response.json(
        { error: "'action' must be 'connect' or 'disconnect'" },
        { status: 400 }
      );
    }
    if (targetId == null) {
      return Response.json(
        { error: "A 'targetId' is required" },
        { status: 400 }
      );
    }

    const updated = await (prisma as any)[normalizedModel].update({
      where,
      data: { [field]: { [action]: { id: targetId } } },
    });

    return Response.json(updated);
  } catch (error: any) {
    return Response.json(
      { error: error.message ?? "Failed to update relation" },
      { status: 500 }
    );
  }
}
