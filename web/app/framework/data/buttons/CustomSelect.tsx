"use client";

import { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string | number; label: string };

type Props = {
  options: SelectOption[];
  selected: (string | number)[];
  onChange: (selected: (string | number)[]) => void;
  max?: number;
  label?: string;
  placeholder?: string;
};

export default function CustomSelect({ options, selected, onChange, max, label, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (value: string | number) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else if (max === 1) {
      onChange([value]);
      setOpen(false);
    } else if (max === undefined || selected.length < max) {
      onChange([...selected, value]);
    }
  };

  const isSingle = max === 1;
  const selectedLabels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label)
    .join(", ");

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-600">{label}</label>}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <span className={selected.length === 0 ? "text-gray-400" : "text-gray-800"}>
            {selected.length === 0 ? (placeholder ?? "Select...") : selectedLabels}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 top-full mt-1 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-auto max-h-52">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400 italic">No options available</p>
            ) : (
              options.map((opt) => {
                const isSelected = selected.includes(opt.value);
                const isDisabled = !isSelected && max !== undefined && max !== 1 && selected.length >= max;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggle(opt.value)}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                      isSelected ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                  >
                    {!isSingle && (
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
