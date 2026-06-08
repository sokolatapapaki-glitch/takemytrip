import { FaLocationDot } from "react-icons/fa6";

// The bottom-right pill showing which city the map is currently centred on
// ("City looking at" in the Penpot board).
export function CityLabel({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <div className="animate-fade-in-up flex items-center gap-1.5 rounded-full border border-white/60 bg-white/80 px-4 py-1.5 text-xs font-medium text-zinc-700 shadow-lg shadow-orange-900/5 backdrop-blur-md">
      <FaLocationDot className="text-emerald-500" /> {name}
    </div>
  );
}
