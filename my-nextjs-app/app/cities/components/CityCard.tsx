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
      className="group animate-card-pop flex flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-lg shadow-orange-900/5 backdrop-blur-md transition duration-200 ease-out hover:-translate-y-1 hover:rotate-1 hover:shadow-xl hover:shadow-orange-900/10"
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

      {/* `isolate` + `-z-10` keeps the decorative hover shapes BEHIND the text
          while still above the card's own background. */}
      <div className="relative isolate flex flex-1 flex-col p-4 gap-2">
        {/* Decorative accents — invisible until the card is hovered, then they
            fade/drift in behind the content: two concentric rings rising from
            the bottom-left corner, a tilted dash sweeping under the title, and
            a small trail of dots stepping down the right edge. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-16 -z-10 h-48 w-48 scale-75 rounded-full border-2 border-orange-500/20 opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-14 -left-10 -z-10 h-32 w-32 scale-75 rounded-full border-2 border-green-500/20 opacity-0 transition-all delay-75 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-9 -z-10 h-0.5 w-14 -rotate-[14deg] translate-y-1 rounded-full bg-orange-500/15 opacity-0 transition-all delay-100 duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-12 -z-10 h-1.5 w-1.5 scale-0 rounded-full bg-green-500/20 opacity-0 transition-all delay-100 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-8 top-[4.25rem] -z-10 h-2 w-2 scale-0 rounded-full bg-orange-500/15 opacity-0 transition-all delay-150 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-5 top-24 -z-10 h-1 w-1 scale-0 rounded-full bg-green-500/20 opacity-0 transition-all delay-200 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100"
        />
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
            mt-auto keeps it pinned to the bottom even when the text is short,
            so the gap below the button is identical on every card. */}
        <div className={`mt-auto pt-2 ${buttonStyles.secondary}`}>
          See Activities
        </div>
      </div>
    </Link>
  );
}
