import type { LoadingInfo } from "@/framework/ui/context/AppContext";

type Operation = LoadingInfo["operation"];

export type CrudState<T> = {
  result: T | undefined;
  loading: LoadingInfo;
};

async function request(url: string, method: string, body?: object) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function makeLoading(model: string, operation: Operation, startedAt: number, status: LoadingInfo["status"]): LoadingInfo {
  return { model, operation, status, startedAt, durationMs: status === "loading" ? null : Date.now() - startedAt };
}

export async function createRecord<T>(
  model: string,
  data: object,
  setState: (state: CrudState<T>) => void,
  check?: () => boolean,
): Promise<void> {
  const startedAt = Date.now();
  if (check && !check()) {
    setState({ result: undefined, loading: makeLoading(model, "create", startedAt, "idle") });
    return;
  }
  setState({ result: undefined, loading: makeLoading(model, "create", startedAt, "loading") });
  try {
    const result = await request(`/api/${model}/create`, "POST", data);
    setState({ result, loading: makeLoading(model, "create", startedAt, "loaded") });
  } catch {
    setState({ result: undefined, loading: makeLoading(model, "create", startedAt, "failed") });
  }
}

export async function readRecords<T>(
  model: string,
  where?: object,
  select?: object,
  setState?: (state: CrudState<T[]>) => void,
  check?: () => boolean,
): Promise<void> {
  const startedAt = Date.now();
  if (check && !check()) {
    setState?.({ result: undefined, loading: makeLoading(model, "read", startedAt, "idle") });
    return;
  }
  setState?.({ result: undefined, loading: makeLoading(model, "read", startedAt, "loading") });
  try {
    const result = await request(`/api/${model}/read`, "POST", { where, select });
    setState?.({ result, loading: makeLoading(model, "read", startedAt, "loaded") });
  } catch {
    setState?.({ result: undefined, loading: makeLoading(model, "read", startedAt, "failed") });
  }
}

export async function updateRecords<T>(
  model: string,
  where: object,
  data: object,
  setState: (state: CrudState<T>) => void,
  check?: () => boolean,
): Promise<void> {
  const startedAt = Date.now();
  if (check && !check()) {
    setState({ result: undefined, loading: makeLoading(model, "update", startedAt, "idle") });
    return;
  }
  setState({ result: undefined, loading: makeLoading(model, "update", startedAt, "loading") });
  try {
    const result = await request(`/api/${model}/update`, "PATCH", { where, data });
    setState({ result, loading: makeLoading(model, "update", startedAt, "loaded") });
  } catch {
    setState({ result: undefined, loading: makeLoading(model, "update", startedAt, "failed") });
  }
}

export async function deleteRecords<T>(
  model: string,
  where: object,
  setState: (state: CrudState<T>) => void,
  check?: () => boolean,
): Promise<void> {
  const startedAt = Date.now();
  if (check && !check()) {
    setState({ result: undefined, loading: makeLoading(model, "delete", startedAt, "idle") });
    return;
  }
  setState({ result: undefined, loading: makeLoading(model, "delete", startedAt, "loading") });
  try {
    const result = await request(`/api/${model}/delete`, "DELETE", { where });
    setState({ result, loading: makeLoading(model, "delete", startedAt, "loaded") });
  } catch {
    setState({ result: undefined, loading: makeLoading(model, "delete", startedAt, "failed") });
  }
}
