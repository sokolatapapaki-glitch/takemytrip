"use client";

import React from "react";
import { useTable } from "@/framework/utils/useTable";

type Props = {
  table: string;
  id: number | string;
  relationField: string;
  otherTable: string;
  renderLabel: (item: any) => React.ReactNode;
  emptyMessage?: string;
};

export default function RelationLinker({
  table,
  id,
  relationField,
  otherTable,
  renderLabel,
  emptyMessage = "No records",
}: Props) {
  const sourceData = useTable<{ id: number | string } & Record<string, any>>(table);
  const otherData = useTable<{ id: number | string } & Record<string, any>>(otherTable);

  const sourceRecord = sourceData.records.find((r) => r.id === id);
  const linkedIds = new Set<number | string>(
    (((sourceRecord?.[relationField]) ?? []) as { id: number | string }[]).map((m) => m.id)
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md min-w-[200px]">
      <ul className="py-1 text-sm text-gray-700 max-h-60 overflow-y-auto">
        {otherData.records.length === 0 && (
          <li className="px-3 py-1.5 text-gray-400">{emptyMessage}</li>
        )}
        {otherData.records.map((item) => {
          const linked = linkedIds.has(item.id);
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
              <span className="truncate">{renderLabel(item)}</span>
              <button
                type="button"
                onClick={() =>
                  linked
                    ? sourceData.disconnect(relationField, id, item.id)
                    : sourceData.connect(relationField, id, item.id)
                }
                className={`text-xs px-2 py-1 rounded ${linked ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
              >
                {linked ? "Unlink" : "Link"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
