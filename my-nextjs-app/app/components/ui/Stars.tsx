import { FaStar } from "react-icons/fa6";

// Fractional 5-star display shared by the activity cards and the activity
// detail modal: a gray star row with an amber overlay clipped to the rating
// (so e.g. 3.5 fills three and a half stars).
export function Stars({
  value,
  className = "h-3.5 w-3.5",
}: {
  value: number; // 0–5
  className?: string; // size classes for each star glyph
}) {
  return (
    <div className="relative inline-flex text-zinc-300">
      <span className="sr-only">{value.toFixed(1)} out of 5 stars</span>
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar key={`empty-${i}`} className={className} aria-hidden />
      ))}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden text-amber-400"
        style={{ width: `${Math.min(100, Math.max(0, (value / 5) * 100))}%` }}
      >
        <div className="inline-flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar key={`filled-${i}`} className={className} aria-hidden />
          ))}
        </div>
      </div>
    </div>
  );
}
