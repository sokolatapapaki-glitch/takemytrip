"use client";

import type { VibeKey } from "@/app/components/ActivityCombinations/core/activities.functions";
import { VIBES } from "./mapData";

// The row of vibe buttons across the top of the map. Selecting one filters the
// activities (markers + results) to mostly that vibe; clicking it again clears.
export function VibeBar({
  active,
  onChange,
}: {
  active: VibeKey | null;
  onChange: (vibe: VibeKey | null) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/60 bg-white/70 p-1 shadow-lg shadow-orange-900/5 backdrop-blur-md">
      {VIBES.map((v) => {
        const on = active === v.key;
        return (
          <button
            key={v.key}
            type="button"
            onClick={() => onChange(on ? null : v.key)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${on
                ? "bg-orange-500 text-white shadow-sm"
                : "text-zinc-600 hover:bg-black/[.03] hover:text-zinc-700"
              }`}
          >
            <v.Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
