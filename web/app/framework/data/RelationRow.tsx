"use client";

import React from "react";
import { useTable } from "@/framework/utils/useTable";
import { useAbsoluteModal } from "@/framework/ui/context/AppContext";
import EditInput from "@/framework/data/EditInput";
import CrudButton from "@/framework/data/buttons/CrudButton";
import RelationLinker from "@/framework/data/buttons/RelationLinker";

type WithId = { id: number | string };

type Props<T extends WithId, R extends WithId = WithId> = {
  record: T;
  table: string;
  labelField: keyof T & string;
  otherTable: string;
  relationField: string;
  renderRelationLabel: (item: R) => React.ReactNode;
  emptyMessage?: string;
};

export default function RelationRow<T extends WithId, R extends WithId = WithId>({
  record,
  table,
  labelField,
  otherTable,
  relationField,
  renderRelationLabel,
  emptyMessage,
}: Props<T, R>) {
  const data = useTable<T>(table);
  const linkModal = useAbsoluteModal();
  const bag = record as unknown as Record<string, unknown>;
  const linked = (bag[relationField] as R[] | undefined) ?? [];
  const labelValue = (bag[labelField] as string | number | boolean | undefined) ?? "";

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-3 flex items-center gap-6">
      <EditInput
        value={labelValue}
        table={table}
        field={labelField}
        id={record.id}
        update={(d) => data.update(record.id, d)}
      />
      <button
        {...linkModal.triggerProps}
        type="button"
        onClick={() =>
          linkModal.toggle({
            side: "bottom",
            align: "end",
            component: (
              <RelationLinker
                table={table}
                otherTable={otherTable}
                id={record.id}
                relationField={relationField}
                renderLabel={renderRelationLabel}
                emptyMessage={emptyMessage}
              />
            ),
          })
        }
        className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
      >
        Links ({linked.length})
      </button>
      <CrudButton
        type="delete"
        table={table}
        loading={data.isDeletingId(record.id)}
        onClick={() => data.remove(record.id)}
      />
    </div>
  );
}
