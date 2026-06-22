import { useEffect, useRef } from "react";
import { FaStar } from "react-icons/fa6";
import type { Activity } from "@/app/components/ActivityCombinations/core/activities.functions";
import { buttonStyles } from "@/app/components/ui/buttonStyles";
import { cityOf, iconOf, starsOf } from "./mapData";
import { activityImages } from "@/app/activities/components/activityImages";
import { SHOW_ACTIVITY_STARS, HIDE_ACTIVITY_PRICES } from "@/app/config";

// A row in the search-results list: thumbnail + name/city + stars/price. Mirrors
// the "Activity from search result" card. Clicking it opens the detailed panel.
export function ActivityResultCard({
  activity,
  active,
  open = false,
  index = 0,
  onClick,
}: {
  activity: Activity;
  active: boolean;
  open?: boolean;
  index?: number; // position in the list — used to stagger the pop-in
  onClick: () => void;
}) {
  const city = cityOf(activity);
  const Icon = iconOf(activity);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [open]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${Math.min(index * 35, 250)}ms` }}
      className={`animate-card-pop flex min-h-24 w-full items-stretch overflow-hidden rounded-2xl border bg-white text-left shadow-sm shadow-orange-900/5 transition duration-200 ease-out hover:-translate-y-0.5 ${active ? "border-orange-300" : "border-zinc-100 hover:border-orange-200"
        }`}
    >
      <span className="relative flex w-20 shrink-0 items-center justify-center self-stretch overflow-hidden rounded-l-2xl bg-zinc-100 text-green-500">
        <Icon className="h-7 w-7" />
        {activityImages(activity)[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activityImages(activity)[0]}
            alt={activity.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-between p-3">
        <span>
          <span className="block truncate text-base font-medium text-zinc-800">
            {activity.name}
          </span>
          <span className="flex items-center gap-1 truncate text-sm text-zinc-400">
            {city ? city.name : "—"}
            {SHOW_ACTIVITY_STARS && (
              <>
                {" "}·{" "}
                <FaStar className="shrink-0 text-yellow-400" /> {starsOf(activity).toFixed(1)}
              </>
            )}
            {!HIDE_ACTIVITY_PRICES && (
              <>
                {" "}· {activity.cost === 0 ? "Δωρεάν" : `€${activity.cost}`}
              </>
            )}
          </span>
        </span>
        <span className={`self-end ${buttonStyles.underline}`}>
          δες περισσότερα
        </span>
      </span>
    </button>
  );
}
