"use client";

// Personal start point (#3, option b): a free-text search for an ADDRESS or a
// HOTEL/POI name, geocoded with Nominatim (OpenStreetMap) — free, no API key.
// Shows up to 5 autocomplete suggestions; picking one (click or Enter) returns
// that point's name + coordinates to the caller. Used on the plan-page filter
// sidebar AND in the homepage destination modal.
//
// Restriction: when `near` is given, results are bounded to a box around that
// point (Nominatim viewbox + bounded=1) and the query is biased with `cityName`,
// so suggestions stay within the chosen destination.
//
// Nominatim usage policy: low volume only, ~1 req/sec — we debounce typing and
// abort stale requests so we never burst.

import { useEffect, useRef, useState } from "react";
import { FaLocationDot, FaMagnifyingGlass } from "react-icons/fa6";

export type StartPoint = { name: string; coords: { lat: number; lng: number } };

type Suggestion = StartPoint;

// The (subset of the) Nominatim search result we read.
type NominatimResult = { lat: string; lon: string; display_name: string };

// Half-size of the bounding box (degrees) used to restrict results around `near`.
// ~0.2° ≈ 20km — covers a city and its near suburbs.
const BOX_HALF_DEG = 0.2;

export function StartPointSearch({
  cityName,
  near,
  currentLabel,
  autoFocus = false,
  onSelect,
}: {
  cityName?: string; // appended to the query to bias results to the trip's city
  near?: { lat: number; lng: number }; // restrict results to a box around here
  currentLabel?: string; // a 📍 line for the already-chosen point (optional)
  autoFocus?: boolean;
  onSelect: (point: StartPoint) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced geocoding: only fire ~450ms after the last keystroke, and abort any
  // in-flight request so a slow earlier query can't overwrite a newer one.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const full = cityName ? `${q}, ${cityName}` : q;
      const params = new URLSearchParams({
        format: "jsonv2",
        limit: "5",
        addressdetails: "1",
        q: full,
      });
      if (near) {
        // viewbox = left,top,right,bottom = minLon,maxLat,maxLon,minLat
        params.set(
          "viewbox",
          `${near.lng - BOX_HALF_DEG},${near.lat + BOX_HALF_DEG},${near.lng + BOX_HALF_DEG},${near.lat - BOX_HALF_DEG}`
        );
        params.set("bounded", "1");
      }
      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
      fetch(url, { signal: ctrl.signal, headers: { "Accept-Language": "el" } })
        .then((res) => (res.ok ? (res.json() as Promise<NominatimResult[]>) : []))
        .then((data) => {
          const mapped = (Array.isArray(data) ? data : [])
            .map((d) => ({
              name: d.display_name,
              coords: { lat: parseFloat(d.lat), lng: parseFloat(d.lon) },
            }))
            .filter(
              (s) => Number.isFinite(s.coords.lat) && Number.isFinite(s.coords.lng)
            )
            .slice(0, 5);
          setSuggestions(mapped);
          setActiveIdx(0);
          setOpen(true);
        })
        .catch((err: unknown) => {
          if (!(err instanceof DOMException && err.name === "AbortError")) {
            setSuggestions([]);
          }
        })
        .finally(() => setLoading(false));
    }, 450);
    return () => clearTimeout(timer);
  }, [query, cityName, near]);

  const choose = (s: Suggestion) => {
    // A short label (first comma-separated chunk — the street or POI name) reads
    // better on the marker / field than the full address.
    const short = s.name.split(",")[0].trim() || s.name;
    onSelect({ name: short, coords: s.coords });
    setQuery(short);
    setSuggestions([]);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Enter selects the first (or arrow-highlighted) suggestion.
      e.preventDefault();
      if (suggestions.length > 0) {
        choose(suggestions[Math.min(activeIdx, suggestions.length - 1)]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 rounded-lg border border-black/[.08] bg-white px-3 py-2 transition-colors focus-within:border-orange-300 dark:border-white/[.145] dark:bg-zinc-900">
        <FaMagnifyingGlass className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <input
          type="text"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Διεύθυνση ή όνομα ξενοδοχείου"
          className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-300"
        />
        {loading && (
          <span
            aria-hidden
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500"
          />
        )}
      </div>

      {/* The already-chosen point (when one is set and the list isn't showing). */}
      {currentLabel && !(open && suggestions.length > 0) && (
        <p className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
          <FaLocationDot className="h-3 w-3 shrink-0" />
          <span className="truncate">{currentLabel}</span>
        </p>
      )}

      {/* Suggestions render in normal flow (not absolute), so they never get
          clipped inside an overflow-hidden dropdown and the container just grows. */}
      {open && suggestions.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          {suggestions.map((s, i) => (
            <li key={`${s.coords.lat},${s.coords.lng},${i}`}>
              <button
                type="button"
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => choose(s)}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors ${i === activeIdx
                  ? "bg-orange-50 text-orange-800 dark:bg-zinc-800 dark:text-orange-300"
                  : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
              >
                <FaLocationDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span className="line-clamp-2">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
