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

// Escape text before injecting it into the divIcon HTML string.
const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// A round activity pin with a vibe icon + the activity name beside it, shown the
// way Google Maps labels places: small dark text with a white halo so it reads
// over any tiles. The label is absolutely positioned, so it never shifts the
// pin off its coordinate. Hover changes ONLY the icon color (green); the
// selected pin's icon is orange. Pops in via the shared `marker-pop`.
export function activityIcon(
  Icon: IconType,
  name: string,
  active = false,
  hovered = false
): L.DivIcon {
  const iconColor = active
    ? "text-orange-500"
    : hovered
    ? "text-emerald-500"
    : "text-zinc-700";

  // White outline around the label (4 directional shadows) — the Google-Maps look.
  const halo =
    "text-shadow: -1px -1px 1.5px #fff, 1px -1px 1.5px #fff, -1px 1px 1.5px #fff, 1px 1px 1.5px #fff;";

  return L.divIcon({
    className: "", // clear Leaflet's default styling
    html: `<div class="animate-marker-pop relative">
      <div class="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md shadow-slate-900/10 ${iconColor}">${vibeSvg(Icon)}</div>
      <span class="absolute left-8 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-medium leading-none text-zinc-800 underline underline-offset-2" style="${halo}">${escapeHtml(name)}</span>
    </div>`,
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
