"use client";

import { useState } from "react";
import { useApp } from "@/framework/ui/context/AppContext";
import CrudButton from "@/framework/data/buttons/CrudButton";

export type FieldType = "String" | "Int" | "Float" | "Boolean" | "DateTime" | "Json";

type Props = {
  value: string | number | boolean;
  updateValue?: (val: string | number | boolean) => void;
  isEditing?: boolean;
  table: string;
  field: string;
  id: number | string;
  error?: string;
  update?: (data: object) => Promise<void>;
};

function coerce(raw: string | boolean, fieldType: FieldType): string | number | boolean {
  if (fieldType === "Int") return parseInt(raw as string, 10);
  if (fieldType === "Float") return parseFloat(raw as string);
  if (fieldType === "Boolean") return raw as boolean;
  return raw as string;
}

function displayValue(value: string | number | boolean, fieldType: FieldType): string {
  if (fieldType === "Boolean") return value ? "true" : "false";
  if (fieldType === "DateTime") return new Date(value as string).toLocaleString();
  return String(value);
}

const inputClass = "border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full";

export default function EditInput({ value, updateValue, isEditing = true, table, field, error, update }: Props) {
  const { prismaFields } = useApp();
  const fieldMeta = prismaFields[table]?.find((f) => f.name === field) ?? {};
  const fieldType: FieldType = (fieldMeta.type as FieldType) ?? "String";

  const { label, placeholder, min, max, options, showInput = true, isRequired } = fieldMeta;

  const toEditable = (v: string | number | boolean) =>
    fieldType === "DateTime" ? new Date(v as string).toISOString().slice(0, 16) : (v as string | boolean);

  const [saved, setSaved] = useState<string | number | boolean>(value);
  const [current, setCurrent] = useState<string | boolean>(toEditable(value));
  const [editing, setEditing] = useState(!isEditing);
  const [saving, setSaving] = useState(false);

  const editValue = isEditing ? current : toEditable(value);
  const setEditValue = isEditing
    ? setCurrent
    : (v: string | boolean) => updateValue?.(coerce(v, fieldType));

  const handleSave = async () => {
    if (editValue !== toEditable(saved)) {
      const newValue = coerce(editValue, fieldType);
      setSaving(true);
      await update?.({ [field]: newValue });
      setSaved(newValue);
      setSaving(false);
    }
    setEditing(false);
  };

  const handleEdit = () => {
    if (isEditing) setCurrent(toEditable(saved));
    setEditing(true);
  };

  const labelEl = label ? (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {isRequired && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  ) : null;

  const errorEl = error ? (
    <p className="text-red-500 text-xs mt-1">{error}</p>
  ) : null;

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-gray-800 text-sm">{displayValue(saved, fieldType)}</span>
        {isEditing && (
          <CrudButton type="edit" table={table} onClick={handleEdit} />
        )}
        {errorEl}
      </span>
    );
  }

  if (!showInput) return null;

  const inputEl = (() => {
    if (options?.length) {
      return (
        <select
          value={editValue as string}
          onChange={(e) => setEditValue(e.target.value)}
          autoFocus
          className={inputClass}
        >
          {options.map((opt: any) => (
            <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
          ))}
        </select>
      );
    }
    if (fieldType === "Boolean") {
      return (
        <input
          type="checkbox"
          checked={editValue as boolean}
          onChange={(e) => setEditValue(e.target.checked)}
          autoFocus
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
      );
    }
    if (fieldType === "DateTime") {
      return (
        <input
          type="datetime-local"
          value={editValue as string}
          onChange={(e) => setEditValue(e.target.value)}
          autoFocus
          className={inputClass}
        />
      );
    }
    if (fieldType === "Int" || fieldType === "Float") {
      return (
        <input
          type="number"
          step={fieldType === "Float" ? "any" : "1"}
          value={editValue as string}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          autoFocus
          className={inputClass}
        />
      );
    }
    if (fieldType === "Json") {
      return (
        <textarea
          value={editValue as string}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className={`${inputClass} resize-y min-h-[80px]`}
        />
      );
    }
    return (
      <input
        type="text"
        value={editValue as string}
        onChange={(e) => setEditValue(e.target.value)}
        placeholder={placeholder}
        autoFocus
        className={inputClass}
      />
    );
  })();

  return (
    <div className="w-full">
      {labelEl}
      <div className="flex items-center gap-2">
        <div className="flex-1">{inputEl}</div>
        {isEditing && (
          <CrudButton type="save" table={table} onClick={handleSave} loading={saving} />
        )}
      </div>
      {errorEl}
    </div>
  );
}
