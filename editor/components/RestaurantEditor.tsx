"use client";
import type { Restaurant } from "@/lib/types";
import { btn } from "./ui";

export default function RestaurantEditor({
  label, value, onChange,
}: { label: string; value: Restaurant | null | undefined;
     onChange: (v: Restaurant | null) => void }) {
  if (value == null) {
    return (
      <button type="button" style={btn.underline}
        onClick={() => onChange({ name: "", description: "", map_url: "" })}>
        + {label}
      </button>
    );
  }
  const set = (patch: Partial<Restaurant>) => onChange({ ...value, ...patch });
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{label}</strong>
        <button type="button" style={btn.danger} onClick={() => onChange(null)}>Αφαίρεση</button>
      </div>
      <label>Όνομα</label>
      <input value={value.name} onChange={(e) => set({ name: e.target.value })} />
      <label>Περιγραφή</label>
      <textarea rows={2} value={value.description}
        onChange={(e) => set({ description: e.target.value })} />
      <label>Map URL</label>
      <input value={value.map_url ?? ""} onChange={(e) => set({ map_url: e.target.value })} />
    </div>
  );
}
