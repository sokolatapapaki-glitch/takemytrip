"use client";

import { useApp } from "./context/AppContext";

export default function Home() {
  const { openModal, closeModal } = useApp();

  return (
    <div className="flex flex-1 items-start justify-center p-8 pt-24">
      <button
        onClick={() =>
          openModal(
            <div>
              <h2 className="text-xl font-semibold">Demo Modal</h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                This modal is centered on desktop and full-screen on mobile. The
                page behind it can&apos;t scroll while it&apos;s open.
              </p>
              <button
                onClick={closeModal}
                className="mt-6 rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Close
              </button>
            </div>
          )
        }
        className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Open demo modal
      </button>
    </div>
  );
}
