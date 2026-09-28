import type { CSSProperties } from "react";

const base: CSSProperties = {
  padding: "8px 14px", borderRadius: 10, border: "1px solid transparent",
  fontWeight: 700, cursor: "pointer", fontSize: 14,
};

export const btn: Record<string, CSSProperties> = {
  primary: { ...base, background: "var(--orange)", color: "#fff" },
  secondary: { ...base, background: "var(--green)", color: "#fff" },
  common: { ...base, background: "#f3f4f6", color: "var(--ink)" },
  danger: { ...base, background: "#fff", color: "#b91c1c", borderColor: "#fecaca" },
  underline: {
    background: "none", border: "none", color: "var(--orange)",
    textDecoration: "underline", cursor: "pointer", fontWeight: 700, padding: 4,
  },
};
