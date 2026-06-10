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

// A round activity pin with a vibe icon: a single compact white circle (no
// inner ring), so the padding around the icon stays tight. Hover changes ONLY
// the icon color (green); the selected pin's icon is orange. Pops in via the
// shared `marker-pop`.
export function activityIcon(Icon: IconType, active = false, hovered = false): L.DivIcon {
  const iconColor = active
    ? "text-orange-500"
    : hovered
    ? "text-emerald-500"
    : "text-zinc-700";

  return L.divIcon({
    className: "", // clear Leaflet's default styling
    html: `<div class="animate-marker-pop flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md shadow-slate-900/10 ${iconColor}">${vibeSvg(Icon)}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    tooltipAnchor: [0, -14],
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
