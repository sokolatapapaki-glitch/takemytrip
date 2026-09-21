// The set of mutation helpers the editor pieces share, built on top of the
// filter store's setter. Keeps the leaf components free of update plumbing.
import { defaultParamsFor } from "@/app/components/ActivityCombinations/core/curves.data";
import { type EditableFilter } from "@/app/components/ActivityCombinations/core/filterStore.functions";

type SetEdits = (
  next: EditableFilter[] | ((prev: EditableFilter[]) => EditableFilter[])
) => void;

export type EditorActions = {
  patchFilter: (fi: number, patch: Partial<EditableFilter>) => void;
  changeScore: (fi: number, scoreName: string) => void;
  applyPreset: (fi: number, scoreName: string, params: Record<string, number>) => void;
  setParam: (fi: number, key: string, value: number) => void;
  patchOption: (
    fi: number,
    oi: number,
    patch: Partial<{ name: string; target: number }>
  ) => void;
  addOption: (fi: number) => void;
  removeOption: (fi: number, oi: number) => void;
};

export function makeEditorActions(setEdits: SetEdits): EditorActions {
  const patchFilter: EditorActions["patchFilter"] = (fi, patch) =>
    setEdits((prev) => prev.map((f, i) => (i === fi ? { ...f, ...patch } : f)));

  return {
    patchFilter,
    changeScore: (fi, scoreName) =>
      patchFilter(fi, { scoreName, params: defaultParamsFor(scoreName) }),
    applyPreset: (fi, scoreName, params) =>
      patchFilter(fi, { scoreName, params: { ...params } }),
    setParam: (fi, key, value) =>
      setEdits((prev) =>
        prev.map((f, i) =>
          i === fi ? { ...f, params: { ...f.params, [key]: value } } : f
        )
      ),
    patchOption: (fi, oi, patch) =>
      setEdits((prev) =>
        prev.map((f, i) =>
          i === fi
            ? {
                ...f,
                options: f.options.map((o, j) =>
                  j === oi ? { ...o, ...patch } : o
                ),
              }
            : f
        )
      ),
    addOption: (fi) =>
      setEdits((prev) =>
        prev.map((f, i) =>
          i === fi
            ? { ...f, options: [...f.options, { name: "New option", target: 5 }] }
            : f
        )
      ),
    removeOption: (fi, oi) =>
      setEdits((prev) =>
        prev.map((f, i) =>
          i === fi ? { ...f, options: f.options.filter((_, j) => j !== oi) } : f
        )
      ),
  };
}
