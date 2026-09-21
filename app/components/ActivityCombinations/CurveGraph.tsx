import type { Params, ScaleScore } from "./core/curves.functions";

// Compact, control-free score curve — plots score (y) vs index value (x) for
// each of the given option targets (one line per target, plus a dashed marker).
const W = 320;
const H = 150;
const PAD = 26;
const MIN = 0;
const MAX = 10;
const STEP = 0.2;

const xOf = (value: number) => PAD + (value / MAX) * (W - 2 * PAD);
const yOf = (score: number) => H - PAD - (score / MAX) * (H - 2 * PAD);

function pathFor(fn: ScaleScore, target: number, params: Params): string {
  const points: string[] = [];
  for (let v = MIN; v <= MAX + 1e-9; v += STEP) {
    const score = Math.max(MIN, Math.min(MAX, fn(v, target, params)));
    points.push(`${xOf(v).toFixed(1)},${yOf(score).toFixed(1)}`);
  }
  return "M" + points.join(" L");
}

const TICKS = [0, 5, 10];

export function CurveGraph({
  fn,
  params,
  targets,
  color = "#3b82f6",
  points = [],
}: {
  fn: ScaleScore;
  params: Params;
  targets: number[];
  color?: string;
  // Where the current combo actually lands: each {value, score} is drawn as a
  // dot on the curve with guide lines, so you can read the index→score mapping.
  points?: { value: number; score: number }[];
}) {
  // De-duplicate targets (e.g. all vibe options share target 10).
  const uniqueTargets = Array.from(new Set(targets));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full rounded-lg border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-900"
    >
      {/* gridlines */}
      {TICKS.map((t) => (
        <g key={t}>
          <line
            x1={xOf(t)}
            y1={yOf(0)}
            x2={xOf(t)}
            y2={yOf(10)}
            className="stroke-black/[.05] dark:stroke-white/[.08]"
          />
          <line
            x1={xOf(0)}
            y1={yOf(t)}
            x2={xOf(10)}
            y2={yOf(t)}
            className="stroke-black/[.05] dark:stroke-white/[.08]"
          />
          <text
            x={xOf(t)}
            y={H - PAD + 14}
            textAnchor="middle"
            className="fill-zinc-400 text-[9px] dark:fill-zinc-500"
          >
            {t}
          </text>
        </g>
      ))}

      {/* target markers */}
      {uniqueTargets.map((t, i) => (
        <line
          key={`t${i}`}
          x1={xOf(t)}
          y1={yOf(0)}
          x2={xOf(t)}
          y2={yOf(10)}
          strokeDasharray="3 3"
          className="stroke-zinc-300 dark:stroke-zinc-600"
        />
      ))}

      {/* one curve per target */}
      {uniqueTargets.map((t, i) => (
        <path
          key={`c${i}`}
          d={pathFor(fn, t, params)}
          fill="none"
          stroke={color}
          strokeWidth={1.75}
          opacity={uniqueTargets.length > 1 ? 0.8 : 1}
        />
      ))}

      {/* the combo's actual landing point(s): value on x, score on y */}
      {points.map((pt, i) => {
        const px = xOf(Math.max(MIN, Math.min(MAX, pt.value)));
        const py = yOf(Math.max(MIN, Math.min(MAX, pt.score)));
        return (
          <g key={`p${i}`}>
            <line x1={px} y1={yOf(0)} x2={px} y2={py} className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth={0.75} />
            <line x1={xOf(0)} y1={py} x2={px} y2={py} className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth={0.75} />
            <circle cx={px} cy={py} r={3.5} fill={color} stroke="#fff" strokeWidth={1} />
          </g>
        );
      })}
    </svg>
  );
}
