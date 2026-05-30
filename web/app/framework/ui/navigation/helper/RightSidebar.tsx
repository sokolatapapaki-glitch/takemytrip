"use client";

import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  side?: "left" | "right";
};

export default function RightSidebar({ open, onClose, title = "Menu", children, side = "right" }: Props) {
  const isLeft = side === "left";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 z-40" />}

      <div
        className={`fixed top-0 z-50 h-full w-80 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isLeft ? "left-0" : "right-0"
        } ${
          open ? "translate-x-0" : isLeft ? "-translate-x-full" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </>
  );
}
