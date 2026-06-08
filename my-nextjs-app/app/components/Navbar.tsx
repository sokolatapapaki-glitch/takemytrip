"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BiMoon, BiSun } from "react-icons/bi";
import { useApp } from "../context/AppContext";

// Right-side navigation buttons (Sitemap/Navbar note). Each navigates to the page
// named by its label. Map and Cities are live; My trips is a disabled placeholder
// until that page exists.
const NAV_ITEMS = [
  { label: "Map", href: "/map", enabled: true },
  { label: "Cities", href: "/cities", enabled: true },
  { label: "My trips", href: "/my-trips", enabled: true },
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
    <div ref={menuRef} className="relative">
      <nav className="grid grid-cols-[auto_1fr_auto] items-center border-b border-black/[.08] bg-white/70 px-4 py-2 sm:px-6 backdrop-blur-md dark:border-white/[.145] dark:bg-zinc-950/60 w-full">
        <Link href="/" className="text-lg font-semibold tracking-tight w-fit">
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

          {/* Mobile: animated hamburger ↔ X that opens the menu modal. */}
          <div className="flex justify-end sm:hidden">
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-11 w-11 items-center justify-center text-zinc-700 transition-colors hover:text-orange-600 dark:text-zinc-200 dark:hover:text-orange-300"
            >
              {/* Three bars; on open the top/bottom rotate into an X and the
                  middle fades out. */}
              <span className="relative block h-5 w-7">
                <span
                  className={`absolute left-0 block h-0.5 w-7 rounded-full bg-current transition-all duration-300 ${menuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                    }`}
                />
                <span
                  className={`absolute left-0 top-1/2 block h-0.5 w-7 -translate-y-1/2 rounded-full bg-current transition-all duration-300 ${menuOpen ? "opacity-0" : "opacity-100"
                    }`}
                />
                <span
                  className={`absolute left-0 block h-0.5 w-7 rounded-full bg-current transition-all duration-300 ${menuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                    }`}
                />
              </span>
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="animate-slide-down fixed inset-0 z-[100] overflow-y-auto bg-white/95 p-6 backdrop-blur-xl dark:bg-zinc-950/95 mt-14 h-fit">

          <div className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              if (!item.enabled) {
                return (
                  <span
                    key={item.label}
                    aria-disabled="true"
                    title="Coming soon"
                    className="block rounded-2xl bg-zinc-50 px-4 py-4 text-sm text-zinc-400 dark:bg-white/5 dark:text-zinc-500"
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
                  className="block rounded-2xl bg-white px-4 py-4 text-sm text-zinc-700 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-white/[.06]"
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
              aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
              className="mt-2 flex items-center justify-between rounded-2xl bg-white px-4 py-4 text-left text-sm text-zinc-700 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-white/[.06]"
            >
              <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
              {theme === "light" ? (
                <BiMoon className="h-5 w-5" />
              ) : (
                <BiSun className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
