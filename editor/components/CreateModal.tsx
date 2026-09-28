"use client";
import { useEffect, useState } from "react";
import type { ActivityDraft } from "@/lib/n8n";
import DraftsReview, { type DraftItem } from "./DraftsReview";
import { btn } from "./ui";

type CityRow = { id: string; label: string };

// Full-screen modal: phase "input" collects a city + a list of activity names;
// phase "review" shows the n8n-generated drafts (editable) before saving each.
export default function CreateModal({
  currentCity, onClose, onSaved,
}: { currentCity: string; onClose: () => void; onSaved: () => void }) {
  const [cities, setCities] = useState<CityRow[]>([]);
  const [city, setCity] = useState(currentCity);
  const [names, setNames] = useState<string[]>([""]);
  const [phase, setPhase] = useState<"input" | "loading" | "review">("input");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cities").then((r) => r.json())
      .then((j) => setCities(j.cities ?? []))
      .catch(() => setCities([]));
  }, []);

  async function generate() {
    const wanted = names.map((n) => n.trim()).filter(Boolean);
    if (wanted.length === 0) { setError("Πρόσθεσε τουλάχιστον μία δραστηριότητα"); return; }
    setError(""); setPhase("loading");
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, names: wanted }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "generate failed");
      setItems((json.drafts ?? []).map((d: ActivityDraft) => ({ city, draft: d })));
      setPhase("review");
    } catch (e) {
      setError(String((e as Error).message || e));
      setPhase("input");
    }
  }

  const shell: React.CSSProperties = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex",
    alignItems: "flex-start", justifyContent: "center", padding: 20, overflow: "auto", zIndex: 50,
  };
  const card: React.CSSProperties = {
    background: "#fff", borderRadius: 14, padding: 20, width: "min(820px, 100%)",
    boxShadow: "0 20px 60px rgba(0,0,0,.25)",
  };

  return (
    <div style={shell} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Δημιουργία δραστηριοτήτων με AI</h2>
          <button type="button" style={btn.common} onClick={onClose}>Κλείσιμο</button>
        </div>
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

        {phase === "input" && (
          <div>
            <label>Πόλη</label>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>

            <label>Δραστηριότητες (μία ανά γραμμή· το n8n διορθώνει το όνομα)</label>
            {names.map((n, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input value={n} placeholder="π.χ. Colosseum"
                  onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))} />
                <button type="button" style={btn.danger}
                  onClick={() => setNames(names.length > 1 ? names.filter((_, j) => j !== i) : [""])}>✕</button>
              </div>
            ))}
            <button type="button" style={btn.underline} onClick={() => setNames([...names, ""])}>
              + Δραστηριότητα
            </button>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button type="button" style={btn.primary} onClick={generate}>Δημιουργία</button>
            </div>
          </div>
        )}

        {phase === "loading" && (
          <p style={{ padding: "30px 0", textAlign: "center" }}>
            ⏳ Το n8n ερευνά τις δραστηριότητες… (μπορεί να πάρει έως 1–2′ ανά δραστηριότητα)
          </p>
        )}

        {phase === "review" && (
          <DraftsReview
            items={items}
            onChange={setItems}
            cityLabel={(id) => cities.find((c) => c.id === id)?.label ?? id}
            onAllSaved={() => { onSaved(); onClose(); }}
          />
        )}
      </div>
    </div>
  );
}
