"use client";

import { useState } from "react";

export default function LinkDialog({
  initialLabel,
  initialHref,
  onSave,
  onCancel,
}: {
  initialLabel: string;
  initialHref: string;
  onSave: (label: string, href: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initialLabel);
  const [href, setHref] = useState(initialHref);

  const submit = () => {
    const trimmedHref = href.trim();
    if (!trimmedHref) return;
    onSave(label.trim(), trimmedHref);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Text to display</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Link text"
          autoFocus
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">URL</label>
        <input
          type="url"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="https://example.com"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!href.trim()}
          className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Insert
        </button>
      </div>
    </div>
  );
}
