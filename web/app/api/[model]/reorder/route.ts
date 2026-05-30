import { prisma } from "@/framework/lib/prisma";
import { NextRequest } from "next/server";
import { resolveModel } from "../../lib/allowedModels";
import { modelHasField } from "../../lib/models";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ model: string }> }
) {
  const { model } = await params;

  const normalizedModel = resolveModel(model);
  if (normalizedModel instanceof Response) return normalizedModel;

  if (!modelHasField(normalizedModel, "position")) {
    return Response.json(
      { error: `Model '${normalizedModel}' does not have a 'position' field` },
      { status: 400 }
    );
  }

  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: "'ids' must be a non-empty array" }, { status: 400 });
    }

    const table = (prisma as any)[normalizedModel];

    await prisma.$transaction(async (tx) => {
      const txTable = (tx as any)[normalizedModel];
      for (let index = 0; index < ids.length; index++) {
        await txTable.update({ where: { id: ids[index] }, data: { position: index } });
      }
    });

    return Response.json({ ok: true });
  } catch (error: any) {
    return Response.json(
      { error: error.message ?? "Failed to reorder records" },
      { status: 500 }
    );
  }
}
