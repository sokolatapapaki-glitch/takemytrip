// Leaflet divIcons for the map markers. Using HTML divIcons (rather than image
// markers) sidesteps Leaflet's broken default-marker-asset path under bundlers,
// and lets the markers match the app's glassmorphism look. Imported only from
// the client-only (ssr:false) map chunk, so `leaflet` never loads on the server.
import L from "leaflet";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { IconType } from "react-icons";
import { FaLocationDot } from "react-icons/fa6";

// react-icons are React components, but Leaflet divIcons take an HTML string, so
// we render each icon to static SVG markup. The pin is the same everywhere; the
// vibe icons repeat across markers, so cache their markup by component.
const CITY_PIN_SVG = renderToStaticMarkup(createElement(FaLocationDot, { size: 13 }));

const vibeSvgCache = new Map<IconType, string>();
function vibeSvg(Icon: IconType): string {
  let svg = vibeSvgCache.get(Icon);
  if (svg === undefined) {
    svg = renderToStaticMarkup(createElement(Icon, { size: 16 }));
    vibeSvgCache.set(Icon, svg);
  }
  return svg;
}

// A round activity pin with a vibe icon. Pops in via the shared `marker-pop`.
export function activityIcon(Icon: IconType, active = false, hovered = false): L.DivIcon {
  const innerColor = active
    ? "text-orange-500"
    : hovered
    ? "text-emerald-500"
    : "text-zinc-700";
  const innerBorder = active
    ? "border-orange-300"
    : hovered
    ? "border-emerald-300"
    : "border-white/70";
  const outerShadow = active ? "shadow-orange-200/50" : "shadow-slate-900/10";

  return L.divIcon({
    className: "", // clear Leaflet's default styling
    html: `<div class="animate-marker-pop relative flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/95 shadow-md ${outerShadow} backdrop-blur-sm"><div class="flex h-8 w-8 items-center justify-center rounded-full border ${innerBorder} bg-white ${innerColor}">${vibeSvg(Icon)}</div></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    tooltipAnchor: [0, -20],
  });
}

// A city label (green pin icon + name) shown when zoomed out, sitting on a
// low-opacity white plate so it stays readable over the map. An outer wrapper
// centres it on the point via a translate (so width can vary), while the inner
// row keeps the pop animation.
export function cityIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width: max-content; transform: translate(-50%, -50%)"><div class="flex items-center gap-1 whitespace-nowrap rounded-full bg-white/40 px-2.5 py-1 text-xs font-semibold text-zinc-800 backdrop-blur-sm"><span class="text-emerald-500">${CITY_PIN_SVG}</span>${name}</div></div>`,
    iconSize: [0, 0], // 0×0 origin; the wrapper's translate centres the content
    iconAnchor: [0, 0],
  });
}
