import type { Activity } from "@/app/components/ActivityCombinations/core/activities.functions";
import { emojiOf, starsOf } from "./mapData";

// The small card shown when hovering an activity marker (rendered inside a
// Leaflet tooltip). Mirrors the "Hovered Activity" group from the Penpot board:
// thumbnail, name, stars, price, and a "See more" hint.
export function HoveredActivityCard({ activity }: { activity: Activity }) {
  return (
    <div className="w-44">
      <div className="flex h-20 items-center justify-center rounded-lg bg-gradient-to-br from-orange-100 to-emerald-100 text-3xl">
        {emojiOf(activity)}
      </div>
      <div className="mt-2 text-sm font-medium leading-tight text-zinc-800">
        {activity.name}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
        <span>★ {starsOf(activity).toFixed(1)}/5</span>
        <span>{activity.cost === 0 ? "Free" : `€${activity.cost}`}</span>
      </div>
      <div className="mt-1 text-right text-xs font-medium text-orange-600">See more</div>
    </div>
  );
}
