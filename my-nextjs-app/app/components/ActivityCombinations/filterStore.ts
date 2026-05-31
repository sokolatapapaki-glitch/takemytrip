"use client";

// -----------------------------------------------------------------------------
// Editable filter store (persisted to localStorage, shared across routes)
// -----------------------------------------------------------------------------
// Only the SERIALIZABLE fields of a filter are editable. The functions
// (value/format/multi/per-option value) stay code-bound in DEFAULT_FILTERS and
// are merged back in by index when we rebuild the runtime filters.
//
// localStorage is an external store shared by both routes, so we expose it via
// useSyncExternalStore — the right tool for client-only state that must survive
// navigation and stay in sync between the editor and the results page.
import { useSyncExternalStore } from "react";
import { DEFAULT_FILTERS, type Filter, type Unit } from "./filters";
import { type Params } from "./curves";

export type EditableOption = { name: string; target: number };

export type EditableFilter = {
  name: string;
  weight: number;
  scoreName: string;
  params: Params;
  hint: string;
  options: EditableOption[];
};

// Whether a filter is multi-select — read from the code-bound default.
export function isMulti(filterIndex: number): boolean {
  return !!DEFAULT_FILTERS[filterIndex]?.multi;
}

// A filter's real-world unit (hours/euros), if any — code-bound, for the editor.
export function filterUnit(filterIndex: number): Unit | undefined {
  return DEFAULT_FILTERS[filterIndex]?.unit;
}

// Clone the serializable parts of the built-in defaults.
export const DEFAULT_EDITS: EditableFilter[] = DEFAULT_FILTERS.map((f) => ({
  name: f.name,
  weight: f.weight,
  scoreName: f.scoreName,
  params: { ...f.params },
  hint: f.hint ?? "",
  options: f.options.map((o) => ({ name: o.name, target: o.target })),
}));

// Merge the edits back onto the code-bound defaults -> runtime filters.
// Option `value` bindings are carried over by index from the default options.
export function toEffective(edits: EditableFilter[]): Filter[] {
  return edits.map((e, fi) => {
    const base = DEFAULT_FILTERS[fi];
    return {
      ...base,
      name: e.name,
      weight: e.weight,
      scoreName: e.scoreName,
      params: e.params,
      hint: e.hint,
      options: e.options.map((o, oi) => ({
        ...base.options[oi], // keep the per-option value binding when present
        name: o.name,
        target: o.target,
      })),
    };
  });
}

// ---- the external store ------------------------------------------------------
const STORAGE_KEY = "activityFilterEdits-v2";

function load(): EditableFilter[] {
  if (typeof window === "undefined") return DEFAULT_EDITS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_EDITS;
    const parsed = JSON.parse(raw) as EditableFilter[];
    // Ignore stale data that no longer lines up with the current filter set.
    if (!Array.isArray(parsed) || parsed.length !== DEFAULT_FILTERS.length) {
      return DEFAULT_EDITS;
    }
    return parsed;
  } catch {
    return DEFAULT_EDITS;
  }
}

let current: EditableFilter[] | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): EditableFilter[] {
  if (current === null) current = load();
  return current;
}

function getServerSnapshot(): EditableFilter[] {
  return DEFAULT_EDITS;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

type Updater = EditableFilter[] | ((prev: EditableFilter[]) => EditableFilter[]);

function setEdits(next: Updater): void {
  const value = typeof next === "function" ? next(getSnapshot()) : next;
  current = value;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // ignore quota / serialization errors
    }
  }
  listeners.forEach((l) => l());
}

// Hook: returns the current edits and a setter (value or updater function).
export function useFilterEdits(): [EditableFilter[], (next: Updater) => void] {
  const edits = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [edits, setEdits];
}
