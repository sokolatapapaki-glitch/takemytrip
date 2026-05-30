import type { Dispatch, SetStateAction } from "react";

type WithId = { id: number | string };
type Operation = "create" | "read" | "update" | "delete";

export function applyOperation<T extends WithId>(
  operation: Operation,
  setState: Dispatch<SetStateAction<T[]>>,
  payload: T | T[] | Pick<T, "id">
) {
  switch (operation) {
    case "create":
      setState((prev) => [...prev, payload as T]);
      break;

    case "read":
      setState(payload as T[]);
      break;

    case "update":
      setState((prev) =>
        prev.map((item) =>
          item.id === (payload as WithId).id ? { ...item, ...(payload as Partial<T>) } : item
        )
      );
      break;

    case "delete":
      setState((prev) => prev.filter((item) => item.id !== (payload as WithId).id));
      break;
  }
}
