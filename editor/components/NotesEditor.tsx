"use client";
import { btn } from "./ui";

export default function NotesEditor({
  value, onChange,
}: { value: string[]; onChange: (v: string[]) => void }) {
  const notes = value ?? [];
  const set = (i: number, v: string) => onChange(notes.map((n, j) => (j === i ? v : n)));
  return (
    <div>
      {notes.map((n, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <input value={n} onChange={(e) => set(i, e.target.value)} />
          <button type="button" style={btn.danger}
            onClick={() => onChange(notes.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button type="button" style={btn.underline} onClick={() => onChange([...notes, ""])}>
        + Σημείωση
      </button>
    </div>
  );
}
