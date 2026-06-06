import type { Activity } from "@/app/components/ActivityCombinations/core/activities.functions";
import { cityOf, emojiOf, starsOf } from "./mapData";

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
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${Math.min(index * 35, 250)}ms` }}
      className={`animate-card-pop flex w-full items-start gap-2 rounded-2xl border bg-white p-2 text-left shadow-sm shadow-orange-900/5 transition-colors ${
        active ? "border-orange-300" : "border-zinc-100 hover:border-orange-200"
      }`}
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-zinc-100 bg-white text-3xl">
        {emojiOf(activity)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium text-zinc-800">
          {activity.name}
        </span>
        <span className="block truncate text-sm text-zinc-400">
          {city ? city.name : "—"} · ★ {starsOf(activity).toFixed(1)} ·{" "}
          {activity.cost === 0 ? "Free" : `€${activity.cost}`}
        </span>
      </span>
    </button>
  );
}
