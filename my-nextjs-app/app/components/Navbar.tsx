"use client";

import Link from "next/link";
import { useApp } from "../context/AppContext";

export default function Navbar() {
  const { theme, toggleTheme } = useApp();

  return (
    <nav className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.145]">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        My App
      </Link>
      <div className="flex items-center gap-6 text-sm font-medium">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <button
          onClick={toggleTheme}
          className="rounded-full border border-black/[.08] px-3 py-1 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>
    </nav>
  );
}
