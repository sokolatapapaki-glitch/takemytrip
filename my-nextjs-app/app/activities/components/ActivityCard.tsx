import { FaCheck } from "react-icons/fa6";
import {
  adultPrice,
  type Activity,
} from "@/app/components/ActivityCombinations/core/activities.functions";
import { bestVibe, starsOf } from "@/app/map/components/mapData";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
import { Stars } from "@/app/components/ui/Stars";
import { VIBE_GRADIENT, VIBE_ICONS } from "./vibeStyle";

// A single activity tile from the Penpot "Activities in list" board: a select
// checkbox (top-left), a bright vibe-coloured image placeholder, the activity
// name, Stars/5, Price, a short description, and a "See more" action. "See more"
// opens the activity detail modal when the parent passes `onSeeMore` (e.g.
// useApp().openActivity); the checkbox marks activities (for a future "Make
// Trip") and can be hidden where selection makes no sense (the modal's strip).
export function ActivityCard({
  activity,
  index = 0,
  selected = false,
  compact = false,
  hideSelect = false,
  showUse = false,
  onUse,
  onToggleSelect,
  onSeeMore,
}: {
  activity: Activity;
  index?: number;
  selected?: boolean;
  compact?: boolean;
  hideSelect?: boolean;
  // Opt-in (My Trips strip only): a "Use" button at the card's top-right.
  // With `onUse` it's live (replace mode: "use this one instead"); without a
  // handler it stays an inert placeholder.
  showUse?: boolean;
  onUse?: (activity: Activity) => void;
  onToggleSelect?: (activity: Activity) => void;
  onSeeMore?: (activity: Activity) => void;
}) {
  const stars = starsOf(activity);
  const vibe = bestVibe(activity);
  // The card shows the price for ONE adult; the trip total reflects the party.
  const price = adultPrice(activity);
  const VibeIcon = VIBE_ICONS[vibe.key];
  const cardLayout = compact ? "flex-row sm:flex-col" : "flex-col";
  // Non-compact cards match the City card: same image height, full grid-cell
  // width (no max cap), and the same lift+tilt hover.
  const imageClass = compact
    ? "h-full w-28 shrink-0 sm:h-32 sm:w-full"
    : "h-40 w-full";
  // Non-compact cards fill their cell's height (like City cards in a grid) so a
  // row of them is uniformly tall and the bottom button stays pinned together.
  const widthClass = compact ? "w-full max-w-[34rem]" : "h-full w-full";
  const hoverClass = compact
    ? "hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/10"
    : "hover:-translate-y-1 hover:rotate-1 hover:shadow-xl hover:shadow-orange-900/10";
  const descriptionClass = compact ? "hidden" : "line-clamp-2 text-sm text-zinc-400";

  return (
    <div
      style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
      className={`group animate-card-pop relative flex ${widthClass} ${cardLayout} overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-lg shadow-orange-900/5 backdrop-blur-md transition duration-200 ease-out ${hoverClass}`}
    >
      {/* Image placeholder — bright gradient coloured by the activity's vibe. */}
      <div
        className={`flex ${imageClass} items-center justify-center bg-gradient-to-br ${VIBE_GRADIENT[vibe.key]}`}
      >
        <VibeIcon className="h-12 w-12 text-white drop-shadow" />
      </div>

      {/* Select checkbox — top-left, kept small and simple over the image. */}
      {!hideSelect && (
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
      )}

      {/* Use — top-right over the image (My Trips strip). Live in replace mode
          (onUse), inert placeholder otherwise. */}
      {showUse && (
        <button
          type="button"
          onClick={onUse ? () => onUse(activity) : undefined}
          aria-disabled={!onUse}
          title={onUse ? "Use this activity instead" : "Click Replace on a trip activity first"}
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-sm transition-colors ${
            onUse
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-white/90 text-zinc-800 hover:bg-white"
          }`}
        >
          Use
        </button>
      )}

      {/* `isolate` + `-z-10` keeps the decorative hover shapes BEHIND the text
          while still above the card's own background. */}
      <div
        className={`relative isolate flex flex-1 min-w-0 flex-col ${
          compact ? "p-3" : "gap-2 p-4"
        }`}
      >
        {/* Decorative accents — invisible until hovered, then they fade/drift in
            behind the content. Like the City card's, but a different set: a pair
            of concentric rings rising from the bottom-RIGHT corner, a short dash
            sweeping under the title, and a stagger of dots down the left edge. */}
        {!compact && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -right-16 -z-10 h-48 w-48 scale-75 rounded-full border-2 border-emerald-500/20 opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-14 -right-10 -z-10 h-32 w-32 scale-75 rounded-full border-2 border-orange-500/20 opacity-0 transition-all delay-75 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-3 top-9 -z-10 h-0.5 w-14 rotate-[14deg] translate-y-1 rounded-full bg-emerald-500/15 opacity-0 transition-all delay-100 duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-4 top-12 -z-10 h-1.5 w-1.5 scale-0 rounded-full bg-orange-500/20 opacity-0 transition-all delay-100 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-8 top-[4.25rem] -z-10 h-2 w-2 scale-0 rounded-full bg-emerald-500/15 opacity-0 transition-all delay-150 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-5 top-24 -z-10 h-1 w-1 scale-0 rounded-full bg-orange-500/20 opacity-0 transition-all delay-200 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
            />
          </>
        )}
        <h3 className="text-lg font-semibold text-zinc-800">{activity.name}</h3>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <Stars value={stars} />
          <span>{price === 0 ? "Free" : `€${price}`}</span>
        </div>
        <p className={descriptionClass}>{activity.description}</p>

        {/* See more — opens the activity detail modal (stays a no-op until the
            parent provides the handler). Full cards use a secondary button
            matching the City card's "See Activities" (pinned to the bottom);
            compact strips keep the quiet underline. */}
        <button
          type="button"
          onClick={onSeeMore ? () => onSeeMore(activity) : undefined}
          aria-disabled={!onSeeMore}
          title={onSeeMore ? undefined : "Coming soon"}
          className={
            compact
              ? `mt-auto self-start ${buttonStyles.underline}`
              : `mt-auto block w-full ${buttonStyles.secondary}`
          }
        >
          See more
        </button>
      </div>
    </div>
  );
}
