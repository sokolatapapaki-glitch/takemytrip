import { FaStar } from "react-icons/fa6";
import type { Activity } from "@/app/components/ActivityCombinations/core/activities.functions";
import { cityOf, iconOf, starsOf } from "./mapData";

// A row in the search-results list: thumbnail + name/city + stars/price. Mirrors
// the "Activity from search result" card. Clicking it opens the detailed panel.
export function ActivityResultCard({
  activity,
  active,
  index = 0,
  onClick,
}: {
  activity: Activity;
  active: boolean;
  index?: number; // position in the list — used to stagger the pop-in
  onClick: () => void;
}) {
  const city = cityOf(activity);
  const Icon = iconOf(activity);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${Math.min(index * 35, 250)}ms` }}
      className={`animate-card-pop flex min-h-24 w-full items-stretch overflow-hidden rounded-2xl border bg-white text-left shadow-sm shadow-orange-900/5 transition-colors ${
        active ? "border-orange-300" : "border-zinc-100 hover:border-orange-200"
      }`}
    >
      <span className="flex w-20 shrink-0 items-center justify-center self-stretch rounded-l-2xl bg-zinc-100 text-green-500">
        <Icon className="h-7 w-7" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-between p-3">
        <span>
          <span className="block truncate text-base font-medium text-zinc-800">
            {activity.name}
          </span>
          <span className="flex items-center gap-1 truncate text-sm text-zinc-400">
            {city ? city.name : "—"} ·{" "}
            <FaStar className="shrink-0 text-yellow-400" /> {starsOf(activity).toFixed(1)} ·{" "}
            {activity.cost === 0 ? "Free" : `€${activity.cost}`}
          </span>
        </span>
        <span className="self-end text-sm font-medium text-orange-500 underline underline-offset-2">
          see more
        </span>
      </span>
    </button>
  );
}
