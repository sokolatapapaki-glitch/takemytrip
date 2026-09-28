"use client";
import type { Vibes } from "@/lib/types";

// The planner's four vibe scores (0–10), same labels it uses. Checkbox off =
// "derive from the category" (onChange(undefined)) — the generator's category
// presets decide, exactly as for an activity that never set them.
const KEYS: { key: keyof Vibes; label: string }[] = [
  { key: "cultural", label: "Πολιτισμός" },
  { key: "foodie", label: "Φαγητό" },
  { key: "adventurous", label: "Περιπέτεια" },
  { key: "relaxing", label: "Χαλάρωση" },
];
const NEUTRAL: Vibes = { cultural: 5, foodie: 5, adventurous: 5, relaxing: 5 };

export default function VibesEditor({
  value, onChange,
}: { value: Vibes | undefined; onChange: (v: Vibes | undefined) => void }) {
  const on = value != null;
  return (
    <div>
      <label style={{ margin: 0, display: "flex", gap: 6, alignItems: "center" }}>
        <input type="checkbox" style={{ width: "auto" }} checked={on}
          onChange={(e) => onChange(e.target.checked ? { ...NEUTRAL } : undefined)} />
        Ορισμός vibes {!on && <span style={{ color: "#6b7280", fontWeight: 400 }}>(αλλιώς από τον τύπο)</span>}
      </label>
      {on && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 8 }}>
          {KEYS.map(({ key, label }) => (
            <div key={key}>
              <label style={{ margin: 0, fontWeight: 400 }}>{label}</label>
              <input type="number" min={0} max={10} value={value![key]}
                onChange={(e) => onChange({ ...value!, [key]: Number(e.target.value) })} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
