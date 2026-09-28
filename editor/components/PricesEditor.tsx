"use client";
import { btn } from "./ui";

// Prices are an age->euro map, keys "0".."19" plus "adult". Editor shows existing
// keys; a small control appends a missing age or the adult key.
export default function PricesEditor({
  value, onChange,
}: { value: Record<string, number>; onChange: (v: Record<string, number>) => void }) {
  const prices = value ?? {};
  const keys = Object.keys(prices);
  const set = (k: string, v: number) => onChange({ ...prices, [k]: v });
  const remove = (k: string) => {
    const next = { ...prices }; delete next[k]; onChange(next);
  };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 32px", gap: 6 }}>
        {keys.map((k) => (
          <div key={k} style={{ display: "contents" }}>
            <span style={{ alignSelf: "center", fontSize: 13 }}>{k}</span>
            <input type="number" step="0.01" value={prices[k]}
              onChange={(e) => set(k, Number(e.target.value))} />
            <button type="button" style={btn.danger} onClick={() => remove(k)}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <select id="price-key" defaultValue="adult" style={{ maxWidth: 120 }}>
          {["adult", ...Array.from({ length: 20 }, (_, i) => String(i))].map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <button type="button" style={btn.underline} onClick={() => {
          const sel = document.getElementById("price-key") as HTMLSelectElement;
          if (sel && !(sel.value in prices)) set(sel.value, 0);
        }}>+ Τιμή</button>
      </div>
    </div>
  );
}
