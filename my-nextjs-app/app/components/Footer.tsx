"use client";

import { useApp } from "../context/AppContext";

export default function Footer() {
  const { theme } = useApp();

  return (
    <footer className="border-t border-black/[.08] px-6 py-6 text-sm text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
      <div className="flex items-center justify-between">
        <span>© {new Date().getFullYear()} My App. All rights reserveds</span>
        <a
          href="https://www.takethekids.info"
          target="_blank"
          rel="noreferrer noopener"
          className={`transition-colors hover:text-orange-700 ${
            theme === "light"
              ? "text-orange-600"
              : "text-orange-300"
          }`}
        >
          takethekids.info
        </a>
      </div>
    </footer>
  );
}
