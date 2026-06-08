import Link from "next/link";
import { FaEuroSign, FaLocationDot, FaPlane } from "react-icons/fa6";
import type { City } from "@/app/components/ActivityCombinations/core/cities.data";
import {
  cityDescription,
  cityImage,
  cityPriceTier,
  flightTimeFromAthens,
} from "./citiesData";
import { buttonStyles } from "@/app/components/ui/buttonStyles";

// A single city tile from the Penpot "Cities" board: image placeholder, name +
// country, description, a flight-time/price meta line, and a "See Activities"
// action. The action is a placeholder for now (no destination page yet).
export function CityCard({ city, index = 0 }: { city: City; index?: number }) {
  const tier = cityPriceTier(city);
  const flight = flightTimeFromAthens(city);
  const image = cityImage(city);
  return (
    <Link
      href={`/activities?city=${city.id}`}
      style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
      className="animate-card-pop flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-lg shadow-orange-900/5 backdrop-blur-md transition duration-200 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/10"
    >
      {/* City photo over a gradient/pin fallback (shown while loading or if the
          city has no image). */}
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-orange-400 via-amber-300 to-emerald-400">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${city.name}, ${city.country}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <FaLocationDot className="h-10 w-10 text-white drop-shadow" />
        )}
        {city.activities.length > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-zinc-700 backdrop-blur">
            {city.activities.length} activities
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold text-zinc-800">{city.name}</h3>
          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-400">
            {city.country}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <FaPlane className="h-3 w-3 text-orange-400" />~{flight.label} from
            Athens
          </span>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1">
            {tier != null ? (
              <>
                <FaEuroSign className="h-3 w-3 text-emerald-500" />
                {tier}
              </>
            ) : (
              "Price coming soon"
            )}
          </span>
        </div>
        <p className="text-sm text-zinc-500">{cityDescription(city)}</p>

        {/* See Activities — opens the activities list scoped to this city.
            mt-auto keeps it pinned to the bottom even when the text is short. */}
        <div
          className={buttonStyles.secondary}
        >
          See Activities
        </div>
      </div>
    </Link>
  );
}
