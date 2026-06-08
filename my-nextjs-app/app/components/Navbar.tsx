"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  // On mobile the links + theme toggle collapse into a hamburger dropdown.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the mobile menu when tapping anywhere outside it.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  return (
    <nav className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-black/[.08] bg-white/70 px-6 py-4 backdrop-blur-md dark:border-white/[.145] dark:bg-zinc-950/60">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Take My Trip
      </Link>

      {/* Desktop: centered nav links. Hidden on mobile (in the hamburger). */}
      <div className="hidden items-center justify-center gap-2 text-base font-medium sm:flex">
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
              className="rounded-full px-3 py-1.5 text-zinc-600 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:text-zinc-300 dark:hover:bg-white/[.06]"
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Right cell: theme toggle on desktop, hamburger on mobile. */}
      <div className="justify-self-end">
        <button
          onClick={toggleTheme}
          className="hidden rounded-full border border-black/[.08] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/[.04] sm:block dark:border-white/[.145] dark:hover:bg-white/[.06]"
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        {/* Mobile: animated hamburger ↔ X that opens the menu dropdown. */}
        <div ref={menuRef} className="relative sm:hidden">
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[.08] text-zinc-700 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-200 dark:hover:bg-white/[.06]"
          >
            {/* Three bars; on open the top/bottom rotate into an X and the
                middle fades out. */}
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                  menuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 rounded-full bg-current transition-all duration-300 ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                  menuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                }`}
              />
            </span>
          </button>

          {menuOpen && (
            <div className="animate-pop-in absolute right-0 top-full z-[100] mt-2 w-44 origin-top-right overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-2 shadow-2xl shadow-orange-900/10 backdrop-blur-xl dark:border-white/[.145] dark:bg-zinc-950/80">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                if (!item.enabled) {
                  return (
                    <span
                      key={item.label}
                      aria-disabled="true"
                      title="Coming soon"
                      className="block cursor-not-allowed rounded-xl px-3 py-2 text-sm text-zinc-300 dark:text-zinc-600"
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
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:text-zinc-300 dark:hover:bg-white/[.06]"
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setMenuOpen(false);
                }}
                className="mt-1 block w-full rounded-xl border-t border-black/5 px-3 py-2 text-left text-sm text-zinc-600 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[.06]"
              >
                {theme === "light" ? "🌙 Dark" : "☀️ Light"}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
