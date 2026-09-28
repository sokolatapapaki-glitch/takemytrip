import { listCities } from "@/lib/cityStore";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cities = await listCities();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>Πόλεις</h1>
        <a href="/batch" style={{
          background: "var(--orange)", color: "#fff", padding: "8px 14px",
          borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14,
        }}>✨ Μαζική δημιουργία</a>
      </div>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
        {cities.map((c) => (
          <li key={c.id}>
            <a
              href={`/city/${c.id}`}
              style={{
                display: "flex", justifyContent: "space-between", padding: "12px 14px",
                border: "1px solid var(--line)", borderRadius: 10, textDecoration: "none",
                color: "var(--ink)",
              }}
            >
              <span style={{ fontWeight: 600 }}>{c.label}</span>
              <span style={{ color: "#6b7280", fontSize: 13 }}>
                {c.count} ενεργές{c.archivedCount ? ` · ${c.archivedCount} αρχειοθετημένες` : ""}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
