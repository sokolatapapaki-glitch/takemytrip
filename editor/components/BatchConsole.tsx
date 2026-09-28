"use client";
import { useEffect, useMemo, useState } from "react";
import type { ActivityDraft } from "@/lib/n8n";
import type { DraftItem } from "./DraftsReview";
import DraftsReview from "./DraftsReview";
import { DEFAULT_BATCH, NEW_CITY_ID, NEW_CITY_HEADER } from "@/lib/batchSeed";
import { btn } from "./ui";

type Row = {
  city: string; name: string;
  status: "pending" | "running" | "done" | "skip" | "notfound" | "error";
  msg?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Normalize a name for fuzzy dedup: lowercase, strip accents + punctuation.
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9α-ω]+/gi, " ").trim();

// Existing "Ζωολογικός Κήπος (Zoo Praha)" should match seed "Zoo Praha", and
// "Museum für Naturkunde (…)" should match "Museum für Naturkunde". So treat it as
// a duplicate when one normalized name contains the other (min 4 chars to avoid
// matching tiny tokens).
function isDuplicate(seedName: string, existing: Iterable<string>): boolean {
  const s = norm(seedName);
  if (s.length < 4) return false;
  for (const e of existing) {
    const en = norm(e);
    if (en.length < 4) continue;
    if (en.includes(s) || s.includes(en)) return true;
  }
  return false;
}
const STATUS_ICON: Record<Row["status"], string> = {
  pending: "•", running: "⏳", done: "✓", skip: "↷", notfound: "⚠", error: "✕",
};

export default function BatchConsole() {
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [text, setText] = useState(
    DEFAULT_BATCH.map((r) => `${r.city} | ${r.name}`).join("\n")
  );
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [phase, setPhase] = useState<"setup" | "running" | "review">("setup");

  useEffect(() => { void refreshCities(); }, []);
  async function refreshCities() {
    try {
      const j = await (await fetch("/api/cities")).json();
      const lbl: Record<string, string> = {};
      const set = new Set<string>();
      for (const c of j.cities ?? []) { lbl[c.id] = c.label; set.add(c.id); }
      setLabels(lbl); setKnown(set);
    } catch { /* ignore */ }
  }

  const parsed = useMemo(() =>
    text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const i = l.indexOf("|");
      const city = (i >= 0 ? l.slice(0, i) : "").trim().toLowerCase();
      const name = (i >= 0 ? l.slice(i + 1) : l).trim();
      return { city, name };
    }).filter((r) => r.city && r.name), [text]);

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function run() {
    setRunning(true); setPhase("running"); setItems([]);
    const init: Row[] = parsed.map((r) => ({ ...r, status: "pending" }));
    setRows(init);

    const existing = new Set(known);
    const nameCache = new Map<string, Set<string>>(); // city -> existing activity names (raw)
    const collected: DraftItem[] = [];

    async function cityNames(city: string): Promise<Set<string>> {
      if (nameCache.has(city)) return nameCache.get(city)!;
      const set = new Set<string>();
      try {
        const c = await (await fetch(`/api/city/${city}`)).json();
        for (const a of c.activities ?? []) if (a?.name) set.add(String(a.name));
      } catch { /* new/empty city */ }
      nameCache.set(city, set);
      return set;
    }

    for (let i = 0; i < parsed.length; i++) {
      const { city, name } = parsed[i];
      setRow(i, { status: "running" });

      // Ensure the city exists (auto-create only the known new city).
      if (!existing.has(city)) {
        if (city === NEW_CITY_ID) {
          const res = await fetch("/api/city/new", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: NEW_CITY_ID, header: NEW_CITY_HEADER }),
          });
          const j = await res.json().catch(() => ({}));
          if (!j.ok) { setRow(i, { status: "error", msg: `create city: ${j.error || "failed"}` }); continue; }
          existing.add(city); await refreshCities();
        } else {
          setRow(i, { status: "error", msg: "άγνωστη πόλη (δημιούργησέ την πρώτα)" });
          continue;
        }
      }

      // Dedup (fuzzy: catches Greek/variant existing names).
      const names = await cityNames(city);
      if (isDuplicate(name, names)) { setRow(i, { status: "skip", msg: "υπάρχει ήδη" }); continue; }

      // Generate (single item -> sequential, no timeout).
      try {
        const res = await fetch("/api/generate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city, names: [name] }),
        });
        const j = await res.json();
        const draft: ActivityDraft | undefined = (j.drafts ?? [])[0];
        if (!draft) { setRow(i, { status: "error", msg: "no draft" }); continue; }
        collected.push({ city, draft });
        setItems([...collected]);
        if (draft.__notFound) setRow(i, { status: "notfound", msg: "δεν βρέθηκε" });
        else { names.add(draft.name); setRow(i, { status: "done", msg: draft.name }); }
      } catch (e) {
        setRow(i, { status: "error", msg: String((e as Error).message || e) });
      }
      await sleep(1200); // be gentle on Places/Gemini/Commons quotas
    }
    setRunning(false);
    if (collected.length) setPhase("review");
  }

  const done = rows.filter((r) => r.status !== "pending" && r.status !== "running").length;

  return (
    <div>
      <h1 style={{ fontSize: 22 }}>Μαζική δημιουργία δραστηριοτήτων</h1>
      <p style={{ color: "#6b7280", fontSize: 13 }}>
        Μία γραμμή ανά δραστηριότητα: <code>city | Όνομα</code>. Τρέχει σειριακά (μία-μία).
        Η νέα πόλη «{NEW_CITY_ID}» δημιουργείται αυτόματα.
      </p>

      {phase === "setup" && (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            rows={14} style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }} />
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#6b7280", fontSize: 13 }}>{parsed.length} δραστηριότητες</span>
            <button type="button" style={btn.primary} disabled={!parsed.length} onClick={run}>
              Έναρξη batch
            </button>
          </div>
        </>
      )}

      {(phase === "running" || (phase === "review")) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ margin: "8px 0", fontWeight: 700 }}>
            {running ? `⏳ Επεξεργασία… ${done}/${rows.length}` : `Ολοκληρώθηκε: ${done}/${rows.length}`}
          </div>
          <ul style={{ listStyle: "none", padding: 0, maxHeight: 260, overflow: "auto",
                       border: "1px solid var(--line)", borderRadius: 8 }}>
            {rows.map((r, i) => (
              <li key={i} style={{ display: "flex", gap: 8, padding: "5px 10px", fontSize: 13,
                                   borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ width: 18 }}>{STATUS_ICON[r.status]}</span>
                <span style={{ width: 90, color: "#6b7280" }}>{labels[r.city] ?? r.city}</span>
                <span style={{ flex: 1 }}>{r.name}</span>
                <span style={{ color: "#9ca3af" }}>{r.msg ?? ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {phase === "review" && items.length > 0 && (
        <>
          <h2 style={{ fontSize: 18 }}>Έλεγχος & αποθήκευση ({items.length})</h2>
          <DraftsReview
            items={items}
            onChange={setItems}
            cityLabel={(id) => labels[id] ?? id}
            onAllSaved={() => { void refreshCities(); }}
          />
        </>
      )}
    </div>
  );
}
