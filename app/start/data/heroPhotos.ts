// -----------------------------------------------------------------------------
// Hero background photos (homepage trip-search)
// -----------------------------------------------------------------------------
// Builds the faded, slowly-drifting background images shown behind the search
// bar. Photos reflect the ACTIVITIES of the chosen city; with nothing chosen
// yet, it shows one iconic shot from each of the first few cities.
//
// Images come from Unsplash's keyword "source" endpoint (no API key, not
// curated — each URL redirects to a random photo for the query). Rendered with a
// plain <img>, so no next/image remote-domain config is needed.
import { CITIES } from "../../components/ActivityCombinations/core/cities.data";

// Never show more than this many background photos (per the homepage spec).
export const MAX_HERO_PHOTOS = 5;

// The Unsplash search terms for a destination id (or null = nothing picked yet).
function heroPhotoQueries(destinationId: string | null): string[] {
  if (destinationId) {
    const city = CITIES.find((c) => c.id === destinationId);
    if (city) {
      // Prefer the city's most must-see activities (highest priority first).
      const top = [...city.activities]
        .sort((a, b) => b.priority - a.priority)
        .slice(0, MAX_HERO_PHOTOS)
        .map((a) => `${a.name}, ${city.name}`);
      if (top.length > 0) return top;
      // City has no catalogue yet → generic-but-on-theme shots of the place.
      return [
        `${city.name} ${city.country} landmark`,
        `${city.name} old town`,
        `${city.name} street`,
        `${city.name} food`,
        `${city.name} skyline`,
      ];
    }
  }

  // Nothing chosen: one landmark each from the first few cities.
  return CITIES.filter((c) => c.kind === "city")
    .slice(0, MAX_HERO_PHOTOS)
    .map((c) => `${c.name} ${c.country} landmark`);
}

// Up to MAX_HERO_PHOTOS Unsplash image URLs for the chosen destination. `sig`
// keeps each slot a distinct photo (Unsplash dedupes identical query URLs).
export function heroPhotoUrls(destinationId: string | null): string[] {
  return heroPhotoQueries(destinationId)
    .slice(0, MAX_HERO_PHOTOS)
    .map(
      (q, i) =>
        `https://source.unsplash.com/random/1000x800/?${encodeURIComponent(q)}&sig=${i}`
    );
}
