import { routeLinearity, type Coords } from "./core/activities.functions";

// One activity to plot: its name and map location, already in time order.
export type Stop = { name: string; coords: Coords };

// viewBox dimensions (the SVG scales to its container width).
const W = 340;
const H = 240;
const PAD = 30; // keep markers/labels off the edges

// A blank-grid mini-map of a combo: each activity is a numbered dot at its
// scaled position, joined by a line in the order the day visits them. No real
// map, city, or lunch slot — just relative positions and the route order.
//
// Positions use a uniform scale (longitude compressed by cos(lat)) so the
// shape isn't distorted, then centred in the grid. Lunch is excluded by the
// caller — `stops` is already the lunch-free, time-ordered list.
export function ComboMap({ stops }: { stops: Stop[] }) {
  if (stops.length === 0) return null;

  // Project lat/lng to a flat, aspect-correct plane (x east, y north).
  const lats = stops.map((s) => s.coords.lat);
  const meanLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const kx = Math.cos((meanLat * Math.PI) / 180); // lng degrees are shorter
  const proj = stops.map((s) => ({ x: s.coords.lng * kx, y: s.coords.lat }));

  const xs = proj.map((p) => p.x);
  const ys = proj.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  const innerW = W - 2 * PAD;
  const innerH = H - 2 * PAD;

  // Single uniform scale that fits both axes; fall back to 1 for a lone point.
  const scaleX = rangeX > 0 ? innerW / rangeX : Infinity;
  const scaleY = rangeY > 0 ? innerH / rangeY : Infinity;
  const scale = Math.min(scaleX, scaleY);
  const s = Number.isFinite(scale) ? scale : 1;

  // Centre the drawn extent within the padded area.
  const offX = PAD + (innerW - rangeX * s) / 2;
  const offY = PAD + (innerH - rangeY * s) / 2;
  const pts = proj.map((p, i) => ({
    x: offX + (p.x - minX) * s,
    y: offY + (maxY - p.y) * s, // invert: north is up
    name: stops[i].name,
  }));

  const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Display-only index: how linear (un-backtracking) the visiting order is.
  const linearity = routeLinearity(stops.map((s) => s.coords));

  // Evenly spaced grid lines (8 cells each way).
  const gridXs = Array.from({ length: 9 }, (_, i) => (W / 8) * i);
  const gridYs = Array.from({ length: 9 }, (_, i) => (H / 8) * i);

  return (
    <div className="mt-3 rounded-lg border border-black/[.08] bg-white p-2 dark:border-white/[.145] dark:bg-zinc-950">
      <div className="mb-1 flex items-baseline justify-between px-1">
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Activities in visiting order
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Linearity{" "}
          <span className="font-mono font-medium text-zinc-700 dark:text-zinc-200">
            {linearity.toFixed(1)}
          </span>
          /10
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Map of the combo's activities in visiting order"
      >
        {/* Blank grid background. */}
        <g className="text-zinc-200 dark:text-zinc-800" stroke="currentColor" strokeWidth={0.5}>
          {gridXs.map((x) => (
            <line key={`vx${x}`} x1={x} y1={0} x2={x} y2={H} />
          ))}
          {gridYs.map((y) => (
            <line key={`hy${y}`} x1={0} y1={y} x2={W} y2={y} />
          ))}
        </g>

        {/* Route line in time order. */}
        {pts.length > 1 ? (
          <polyline
            points={polyline}
            fill="none"
            className="text-blue-500 dark:text-blue-400"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {/* Numbered activity markers + labels. */}
        {pts.map((p, i) => {
          const labelRight = p.x <= W / 2;
          return (
            <g key={p.name}>
              <circle
                cx={p.x}
                cy={p.y}
                r={7}
                className="fill-blue-600 dark:fill-blue-500"
              />
              <text
                x={p.x}
                y={p.y + 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={8}
                fill="#fff"
                fontWeight={600}
              >
                {i + 1}
              </text>
              <text
                x={labelRight ? p.x + 11 : p.x - 11}
                y={p.y + 0.5}
                textAnchor={labelRight ? "start" : "end"}
                dominantBaseline="middle"
                fontSize={8}
                className="fill-zinc-600 dark:fill-zinc-300"
              >
                {p.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
