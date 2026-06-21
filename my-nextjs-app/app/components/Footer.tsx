"use client";

import Link from "next/link";

// Dark-gray site footer: a small set of standard navigation links, a contact
// email, and an outbound link (with icon) to the parent Take The Kids site.
const FOOTER_NAV = [
  { label: "Αρχική", href: "/" },
  { label: "Χάρτης", href: "/map" },
  { label: "Προορισμοί", href: "/cities" },
  { label: "Τα ταξίδια μου", href: "/my-trips" },
  { label: "Πηγές εικόνων", href: "/credits" },
] as const;

const CONTACT_EMAIL = "info@takemytrip.gr";

export default function Footer() {
  const linkClass =
    "text-zinc-300 transition-colors hover:text-orange-400";

  return (
    <footer className="relative z-30 bg-zinc-900 px-4 py-10 text-sm text-zinc-400 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand + contact */}
          <div className="flex flex-col gap-3">
            <span className="text-lg font-semibold tracking-tight text-white">
              Take My Trip
            </span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-zinc-300 transition-colors hover:text-orange-400"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              {CONTACT_EMAIL}
            </a>
          </div>

          {/* Standard navigation buttons */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom row: copyright + outbound Take The Kids link */}
        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-zinc-500">
            © {new Date().getFullYear()} Take My Trip. Με επιφύλαξη παντός δικαιώματος.
          </span>
          <a
            href="https://www.takethekids.info"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 text-zinc-300 transition-colors hover:text-orange-400"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Take The Kids
          </a>
        </div>
      </div>
    </footer>
  );
}
