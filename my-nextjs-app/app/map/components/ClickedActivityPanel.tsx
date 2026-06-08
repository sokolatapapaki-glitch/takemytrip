import { FaStar } from "react-icons/fa6";
import type { Activity } from "@/app/components/ActivityCombinations/core/activities.functions";
import { bestVibe, cityOf, iconOf, starsOf } from "./mapData";
import { XIcon } from "@/app/start/components/icons";

// The detailed activity card shown below the search input when an activity is
// clicked (on the map or in the results). Mirrors the "Clicked/searched activity"
// group from the Penpot board: image, name, stars, price, "Best for:", and the
// description. Pops in.
export function ClickedActivityPanel({
  activity,
  onClose,
}: {
  activity: Activity;
  onClose: () => void;
}) {
  const city = cityOf(activity);
  const Icon = iconOf(activity);
  return (
    <div className="animate-pop-in relative mt-2 rounded-xl border border-white/60 bg-white/80 p-3 shadow-lg shadow-orange-900/5 backdrop-blur">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-2 top-2 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
      >
        <XIcon className="h-4 w-4" />
      </button>

      <div className="flex h-48 items-center justify-center rounded-lg bg-gradient-to-br from-orange-100 to-emerald-100 text-green-500">
        <Icon className="h-16 w-16" />
      </div>

      <h3 className="mt-3 pr-6 text-lg font-semibold leading-tight text-zinc-800">
        {activity.name}
        {city && <span className="font-normal text-zinc-400"> · {city.name}</span>}
      </h3>

      <div className="mt-1.5 flex items-center gap-3 text-sm text-zinc-500">
        <span className="flex items-center gap-1">
          <FaStar className="text-yellow-400" /> {starsOf(activity).toFixed(1)}/5
        </span>
        <span>{activity.cost === 0 ? "Free" : `€${activity.cost}`}</span>
        <span>{activity.hours}h</span>
      </div>

      <p className="mt-3 text-sm text-zinc-500">
        <span className="font-medium text-zinc-600">Best for:</span> {bestVibe(activity).label}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{activity.description}</p>
    </div>
  );
}
