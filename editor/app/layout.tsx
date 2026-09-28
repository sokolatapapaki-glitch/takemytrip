import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "Activity Editor" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="el">
      <body>
        <header style={{ borderBottom: "3px solid var(--green)", padding: "12px 20px" }}>
          <a href="/" style={{ fontWeight: 800, textDecoration: "none", color: "var(--ink)" }}>
            🗂️ Activity Editor
          </a>
        </header>
        <main style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>{children}</main>
      </body>
    </html>
  );
}
