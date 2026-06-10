"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttonStyles } from "./ui/buttonStyles";

// Right-side navigation buttons (Sitemap/Navbar note). Each navigates to the page
// named by its label. Map and Cities are live; My trips is a disabled placeholder
// until that page exists.
const NAV_ITEMS = [
  { label: "Map", href: "/map", enabled: true },
  { label: "Cities", href: "/cities", enabled: true },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  // On mobile the links + My Trips collapse into a hamburger dropdown.
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
    // Sticky: the navbar stays pinned to the top of the viewport on every page.
    // z-40 keeps it above page content but BELOW the app modal overlay (z-50).
    <div ref={menuRef} className="sticky top-0 z-40">
      <nav className="flex items-center justify-between border-b border-black/[.08] bg-white/70 px-4 py-2 sm:px-6 backdrop-blur-md dark:border-white/[.145] dark:bg-zinc-950/60 w-full">
        {/* Mobile gets the larger title (text-2xl); desktop keeps text-lg. */}
        <Link href="/" className="text-2xl sm:text-lg font-semibold tracking-tight w-fit">
          Take My Trip
        </Link>

        {/* Right group: Map + Cities links next to the My Trips button (not
            centered). On mobile everything collapses into the hamburger. */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 text-base font-medium sm:flex">
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
                  className="rounded-full px-3 py-1.5 text-zinc-600 transition-colors hover:text-green-500 dark:text-zinc-300"
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <Link
            href="/my-trips"
            className={buttonStyles.secondary + " hidden sm:inline-flex" /* Hidden on mobile, in the hamburger menu. */}
          >
            My Trips
          </Link>

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
                    className="block rounded-2xl bg-zinc-50 px-4 py-4 text-lg text-zinc-400 dark:bg-white/5 dark:text-zinc-500"
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
                  className="block rounded-2xl bg-white px-4 py-4 text-lg text-zinc-700 transition-colors hover:text-green-500 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {item.label}
                </Link>
              );
            })}
            {/* My Trips: the secondary button (matches the desktop navbar). */}
            <Link
              href="/my-trips"
              onClick={() => setMenuOpen(false)}
              className={`block w-full ${buttonStyles.secondary}`}
            >
              My Trips
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
