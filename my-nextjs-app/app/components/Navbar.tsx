"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttonStyles } from "./ui/buttonStyles";

// Right-side navigation buttons (Sitemap/Navbar note). Each navigates to the page
// named by its label. Map and Cities are live; My trips is a disabled placeholder
// until that page exists.
const NAV_ITEMS = [
  { label: "Χάρτης", href: "/map", enabled: true },
  { label: "Πόλεις", href: "/cities", enabled: true },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  // The homepage hero has a full-bleed fixed background that sits behind the
  // navbar. On desktop the navbar floats transparently over it at the very top,
  // then transitions to its solid look once the user scrolls past a small
  // threshold. Mobile keeps the solid navbar at all times.
  const isHome = pathname === "/" || pathname === "/start";
  const [scrolled, setScrolled] = useState(false);
  // On mobile the links + My Trips collapse into a hamburger dropdown.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Track scroll only where the transparent treatment applies (the home hero).
  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Desktop-only: transparent over the hero while at the top of the homepage.
  const transparentTop = isHome && !scrolled;

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
      <nav
        className={`flex w-full items-center justify-between border-b px-4 py-2 transition-all duration-300 ${transparentTop
          ? // Mobile stays solid; desktop (sm:) goes transparent at the top AND
          // a touch roomier (more padding) since it's floating over the hero.
          "border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950 sm:border-transparent sm:bg-transparent sm:px-5 sm:py-2.5 sm:dark:border-transparent sm:dark:bg-transparent"
          : "border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950 sm:px-4 sm:py-2"
          }`}
      >
        {/* Mobile gets the larger title (text-2xl); desktop keeps text-lg. */}
        <Link
          href="/"
          className={`w-fit text-2xl font-semibold tracking-tight transition-colors duration-300 sm:text-lg ${transparentTop ? "sm:text-white test-3xl" : ""
            }`}
        >
          Take My Trip
        </Link>

        {/* Right group: Map + Cities links next to the My Trips button (not
            centered). On mobile everything collapses into the hamburger. */}
        <div className={`flex items-center transition-all duration-300 ${transparentTop ? "gap-3" : "gap-2"}`}>
          <div className={`hidden items-center font-medium transition-all duration-300 sm:flex ${transparentTop ? "gap-3 text-lg" : "gap-2 text-base"}`}>
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
                  className={`rounded-full text-zinc-600 transition-all duration-300 hover:text-green-500 dark:text-zinc-300 ${transparentTop ? "px-3 py-1.5 sm:text-white sm:hover:text-green-300" : "px-3 py-1.5"
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <Link
            href="/my-trips"
            /* Hidden on mobile (in the hamburger menu). A touch larger while the
               navbar floats transparently over the hero. */
            className={`${buttonStyles.secondary} hidden transition-all duration-300 sm:inline-flex ${transparentTop ? "sm:px-4 sm:py-2 sm:text-base" : ""
              }`}
          >
            Τα ταξίδια μου
          </Link>

          {/* Mobile: animated hamburger ↔ X that opens the menu modal. */}
          <div className="flex justify-end sm:hidden">
            <button
              type="button"
              aria-label="Μενού"
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
        // No backdrop/background — just the links as plain text, left-aligned
        // below the navbar. Tapping anywhere off the list closes it (the outside
        // -click handler above, since this lives inside menuRef).
        <div className="animate-slide-down fixed inset-x-0 top-14 z-[100]">
          <div className="flex w-full flex-col items-start gap-1 bg-white p-4 shadow-xl shadow-black/5 dark:bg-zinc-950">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              if (!item.enabled) {
                return (
                  <span
                    key={item.label}
                    aria-disabled="true"
                    title="Coming soon"
                    className="px-1 py-2 text-lg text-zinc-300 dark:text-zinc-600"
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
                  className="px-1 py-2 text-lg text-zinc-700 transition-colors hover:text-green-500 dark:text-zinc-100"
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/my-trips"
              onClick={() => setMenuOpen(false)}
              className="px-1 py-2 text-lg text-zinc-700 transition-colors hover:text-green-500 dark:text-zinc-100"
            >
              Τα ταξίδια μου
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
