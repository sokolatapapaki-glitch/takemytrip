import { FaStar } from "react-icons/fa6";
import type { Activity } from "@/app/components/ActivityCombinations/core/activities.functions";
import { iconOf, starsOf } from "./mapData";

// The small card shown when hovering an activity marker (rendered inside a
// Leaflet tooltip). Mirrors the "Hovered Activity" group from the Penpot board:
// thumbnail, name, stars, price, and a "See more" hint.
export function HoveredActivityCard({ activity }: { activity: Activity }) {
  const Icon = iconOf(activity);
  return (
    <div className="w-44">
      <div className="flex h-20 items-center justify-center rounded-lg bg-gradient-to-br from-orange-100 to-emerald-100 text-green-500">
        <Icon className="h-8 w-8" />
      </div>
      <div className="mt-2 text-sm font-medium leading-tight text-zinc-800">
        {activity.name}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <FaStar className="text-yellow-400" /> {starsOf(activity).toFixed(1)}/5
        </span>
        <span>{activity.cost === 0 ? "Δωρεάν" : `€${activity.cost}`}</span>
      </div>
      <p className="mt-1.5 line-clamp-3 text-xs leading-snug text-zinc-500">
        {activity.description}
      </p>
      <div className="mt-1 text-right text-xs font-medium text-orange-600">Δες περισσότερα</div>
    </div>
  );
}
