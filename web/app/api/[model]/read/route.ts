import { prisma } from "@/framework/lib/prisma";
import { NextRequest } from "next/server";
import { resolveModel } from "../../lib/allowedModels";
import { modelHasField } from "../../lib/models";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ model: string }> }
) {
  const { model } = await params;

  const normalizedModel = resolveModel(model);
  if (normalizedModel instanceof Response) return normalizedModel;

  try {
    const { where, select } = await req.json();

    const records = await (prisma as any)[normalizedModel].findMany({
      ...(where && { where }),
      ...(select && { select }),
      ...(modelHasField(normalizedModel, "position") && { orderBy: { position: "asc" } }),
    });

    return Response.json(records);
  } catch (error: any) {
    return Response.json(
      { error: error.message ?? "Failed to read records" },
      { status: 500 }
    );
  }
}
