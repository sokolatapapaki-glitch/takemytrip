"use client";

export type CrudButtonType = "create" | "edit" | "save" | "delete";

type Props = {
  type: CrudButtonType;
  table: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

const styles: Record<CrudButtonType, string> = {
  create: "bg-green-600 text-white hover:bg-green-700",
  edit:   "text-blue-600 hover:text-blue-800 hover:underline",
  save:   "bg-blue-600 text-white hover:bg-blue-700",
  delete: "text-red-500 hover:text-red-700 hover:underline",
};

const labels: Record<CrudButtonType, string> = {
  create: "Create",
  edit:   "Edit",
  save:   "Save",
  delete: "Delete",
};

const loadingLabels: Record<CrudButtonType, string> = {
  create: "Creating...",
  edit:   "Edit",
  save:   "Saving...",
  delete: "Deleting...",
};

export default function CrudButton({ type, onClick, disabled, loading }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`text-xs px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${styles[type]}`}
    >
      {loading ? loadingLabels[type] : labels[type]}
    </button>
  );
}
