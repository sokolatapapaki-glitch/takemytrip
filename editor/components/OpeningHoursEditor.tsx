"use client";
import type { DayHours, LegacyOpeningHours, OpeningHours } from "@/lib/types";
import { btn } from "./ui";

// Per-day opening hours, Monday first — the planner's own `program` shape, so what
// is set here is exactly what it schedules against. Checkbox off = "use the
// category default" (onChange(null)). Hours are decimal (9.5 = 09:30), 0..24.
// A closed day is stored as null. The legacy single window (same every day) is
// read as seven copies and saved back as the 7-day array.
const DAYS = ["Δευ", "Τρί", "Τετ", "Πέμ", "Παρ", "Σάβ", "Κυρ"] as const;
const DEFAULT_DAY = { open: 9, close: 18 };

export function toDays(value: OpeningHours | LegacyOpeningHours | null | undefined): OpeningHours | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value;
  return Array.from({ length: 7 }, () => ({ open: value.open, close: value.close }));
}

const valid = (d: DayHours) => d === null || (d.open >= 0 && d.close <= 24 && d.open < d.close);

export default function OpeningHoursEditor({
  value, onChange,
}: {
  value: OpeningHours | LegacyOpeningHours | null | undefined;
  onChange: (v: OpeningHours | null) => void;
}) {
  const days = toDays(value);
  const on = days != null;
  const setDay = (i: number, d: DayHours) => onChange(days!.map((x, j) => (j === i ? d : x)));

  return (
    <div>
      <label style={{ margin: 0, display: "flex", gap: 6, alignItems: "center" }}>
        <input type="checkbox" style={{ width: "auto" }} checked={on}
          onChange={(e) =>
            onChange(e.target.checked ? Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY })) : null)} />
        Ορισμός ωραρίου {!on && <span style={{ color: "#6b7280", fontWeight: 400 }}>(αλλιώς από τον τύπο)</span>}
      </label>
      {on && (
        <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
          {days!.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <b style={{ width: 36 }}>{DAYS[i]}</b>
              <label style={{ margin: 0, display: "flex", gap: 4, alignItems: "center", fontWeight: 400 }}>
                <input type="checkbox" style={{ width: "auto" }} checked={d === null}
                  onChange={(e) => setDay(i, e.target.checked ? null : { ...DEFAULT_DAY })} />
                Κλειστό
              </label>
              {d !== null && (
                <>
                  <input type="number" min={0} max={24} step={0.25} style={{ maxWidth: 80 }} value={d.open}
                    onChange={(e) => setDay(i, { open: Number(e.target.value), close: d.close })} />
                  <span>–</span>
                  <input type="number" min={0} max={24} step={0.25} style={{ maxWidth: 80 }} value={d.close}
                    onChange={(e) => setDay(i, { open: d.open, close: Number(e.target.value) })} />
                  <button type="button" style={btn.underline} onClick={() => setDay(i, { open: 0, close: 24 })}>
                    24ω
                  </button>
                  {!valid(d) && <span style={{ color: "#b91c1c", fontSize: 12 }}>άνοιγμα &lt; κλείσιμο, 0–24</span>}
                </>
              )}
            </div>
          ))}
          <div>
            <button type="button" style={btn.underline}
              onClick={() => onChange(days!.map(() => (days![0] ? { ...days![0] } : null)))}>
              Αντιγραφή Δευτέρας σε όλες
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
