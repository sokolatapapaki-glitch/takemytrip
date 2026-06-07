"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "../context/AppContext";

// Right-side navigation buttons (Sitemap/Navbar note). Each navigates to the page
// named by its label. Map and Cities are live; My trips is a disabled placeholder
// until that page exists.
const NAV_ITEMS = [
  { label: "Map", href: "/map", enabled: true },
  { label: "Cities", href: "/cities", enabled: true },
  { label: "My trips", href: "/my-trips", enabled: false },
] as const;

export default function Navbar() {
  const { theme, toggleTheme } = useApp();
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between border-b border-black/[.08] bg-white/70 px-6 py-4 backdrop-blur-md dark:border-white/[.145] dark:bg-zinc-950/60">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Take My Trip
      </Link>
      <div className="flex items-center gap-2 text-sm font-medium">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          if (!item.enabled) {
            return (
              <span
                key={item.label}
                aria-disabled="true"
                title="Coming soon"
                className="cursor-not-allowed rounded-full px-3 py-1.5 text-zinc-300 dark:text-zinc-600"
              >
                {item.label}
              </span>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                active
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-orange-50 hover:text-orange-600 dark:text-zinc-300 dark:hover:bg-white/[.06]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={toggleTheme}
          className="ml-2 rounded-full border border-black/[.08] px-3 py-1.5 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>
    </nav>
  );
}
