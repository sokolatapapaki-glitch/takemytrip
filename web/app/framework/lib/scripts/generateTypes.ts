import fs from "fs";
import path from "path";
import { Prisma } from "@prisma/client";
import { ALLOWED_MODELS } from "@/api/lib/allowedModels";
import fieldConfigDefault, { tableConfig, DEFAULT_IGNORED_FIELDS } from "@/config/fieldConfig";

const models = ALLOWED_MODELS.value;

// === 1. Generate Prisma type re-exports ===
const prismaTypes = models.map(
  (m) => m.charAt(0).toUpperCase() + m.slice(1)
);

const typesContent = `export type {
  ${prismaTypes.join(",\n  ")}
} from "@prisma/client";
`;

const typesPath = path.join(
  process.cwd(),
  "app/framework/types/index.ts"
);

fs.mkdirSync(path.dirname(typesPath), { recursive: true });
fs.writeFileSync(typesPath, typesContent);

console.log("✅ Prisma model types generated");

// === 2. Sync fieldConfig with current schema ===
const dmmf = Prisma.dmmf;
if (!dmmf) {
  console.warn("⚠️  Prisma DMMF unavailable; skipping fieldConfig sync.");
  process.exit(0);
}

const allModels = dmmf.datamodel.models;
const lcKey = (name: string) => name[0].toLowerCase() + name.slice(1);
const allowedKeys = new Set(allModels.map((m: any) => lcKey(m.name)));

function detectRelations(model: any): Record<string, Record<string, any>> {
  const result: Record<string, Record<string, any>> = {};
  for (const field of model.fields) {
    if (field.kind !== "object") continue;
    if ((field.relationFromFields ?? []).length > 0) continue;

    const otherModel = allModels.find((m: any) => m.name === field.type);
    if (!otherModel) continue;

    const backField = otherModel.fields.find(
      (f: any) => f.relationName === field.relationName && f.name !== field.name
    );
    if (!backField) continue;

    if (field.isList && backField.isList) {
      result[field.name] = { relationType: "manyToMany" };
    } else if (field.isList && (backField.relationFromFields ?? []).length > 0) {
      result[field.name] = { relationType: "child" };
    }
  }
  return result;
}

const nextFieldConfig: Record<string, Record<string, Record<string, any>>> = {};
for (const [key, value] of Object.entries(fieldConfigDefault)) {
  if (allowedKeys.has(key)) nextFieldConfig[key] = value;
}
for (const model of allModels) {
  const key = lcKey(model.name);
  if (key in nextFieldConfig) continue;
  const relations = detectRelations(model);
  if (Object.keys(relations).length > 0) {
    nextFieldConfig[key] = relations;
  }
}

const nextTableConfig: Record<string, { ignoredFields?: string[] }> = {};
for (const [key, value] of Object.entries(tableConfig)) {
  if (allowedKeys.has(key)) nextTableConfig[key] = value;
}

const isIdent = (k: string) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k);

function emit(v: any, depth = 1): string {
  const pad = "  ".repeat(depth);
  const closePad = "  ".repeat(depth - 1);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    return `[${v.map((x) => emit(x, depth + 1)).join(", ")}]`;
  }
  if (v !== null && typeof v === "object") {
    const entries = Object.entries(v);
    if (entries.length === 0) return "{}";
    const inner = entries.map(([k, val]) => {
      const key = isIdent(k) ? k : JSON.stringify(k);
      return `${pad}${key}: ${emit(val, depth + 1)},`;
    }).join("\n");
    return `{\n${inner}\n${closePad}}`;
  }
  return JSON.stringify(v);
}

const configContent = `export const DEFAULT_IGNORED_FIELDS = ${emit(DEFAULT_IGNORED_FIELDS)};

const fieldConfig: Record<string, Record<string, Record<string, any>>> = ${emit(nextFieldConfig)};

export const tableConfig: Record<string, { ignoredFields?: string[] }> = ${emit(nextTableConfig)};

export default fieldConfig;
`;

const configPath = path.join(process.cwd(), "app/config/fieldConfig.ts");
fs.writeFileSync(configPath, configContent);

console.log("✅ fieldConfig synced with schema");
