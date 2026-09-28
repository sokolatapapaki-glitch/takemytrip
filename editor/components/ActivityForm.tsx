"use client";
import type { EditorActivity, EditorImage } from "@/lib/types";
import NotesEditor from "./NotesEditor";
import PricesEditor from "./PricesEditor";
import OpeningHoursEditor from "./OpeningHoursEditor";
import RestaurantEditor from "./RestaurantEditor";
import ImagesEditor from "./ImagesEditor";
import VibesEditor from "./VibesEditor";

const CATEGORIES = [
  "museum","gallery","castle","palace","church","cathedral","monument","landmark",
  "ruins","tower","park","garden","viewpoint","neighborhood","beach","zoo","aquarium",
  "themepark","attraction","market","restaurant","cafe","theater","show","tour","walk",
  "cruise","boat","shopping",
];

// `imageCandidates`: suggested images (e.g. from the n8n workflow) shown unticked
// next to the saved ones — only the ones ticked are saved.
export default function ActivityForm({
  activity, onChange, imageCandidates,
}: {
  activity: EditorActivity;
  onChange: (a: EditorActivity) => void;
  imageCandidates?: EditorImage[];
}) {
  const set = (patch: Partial<EditorActivity>) => onChange({ ...activity, ...patch });
  return (
    <div>
      <label>Όνομα</label>
      <input value={activity.name} onChange={(e) => set({ name: e.target.value })} />

      <label>Περιγραφή</label>
      <textarea rows={4} value={activity.description}
        onChange={(e) => set({ description: e.target.value })} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <label>Τύπος</label>
          <select value={activity.category} onChange={(e) => set({ category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Προτεραιότητα (0–10)</label>
          <input type="number" min={0} max={10}
            value={activity.priority ?? ""} placeholder="auto (από τύπο)"
            onChange={(e) =>
              set({ priority: e.target.value === "" ? undefined : Number(e.target.value) })} />
        </div>
        <div>
          <label>Διάρκεια (ώρες)</label>
          <input type="number" step="0.5" value={activity.duration_hours ?? ""}
            onChange={(e) =>
              set({ duration_hours: e.target.value === "" ? undefined : Number(e.target.value) })} />
        </div>
      </div>

      <label>Ωράριο</label>
      <OpeningHoursEditor value={activity.opening_hours}
        onChange={(v) => set({ opening_hours: v })} />

      <label>Vibes</label>
      <VibesEditor value={activity.vibes} onChange={(v) => set({ vibes: v })} />

      <label>Ιστότοπος</label>
      <input value={activity.website ?? ""} onChange={(e) => set({ website: e.target.value })} />

      <label>Tags (κόμμα)</label>
      <input value={(activity.tags ?? []).join(", ")}
        onChange={(e) => set({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />

      <label>Εικόνες</label>
      <ImagesEditor value={activity.images} candidates={imageCandidates}
        onChange={(v) => set({ images: v })} />

      <label>Τιμές ανά ηλικία</label>
      <PricesEditor value={activity.prices ?? {}} onChange={(v) => set({ prices: v })} />

      <label>Σημειώσεις</label>
      <NotesEditor value={activity.notes ?? []} onChange={(v) => set({ notes: v })} />

      <label>Εστιατόριο / Καφέ</label>
      <RestaurantEditor label="Εστιατόριο" value={activity.restaurant}
        onChange={(v) => set({ restaurant: v })} />
      <RestaurantEditor label="Καφέ" value={activity.cafe}
        onChange={(v) => set({ cafe: v })} />
    </div>
  );
}
