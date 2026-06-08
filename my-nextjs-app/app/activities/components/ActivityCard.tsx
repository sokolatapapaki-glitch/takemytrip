import { FaCheck, FaStar } from "react-icons/fa6";
import {
  adultPrice,
  type Activity,
} from "@/app/components/ActivityCombinations/core/activities.functions";
import { bestVibe, starsOf } from "@/app/map/components/mapData";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
import { VIBE_GRADIENT, VIBE_ICONS } from "./vibeStyle";

// A single activity tile from the Penpot "Activities in list" board: a select
// checkbox (top-left), a bright vibe-coloured image placeholder, the activity
// name, Stars/5, Price, a short description, and a "See more" action. "See more"
// is a placeholder for now (no detail page yet); the checkbox marks activities
// (for a future "Make Trip").
export function ActivityCard({
  activity,
  index = 0,
  selected = false,
  compact = false,
  onToggleSelect,
}: {
  activity: Activity;
  index?: number;
  selected?: boolean;
  compact?: boolean;
  onToggleSelect?: (activity: Activity) => void;
}) {
  const stars = starsOf(activity);
  const vibe = bestVibe(activity);
  // The card shows the price for ONE adult; the trip total reflects the party.
  const price = adultPrice(activity);
  const VibeIcon = VIBE_ICONS[vibe.key];
  const cardLayout = compact ? "flex-row sm:flex-col" : "flex-col";
  const imageClass = compact
    ? "h-full w-28 shrink-0 sm:h-32 sm:w-full"
    : "h-44 w-full";
  const descriptionClass = compact ? "hidden" : "mb-3 mt-1 line-clamp-2 text-sm text-zinc-400";

  return (
    <div
      style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
      className={`animate-card-pop relative flex w-full max-w-[34rem] ${cardLayout} overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-lg shadow-orange-900/5 backdrop-blur-md transition duration-200 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/10`}
    >
      {/* Image placeholder — bright gradient coloured by the activity's vibe. */}
      <div
        className={`flex ${imageClass} items-center justify-center bg-gradient-to-br ${VIBE_GRADIENT[vibe.key]}`}
      >
        <VibeIcon className="h-12 w-12 text-white drop-shadow" />
      </div>

      {/* Select checkbox — top-left, kept small and simple over the image. */}
      <label className="absolute left-3 top-3 flex h-5 w-5 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect?.(activity)}
          aria-label={`Select ${activity.name}`}
          className="peer sr-only"
        />
        <span className="flex h-5 w-5 items-center justify-center rounded border border-white/80 bg-black/15 text-white shadow-sm backdrop-blur-sm transition-colors peer-checked:border-orange-500 peer-checked:bg-orange-500">
          {selected && <FaCheck className="h-3 w-3" aria-hidden />}
        </span>
      </label>

      <div className="flex flex-1 min-w-0 flex-col p-3">
        <h3 className="text-lg font-semibold text-zinc-800">{activity.name}</h3>
        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <div className="relative inline-flex text-zinc-300">
            <span className="sr-only">{stars.toFixed(1)} out of 5 stars</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <FaStar key={`empty-${i}`} className="h-3.5 w-3.5" aria-hidden />
            ))}
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden text-amber-400"
              style={{ width: `${Math.min(100, Math.max(0, (stars / 5) * 100))}%` }}
            >
              <div className="inline-flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={`filled-${i}`} className="h-3.5 w-3.5" aria-hidden />
                ))}
              </div>
            </div>
          </div>
          <span>{price === 0 ? "Free" : `€${price}`}</span>
        </div>
        <p className={descriptionClass}>{activity.description}</p>

        {/* See more — placeholder for now (no activity detail page yet). */}
        <button
          type="button"
          aria-disabled="true"
          title="Coming soon"
          className={`mt-auto self-start ${buttonStyles.underline}`}
        >
          See more
        </button>
      </div>
    </div>
  );
}
