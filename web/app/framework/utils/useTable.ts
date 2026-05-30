"use client";

import { useEffect, useRef } from "react";
import { readRecords, deleteRecords, updateRecords, type CrudState } from "./crud";
import { useApp, type LoadingInfo } from "@/framework/ui/context/AppContext";
import { useAlert } from "@/framework/ui/useAlert";

type WithId = { id: number | string };

export function useTable<T extends WithId>(model: string, filter?: object, select?: object) {
  const { tableRecords, setTableRecords, updateTableRecords, tableLoadings, setTableLoading, tableDeletingId, setTableDeletingId, prismaFields } = useApp();
  const { showAlert } = useAlert();
  const tableRecordsRef = useRef(tableRecords);
  tableRecordsRef.current = tableRecords;

  const key = model.charAt(0).toLowerCase() + model.slice(1);

  const records = (tableRecords[key] ?? []) as T[];
  const recordsRef = useRef(records);
  recordsRef.current = records;
  const loading: LoadingInfo = tableLoadings[key] ?? {
    model: key,
    operation: "read",
    status: "idle",
    startedAt: 0,
    durationMs: null,
  };

  const syncLoading = (info: LoadingInfo) => setTableLoading(key, info);

  useEffect(() => {
    const status = tableLoadings[key]?.status;
    if (status === "loading" || status === "loaded" || status === "failed") return;
    readRecords<T>(model, filter, select, (s) => {
      syncLoading(s.loading);
      if (s.result) setTableRecords(key, s.result);
    });
  }, [key, filter, select]);

  const append = (item: T) => {
    updateTableRecords(key, (prev) => [...prev, item]);

    const relationFields = (prismaFields[key] ?? []).filter((f) => f.kind !== "scalar");
    for (const f of relationFields) {
      if (f.relationFromFields?.length > 0) continue;
      const nested = (item as any)[f.name];
      if (!nested) continue;
      const childKey = (f.type as string)[0].toLowerCase() + (f.type as string).slice(1);
      const childArr: any[] = Array.isArray(nested) ? nested : [nested];
      if (childArr.length > 0)
        updateTableRecords(childKey, (prev) => [...prev, ...childArr]);
    }

    showAlert("Success", `${model} created`);
  };

  const remove = async (id: number | string) => {
    setTableDeletingId(key, id, true);
    await deleteRecords<T>(model, { id }, (s) => {
      syncLoading(s.loading);
      if (s.loading.status === "loaded") {
        updateTableRecords(key, (prev) => prev.filter((item) => item.id !== id));

        const relationFields = (prismaFields[key] ?? []).filter((f) => f.kind !== "scalar");
        for (const f of relationFields) {
          const childKey = (f.type as string)[0].toLowerCase() + (f.type as string).slice(1);
          const childFields = prismaFields[childKey] ?? [];
          const backRef = childFields.find(
            (cf) => cf.kind !== "scalar" &&
              (cf.type as string).toLowerCase() === key.toLowerCase() &&
              cf.relationFromFields?.length > 0
          );
          const fkField = backRef?.relationFromFields?.[0];
          if (fkField) {
            updateTableRecords(childKey, (prev) => prev.filter((child) => child[fkField] !== id));
          }
        }
        showAlert("Success", `${model} deleted`);
      } else if (s.loading.status === "failed") {
        showAlert("Error", `Failed to delete ${model}`);
      }
      if (s.loading.status === "loaded" || s.loading.status === "failed")
        setTableDeletingId(key, id, false);
    });
  };

  const update = async (id: number | string, data: object) => {
    await updateRecords<T>(model, { id }, data, (s) => {
      syncLoading(s.loading);
      if (s.loading.status === "loaded") {
        updateTableRecords(key, (prev) => prev.map((item) => item.id === id ? { ...item, ...data } as T : item));
        showAlert("Success", `${model} updated`);
      } else if (s.loading.status === "failed") {
        showAlert("Error", `Failed to update ${model}`);
      }
    });
  };

  const findManyToManyField = (relationField: string) => {
    const field = (prismaFields[key] ?? []).find((f) => f.name === relationField);
    if (!field || field.relationType !== "manyToMany") return null;
    const otherType = field.type as string;
    const otherKey = otherType[0].toLowerCase() + otherType.slice(1);
    const backField = (prismaFields[otherKey] ?? []).find(
      (f) => f.relationType === "manyToMany" &&
        (f.type as string).toLowerCase() === model.toLowerCase()
    );
    return { field, otherKey, backField };
  };

  const connect = async (relationField: string, thisId: number | string, otherId: number | string) => {
    const meta = findManyToManyField(relationField);
    if (!meta) return;
    const { otherKey, backField } = meta;

    const otherRecord = (tableRecordsRef.current[otherKey] ?? []).find((r: any) => r.id === otherId);
    const thisRecord = recordsRef.current.find((r: any) => r.id === thisId);

    try {
      const res = await fetch(`/api/${key}/relate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          where: { id: thisId },
          field: relationField,
          action: "connect",
          targetId: otherId,
        }),
      });
      if (!res.ok) return;
    } catch {
      return;
    }

    if (otherRecord) {
      updateTableRecords(key, (prev) =>
        prev.map((item: any) => {
          if (item.id !== thisId) return item;
          const arr = (item[relationField] ?? []) as any[];
          if (arr.some((r) => r.id === otherId)) return item;
          return { ...item, [relationField]: [...arr, otherRecord] };
        })
      );
    }

    if (backField && thisRecord) {
      updateTableRecords(otherKey, (prev) =>
        prev.map((item: any) => {
          if (item.id !== otherId) return item;
          const arr = (item[backField.name] ?? []) as any[];
          if (arr.some((r) => r.id === thisId)) return item;
          return { ...item, [backField.name]: [...arr, thisRecord] };
        })
      );
    }
  };

  const disconnect = async (relationField: string, thisId: number | string, otherId: number | string) => {
    const meta = findManyToManyField(relationField);
    if (!meta) return;
    const { otherKey, backField } = meta;

    try {
      const res = await fetch(`/api/${key}/relate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          where: { id: thisId },
          field: relationField,
          action: "disconnect",
          targetId: otherId,
        }),
      });
      if (!res.ok) return;
    } catch {
      return;
    }

    updateTableRecords(key, (prev) =>
      prev.map((item: any) => {
        if (item.id !== thisId) return item;
        const arr = (item[relationField] ?? []) as any[];
        return { ...item, [relationField]: arr.filter((r) => r.id !== otherId) };
      })
    );

    if (backField) {
      updateTableRecords(otherKey, (prev) =>
        prev.map((item: any) => {
          if (item.id !== otherId) return item;
          const arr = (item[backField.name] ?? []) as any[];
          return { ...item, [backField.name]: arr.filter((r) => r.id !== thisId) };
        })
      );
    }
  };

  const isDeletingId = (id: number | string) => (tableDeletingId[key] ?? []).includes(id);

  const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reorder = (fromIndex: number, toIndex: number) => {
    updateTableRecords(key, (prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });

    if (reorderTimerRef.current != null) clearTimeout(reorderTimerRef.current);
    reorderTimerRef.current = setTimeout(() => {
      const ids = recordsRef.current.map((r) => r.id);
      fetch(`/api/${key}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }).catch(() => {});
    }, 400);
  };

  const state: CrudState<T[]> = { result: records, loading };

  return { state, records, loading, append, remove, update, isDeletingId, reorder, connect, disconnect };
}
