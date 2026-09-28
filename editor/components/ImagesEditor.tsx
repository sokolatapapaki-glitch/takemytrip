"use client";
import { useState } from "react";
import type { EditorImage } from "@/lib/types";
import { imagePool, imageUrl, isLocal, missingCredit } from "@/lib/images";
import { btn } from "./ui";

// Big, selectable image gallery. The pool is the activity's saved images (ticked)
// followed by any `candidates` not yet approved (unticked) — e.g. the pictures the
// n8n workflow suggested for a draft. Clicking a card toggles whether it's KEPT;
// only kept images are emitted via onChange and saved, so a suggestion nobody
// looked at can never reach the app.
//
// Images are local /public paths or remote images with a credit. A remote image
// without a complete credit is marked: it is saved but the planner won't show it
// (showing a CC BY / BY-SA photo without attribution breaks its license).
export default function ImagesEditor({
  value, onChange, candidates,
}: {
  value: EditorImage[] | undefined;
  onChange: (v: EditorImage[]) => void;
  candidates?: EditorImage[];
}) {
  const [pool, setPool] = useState<EditorImage[]>(() => imagePool(value, candidates));
  const [kept, setKept] = useState<Set<number>>(
    () => new Set((value ?? []).map((_, i) => i))
  );

  const emit = (p: EditorImage[], k: Set<number>) =>
    onChange(p.filter((im, i) => k.has(i) && imageUrl(im)));

  const toggle = (i: number) => {
    const k = new Set(kept);
    k.has(i) ? k.delete(i) : k.add(i);
    setKept(k); emit(pool, k);
  };
  // A new URL is a different picture, so any credit that came with the old one
  // no longer applies and is dropped.
  const setUrl = (i: number, url: string) => {
    const p = pool.map((x, j) => (j === i ? url : x));
    setPool(p); emit(p, kept);
  };
  const remove = (i: number) => {
    const p = pool.filter((_, j) => j !== i);
    const k = new Set<number>();
    let n = 0;
    pool.forEach((_, j) => { if (j !== i) { if (kept.has(j)) k.add(n); n++; } });
    setPool(p); setKept(k); emit(p, k);
  };
  const add = () => {
    const p = [...pool, ""];
    const k = new Set(kept); k.add(p.length - 1);
    setPool(p); setKept(k); emit(p, k);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {pool.map((im, i) => {
        const on = kept.has(i);
        const src = imageUrl(im);
        const missing = missingCredit(im);
        const credit = typeof im === "string" ? undefined : im.credit;
        return (
          <div key={i} style={{ width: 220 }}>
            <div
              onClick={() => toggle(i)}
              title={on ? "Επιλεγμένη — κλικ για αφαίρεση" : "Κλικ για επιλογή"}
              style={{
                position: "relative", cursor: "pointer",
                border: on ? "3px solid var(--green)" : "3px solid var(--line)",
                borderRadius: 12, overflow: "hidden", opacity: on ? 1 : 0.5,
                transition: "opacity .12s, border-color .12s",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" style={{
                width: "100%", height: 150, objectFit: "cover", display: "block",
                background: "#f3f4f6",
              }} />
              <span style={{
                position: "absolute", top: 8, left: 8, width: 26, height: 26,
                borderRadius: 999, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 15, color: "#fff",
                background: on ? "var(--green)" : "rgba(107,114,128,.85)",
              }}>{on ? "✓" : ""}</span>
            </div>
            <div style={{ fontSize: 11, marginTop: 4, minHeight: 16 }}>
              {!src ? null : isLocal(src) ? (
                <span style={{ color: "#6b7280" }}>Τοπική εικόνα</span>
              ) : missing.length ? (
                <span style={{ color: "#b45309" }} title={`Λείπουν: ${missing.join(", ")}`}>
                  ⚠️ Χωρίς πλήρη πηγή — δεν θα εμφανιστεί στην εφαρμογή
                </span>
              ) : (
                <span style={{ color: "#6b7280" }}>
                  © {credit!.author} · {credit!.license}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
              <input value={src} onChange={(e) => setUrl(i, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="/destinations/… ή https://…" style={{ fontSize: 11, padding: "5px 7px" }} />
              <button type="button" style={btn.danger} onClick={() => remove(i)} title="Διαγραφή">✕</button>
            </div>
          </div>
        );
      })}
      <button type="button" style={{ ...btn.underline, alignSelf: "center" }} onClick={add}>
        + Εικόνα
      </button>
    </div>
  );
}
