"use client";

import { useApp } from "../context/AppContext";

export default function Footer() {
  const { theme } = useApp();

  return (
    <footer className="border-t border-black/[.08] px-6 py-6 text-sm text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
      <div className="flex items-center justify-between">
        <span>© {new Date().getFullYear()} My App. All rights reserved.</span>
        <span className="capitalize">{theme} mode</span>
      </div>
    </footer>
  );
}
