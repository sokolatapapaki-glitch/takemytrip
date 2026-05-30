import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ALLOWED_MODELS } from "../lib/allowedModels";

export async function GET() {
  const dmmf = Prisma.dmmf;

  if (!dmmf) {
    return NextResponse.json(
      { error: "DMMF unavailable" },
      { status: 500 }
    );
  }

  const result: Record<string, any[]> = {};

  for (const model of ALLOWED_MODELS.value) {
    const modelKey =
      model.charAt(0).toUpperCase() + model.slice(1);

    const modelDef = dmmf.datamodel.models.find(
      (m: any) => m.name === modelKey
    );

    if (!modelDef) continue;

    result[model] = modelDef.fields.map((field: any) => ({
      name: field.name,
      type: field.type,
      kind: field.kind,
      isRequired: field.isRequired,
      isList: field.isList,
      isNullable:
        field.isOptional || !field.isRequired,
      isId: field.isId,
      isUnique: field.isUnique,
      hasDefaultValue: field.hasDefaultValue,
      default: field.default ?? null,
      relationName: field.relationName ?? null,
      relationFromFields:
        field.relationFromFields ?? [],
      relationToFields:
        field.relationToFields ?? [],
      relationOnDelete:
        field.relationOnDelete ?? null,
      relationOnUpdate:
        field.relationOnUpdate ?? null,
      isEnum: field.kind === "enum",
      documentation:
        field.documentation ?? null,
      isUpdatedAt:
        field.isUpdatedAt ?? false,
      isGenerated:
        field.isGenerated ?? false,
    }));
  }

  return NextResponse.json(result);
}