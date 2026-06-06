// Leaflet divIcons for the map markers. Using HTML divIcons (rather than image
// markers) sidesteps Leaflet's broken default-marker-asset path under bundlers,
// and lets the markers match the app's glassmorphism look. Imported only from
// the client-only (ssr:false) map chunk, so `leaflet` never loads on the server.
import L from "leaflet";

// A round activity pin with a vibe emoji. Pops in via the shared `marker-pop`.
export function activityIcon(emoji: string, active = false): L.DivIcon {
  return L.divIcon({
    className: "", // clear Leaflet's default styling
    html: `<div class="animate-marker-pop flex h-8 w-8 items-center justify-center rounded-full border ${
      active ? "border-orange-400 bg-orange-500 text-white" : "border-white/70 bg-white/90 text-zinc-700"
    } text-base shadow-md shadow-orange-900/10 backdrop-blur">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    tooltipAnchor: [0, -16],
  });
}

// A labelled city pill (name + activity count) shown when zoomed out. The pill
// auto-sizes to the city name; an outer wrapper centres it on the point via a
// translate (so width can vary), while the inner pill keeps the pop animation.
export function cityIcon(name: string, count: number): L.DivIcon {
  const badge =
    count > 0
      ? `<span class="ml-1.5 rounded-full bg-orange-500 px-1.5 text-[10px] font-semibold text-white">${count}</span>`
      : "";
  return L.divIcon({
    className: "",
    html: `<div style="width: max-content; transform: translate(-50%, -50%)"><div class="animate-marker-pop flex items-center whitespace-nowrap rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-md shadow-orange-900/10 backdrop-blur">${name}${badge}</div></div>`,
    iconSize: [0, 0], // 0×0 origin; the wrapper's translate centres the content
    iconAnchor: [0, 0],
  });
}
