"use client";

import Link from "next/link";
import { useApp } from "../context/AppContext";

export default function Footer() {
  const { theme } = useApp();
  const linkClass = `transition-colors hover:text-orange-700 ${
    theme === "light" ? "text-orange-600" : "text-orange-300"
  }`;

  return (
    <footer className="relative z-30 border-t border-black/[.08] bg-white px-4 py-6 text-sm text-zinc-600 sm:px-6 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400">
      <div className="flex items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} Take My Trip. Με επιφύλαξη παντός δικαιώματος</span>
        <div className="flex items-center gap-4">
          {/* Public photo-attribution page (required by the CC-licensed images). */}
          <Link href="/credits" className={linkClass}>
            Πηγές εικόνων
          </Link>
          <a
            href="https://www.takethekids.info"
            target="_blank"
            rel="noreferrer noopener"
            className={linkClass}
          >
            takethekids.info
          </a>
        </div>
      </div>
    </footer>
  );
}
