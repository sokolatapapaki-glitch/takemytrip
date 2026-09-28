"use client";
import { useState } from "react";
import type { EditorActivity } from "@/lib/types";
import type { ActivityDraft } from "@/lib/n8n";
import ActivityForm from "./ActivityForm";
import { btn } from "./ui";

export type DraftItem = { city: string; draft: ActivityDraft };

// Reusable draft reviewer. Each item carries its OWN city, so a batch can span many
// cities; Save appends each draft to its city's JSON. Reused by CreateModal and BatchConsole.
export default function DraftsReview({
  items, onChange, onAllSaved, cityLabel,
}: {
  items: DraftItem[];
  onChange: (items: DraftItem[]) => void;
  onAllSaved: () => void;
  cityLabel?: (id: string) => string;
}) {
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState("");

  const patch = (i: number, a: EditorActivity) =>
    onChange(items.map((it, j) => (j === i ? { ...it, draft: { ...it.draft, ...a } } : it)));

  async function saveOne(i: number): Promise<boolean> {
    const { city, draft } = items[i];
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(draft)) if (!k.startsWith("__")) clean[k] = v;
    const res = await fetch(`/api/city/${city}/append`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean),
    });
    const json = await res.json().catch(() => ({}));
    if (json.ok || json.id) {
      setSaved((s) => new Set([...s, i]));
      setStatus(json.ok ? "✅ Αποθηκεύτηκε" : `⚠️ Αποθηκεύτηκε, generator: ${json.generator}`);
      return true;
    }
    setStatus(`⚠️ Σφάλμα: ${json.error || "unknown"}`);
    return false;
  }

  async function saveAll() {
    for (let i = 0; i < items.length; i++) if (!saved.has(i)) await saveOne(i);
    onAllSaved();
  }

  return (
    <div>
      <p style={{ color: "#6b7280", fontSize: 13 }}>
        Έλεγξε/διόρθωσε κάθε πρόχειρο και πάτησε Αποθήκευση. Οι τιμές/tags/εστιατόρια
        δεν συμπληρώνονται αυτόματα. Οι προτεινόμενες εικόνες ξεκινούν μη επιλεγμένες:
        κράτα μόνο όσες δείχνουν σίγουρα το σωστό μέρος.
      </p>
      {status && <pre style={{ whiteSpace: "pre-wrap", background: "#f9fafb", padding: 8, borderRadius: 8 }}>{status}</pre>}

      {items.map(({ city, draft: d }, i) => (
        <div key={i} style={{
          border: "1px solid var(--line)", borderRadius: 10, padding: 12, marginBottom: 12,
          opacity: saved.has(i) ? 0.55 : 1,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13 }}>
              <span style={{ background: "#eef2ff", color: "#3730a3", borderRadius: 6,
                             padding: "1px 6px", marginRight: 8, fontWeight: 700 }}>
                {cityLabel ? cityLabel(city) : city}
              </span>
              {d.__notFound
                ? <span style={{ color: "#b45309" }}>⚠️ Δεν βρέθηκε στο Google Places — έλεγξε το όνομα</span>
                : d.__requested !== d.name
                  ? <span style={{ color: "#6b7280" }}>Ζήτησες: «{d.__requested}» → <b>«{d.name}»</b></span>
                  : <span style={{ color: "#6b7280" }}>«{d.name}»</span>}
            </div>
            <button type="button" style={btn.secondary} disabled={saved.has(i)} onClick={() => saveOne(i)}>
              {saved.has(i) ? "Αποθηκεύτηκε" : "Αποθήκευση"}
            </button>
          </div>
          <ActivityForm activity={d} imageCandidates={d.__imageCandidates}
            onChange={(a) => patch(i, a)} />
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button type="button" style={btn.primary} onClick={saveAll}>Αποθήκευση όλων</button>
      </div>
    </div>
  );
}
