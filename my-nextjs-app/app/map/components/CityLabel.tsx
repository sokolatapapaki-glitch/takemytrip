import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaLocationDot } from "react-icons/fa6";
import {
  type City,
} from "@/app/components/ActivityCombinations/core/cities.data";

// The bottom-right pill showing which city the map is currently centred on.
// Clicking it opens a dropdown list of cities to jump to.
export function CityLabel({
  currentCityName,
  cities,
  onCitySelect,
}: {
  currentCityName: string | null;
  cities: City[];
  onCitySelect: (city: City) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const current = currentCityName
    ? cities.find((city) => city.name === currentCityName)
    : null;

  return (
    <div ref={rootRef} className="relative animate-fade-in-up text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/90 px-4 py-1.5 font-medium text-zinc-700 shadow-lg shadow-orange-900/5 transition-colors hover:bg-orange-50"
      >
        <FaLocationDot className="text-emerald-500" />
        <span>{current ? current.name : "Όλες οι πόλεις"}</span>
        <FaChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : "rotate-0"}`} />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 min-w-[16rem] rounded-3xl border border-white/80 bg-white/95 p-2 shadow-2xl shadow-orange-900/10 backdrop-blur-xl">
          {cities.map((city) => (
            <button
              key={city.id}
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                onCitySelect(city);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition-colors ${current?.id === city.id ? "bg-emerald-50 text-emerald-700" : "hover:bg-zinc-100 text-zinc-700"
                }`}
            >
              <span>{city.name}</span>
              <span className="text-xs text-zinc-400">{city.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
