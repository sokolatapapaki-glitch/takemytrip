"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CityFile, EditorActivity } from "@/lib/types";
import ActivityForm from "./ActivityForm";
import CreateModal from "./CreateModal";
import { btn } from "./ui";

const blank = (): EditorActivity => ({
  id: null, name: "Νέα δραστηριότητα", description: "", category: "attraction",
  prices: {}, notes: [], tags: [],
});

export default function ActivityList({ city, cityId }: { city: CityFile; cityId: string }) {
  const [acts, setActs] = useState<EditorActivity[]>(city.activities ?? []);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const active = acts.map((a, i) => ({ a, i })).filter((x) => x.a.archived !== true);
  const archived = acts.map((a, i) => ({ a, i })).filter((x) => x.a.archived === true);

  const patch = (i: number, a: EditorActivity) =>
    setActs(acts.map((x, j) => (j === i ? a : x)));
  const setArchived = (i: number, v: boolean) =>
    setActs(acts.map((x, j) => (j === i ? { ...x, archived: v } : x)));

  async function save() {
    setSaving(true); setStatus("Αποθήκευση…");
    const payload: CityFile = { ...city, activities: acts };
    const res = await fetch(`/api/city/${cityId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    setStatus(json.ok ? "✅ Αποθηκεύτηκε & έγινε regenerate"
                      : `⚠️ Αποθηκεύτηκε, αλλά ο generator απέτυχε:\n${json.generator}`);
  }

  const Row = ({ a, i }: { a: EditorActivity; i: number }) => (
    <li style={{ border: "1px solid var(--line)", borderRadius: 10, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10 }}>
        <button type="button" style={{ ...btn.underline, textDecoration: "none" }}
          onClick={() => setOpenIdx(openIdx === i ? null : i)}>
          {openIdx === i ? "▾" : "▸"} {a.name || "(χωρίς όνομα)"} <span style={{ color:"#9ca3af" }}>· {a.category}</span>
        </button>
        {a.archived
          ? <button type="button" style={btn.common} onClick={() => setArchived(i, false)}>Επαναφορά</button>
          : <button type="button" style={btn.danger} onClick={() => setArchived(i, true)}>Αρχειοθέτηση</button>}
      </div>
      {openIdx === i && (
        <div style={{ padding: "0 10px 10px" }}>
          <ActivityForm activity={a} onChange={(na) => patch(i, na)} />
        </div>
      )}
    </li>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>{city.city}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" style={btn.primary} onClick={() => setCreating(true)}>
            ✨ Δημιουργία με AI
          </button>
          <button type="button" style={btn.common}
            onClick={() => { setActs([...acts, blank()]); setOpenIdx(acts.length); }}>
            + Νέα
          </button>
          <button type="button" style={btn.secondary} disabled={saving} onClick={save}>
            Αποθήκευση
          </button>
        </div>
      </div>

      {creating && (
        <CreateModal
          currentCity={cityId}
          onClose={() => setCreating(false)}
          onSaved={() => router.refresh()}
        />
      )}
      {status && <pre style={{ whiteSpace: "pre-wrap", background: "#f9fafb", padding: 10, borderRadius: 8 }}>{status}</pre>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {active.map(({ a, i }) => <Row key={i} a={a} i={i} />)}
      </ul>

      {archived.length > 0 && (
        <details>
          <summary style={{ cursor: "pointer", margin: "10px 0", fontWeight: 700 }}>
            Αρχειοθετημένες ({archived.length})
          </summary>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {archived.map(({ a, i }) => <Row key={i} a={a} i={i} />)}
          </ul>
        </details>
      )}
    </div>
  );
}
