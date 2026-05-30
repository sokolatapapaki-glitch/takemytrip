import { Prisma } from "@prisma/client";

function getAllModels(): string[] {
  const dmmf = Prisma.dmmf;

  if (!dmmf) {
    return [];
  }

  return dmmf.datamodel.models.map((model: any) => {
    const name: string = model.name;
    return name[0].toLowerCase() + name.slice(1);
  });
}

export const ALLOWED_MODELS = {
  get value() {
    return getAllModels();
  },
};

export function modelHasField(
  modelName: string,
  fieldName: string
): boolean {
  const dmmf = Prisma.dmmf;

  if (!dmmf) return false;

  const model = dmmf.datamodel.models.find(
    (m: any) =>
      m.name.toLowerCase() === modelName.toLowerCase()
  );

  return (
    model?.fields.some(
      (f: any) => f.name === fieldName
    ) ?? false
  );
}