import { ALLOWED_MODELS } from "./models";

export { ALLOWED_MODELS };

export type AllowedModel = string;

export function resolveModel(model: string): AllowedModel | Response {
  const match = ALLOWED_MODELS.value.find(
    (m) => m.toLowerCase() === model.toLowerCase()
  );

  if (!match) {
    return Response.json(
      { error: `Unknown model: ${model}` },
      { status: 400 }
    );
  }

  return match;
}
