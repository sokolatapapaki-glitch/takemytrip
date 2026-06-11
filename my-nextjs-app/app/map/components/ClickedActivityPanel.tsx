import { useEffect, useRef } from "react";
import { FaStar } from "react-icons/fa6";
import type { Activity } from "@/app/components/ActivityCombinations/core/activities.functions";
import { bestVibe, cityOf, iconOf, starsOf } from "./mapData";
import { ChevronLeftIcon } from "@/app/start/components/icons";

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
  const ref = useRef<HTMLDivElement>(null);

  // When opened, scroll the results list (only that container, never the page)
  // by exactly as much as needed so this detail panel's top lands at the top of
  // the list — i.e. right below the filter buttons — and is fully visible.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const container = el.closest<HTMLElement>("[data-results-list]");
    if (!container) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const delta = el.getBoundingClientRect().top - container.getBoundingClientRect().top;
    container.scrollBy({ top: delta, behavior: "smooth" });
  }, []);

  return (
    <div
      ref={ref}
      className="relative mt-2 rounded-3xl border border-zinc-200 bg-white p-4 shadow-xl shadow-orange-900/10"
    >
      {/* Top-left back arrow — collapses the detail back to the result card
          (same effect the old "See less" button had). */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Back"
        className="absolute left-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white hover:text-zinc-900"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      <div className="flex h-40 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-100 to-emerald-100 text-green-500">
        <Icon className="h-16 w-16" />
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-tight text-zinc-900">
        {activity.name}
        {city && <span className="font-normal text-zinc-500"> · {city.name}</span>}
      </h3>

      <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
        <span className="flex items-center gap-1">
          <FaStar className="text-yellow-400" /> {starsOf(activity).toFixed(1)}/5
        </span>
        <span>{activity.cost === 0 ? "Free" : `€${activity.cost}`}</span>
        <span>{activity.hours}h</span>
      </div>

      <p className="mt-3 text-sm text-zinc-500">
        <span className="font-medium text-zinc-600">Best for:</span> {bestVibe(activity).label}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{activity.description}</p>
    </div>
  );
}
