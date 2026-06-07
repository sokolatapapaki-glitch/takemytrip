import { FaStar } from "react-icons/fa6";
import type { Activity } from "@/app/components/ActivityCombinations/core/activities.functions";
import { bestVibe, starsOf } from "@/app/map/components/mapData";
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
  onToggleSelect,
}: {
  activity: Activity;
  index?: number;
  selected?: boolean;
  onToggleSelect?: (activity: Activity) => void;
}) {
  const stars = starsOf(activity);
  const vibe = bestVibe(activity);
  const VibeIcon = VIBE_ICONS[vibe.key];
  return (
    <div
      style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
      className="animate-card-pop relative flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-lg shadow-orange-900/5 backdrop-blur-md transition-shadow hover:shadow-xl hover:shadow-orange-900/10"
    >
      {/* Image placeholder — bright gradient coloured by the activity's vibe. */}
      <div
        className={`flex h-44 items-center justify-center bg-gradient-to-br ${VIBE_GRADIENT[vibe.key]}`}
      >
        <VibeIcon className="h-12 w-12 text-white drop-shadow" />
      </div>

      {/* Select checkbox — top-left, on a glass chip for contrast over the image. */}
      <label className="absolute left-3 top-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-white/85 shadow-sm backdrop-blur">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect?.(activity)}
          aria-label={`Select ${activity.name}`}
          className="h-4 w-4 cursor-pointer accent-orange-500"
        />
      </label>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-lg font-semibold text-zinc-800">{activity.name}</h3>
        <div className="mt-0.5 flex items-center gap-2 text-sm text-zinc-500">
          <span className="flex items-center gap-1">
            <FaStar className="h-3.5 w-3.5 text-amber-400" />
            {stars.toFixed(1)}/5
          </span>
          <span aria-hidden>·</span>
          <span>{activity.cost === 0 ? "Free" : `€${activity.cost}`}</span>
        </div>
        <p className="mb-3 mt-1 line-clamp-2 text-sm text-zinc-400">
          {activity.description}
        </p>

        {/* See more — placeholder for now (no activity detail page yet). Same
            border radius as the card; mt-auto pins it to the bottom. */}
        <button
          type="button"
          aria-disabled="true"
          title="Coming soon"
          className="mt-auto w-full rounded-3xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-orange-900/10 transition-colors hover:bg-orange-600"
        >
          See more
        </button>
      </div>
    </div>
  );
}
