// -----------------------------------------------------------------------------
// Editable filter defaults (the data)
// -----------------------------------------------------------------------------
// DEFAULT_EDITS is the serializable clone of the built-in DEFAULT_FILTERS used
// to seed the editor store. The store logic + types live in
// filterStore.functions.
import { DEFAULT_FILTERS } from "./filters.data";
import type { EditableFilter } from "./filterStore.functions";

// Clone the serializable parts of the built-in defaults.
export const DEFAULT_EDITS: EditableFilter[] = DEFAULT_FILTERS.map((f) => ({
  name: f.name,
  weight: f.weight,
  scoreName: f.scoreName,
  params: { ...f.params },
  hint: f.hint ?? "",
  options: f.options.map((o) => ({ name: o.name, target: o.target })),
}));
