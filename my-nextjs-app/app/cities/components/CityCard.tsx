import Link from "next/link";
import { FaEuroSign, FaLocationDot, FaPlane } from "react-icons/fa6";
import type { City } from "@/app/components/ActivityCombinations/core/cities.data";
import {
  cityDescription,
  cityPriceTier,
  flightTimeFromAthens,
} from "./citiesData";

// A single city tile from the Penpot "Cities" board: image placeholder, name +
// country, description, a flight-time/price meta line, and a "See Activities"
// action. The action is a placeholder for now (no destination page yet).
export function CityCard({ city, index = 0 }: { city: City; index?: number }) {
  const tier = cityPriceTier(city);
  const flight = flightTimeFromAthens(city);
  return (
    <div
      style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
      className="animate-card-pop flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-lg shadow-orange-900/5 backdrop-blur-md transition-shadow hover:shadow-xl hover:shadow-orange-900/10"
    >
      {/* Image placeholder (no city image yet) — vivid gradient + pin icon. */}
      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-orange-400 via-amber-300 to-emerald-400">
        <FaLocationDot className="h-10 w-10 text-white drop-shadow" />
        {city.activities.length > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-zinc-700 backdrop-blur">
            {city.activities.length} activities
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold text-zinc-800">{city.name}</h3>
          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-400">
            {city.country}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500">{cityDescription(city)}</p>

        <div className="mb-4 mt-3 flex items-center gap-2 text-xs text-zinc-400">
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

        {/* See Activities — opens the activities list scoped to this city.
            mt-auto keeps it pinned to the bottom even when the text is short. */}
        <Link
          href={`/activities?city=${city.id}`}
          className="mt-auto block w-full rounded-full bg-orange-500 px-4 py-2 text-center text-sm font-medium text-white shadow-sm shadow-orange-900/10 transition-colors hover:bg-orange-600"
        >
          See Activities
        </Link>
      </div>
    </div>
  );
}
