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
    const body = await req.json();

    const table = (prisma as any)[normalizedModel];

    let data = body;
    if (modelHasField(normalizedModel, "position")) {
      const agg = await table.aggregate({ _max: { position: true } });
      data = { ...body, position: (agg._max.position ?? -1) + 1 };
    }

    const dmmf = (prisma as any)._dmmf;
    const modelKey = normalizedModel.charAt(0).toUpperCase() + normalizedModel.slice(1);
    const modelDef = dmmf.datamodel.models.find((m: any) => m.name === modelKey);
    const objectFields = (modelDef?.fields ?? []).filter((f: any) => f.kind === "object");
    const include = objectFields.length > 0
      ? Object.fromEntries(objectFields.map((f: any) => [f.name, true]))
      : undefined;

    const record = await table.create({ data, ...(include && { include }) });

    return Response.json(record, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { error: error.message ?? "Failed to create record" },
      { status: 500 }
    );
  }
}
