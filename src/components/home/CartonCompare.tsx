import { dimsOf } from "@/lib/catalog";
import { dims as fmtDims } from "@/lib/format";
import type { EvaluatedSetup } from "@/lib/types";

const U = 10; // viewBox units per inch: both cartons share one scale, so the size difference is true
const GAP = 3; // inches between the two cartons

function Carton({ setup, x, y, id }: { setup: EvaluatedSetup; x: number; y: number; id: string }) {
  const d = dimsOf(setup.parts.outer)!;
  const L = d.length * U;
  const W = d.width * U;
  const wall = 0.3 * U;
  const hasFill = setup.parts.fill !== null && setup.voidVolume_in3 > 0;
  // Centre the product block: loose fill and a fitted insert both hold it in the middle, not in a corner.
  const right = Math.max(...setup.placements.map((p) => p.x + p.dims.length));
  const bottom = Math.max(...setup.placements.map((p) => p.y + p.dims.width));
  const shiftX = Math.max(0, (d.length - right) / 2) * U;
  const shiftY = Math.max(0, (d.width - bottom) / 2) * U;
  return (
    <g transform={`translate(${x * U} ${y * U})`}>
      <rect width={L} height={W} fill="var(--kraft)" fillOpacity="0.55" stroke="var(--bark)" strokeWidth="2.5" />
      <rect x={wall} y={wall} width={L - 2 * wall} height={W - 2 * wall} fill="var(--surface)" stroke="var(--bark)" strokeOpacity="0.45" strokeWidth="1" />
      {hasFill && <rect x={wall} y={wall} width={L - 2 * wall} height={W - 2 * wall} fill={`url(#peanuts-${id})`} />}
      {setup.placements.map((p, i) => (
        <rect
          key={i}
          x={p.x * U + shiftX}
          y={p.y * U + shiftY}
          width={p.dims.length * U}
          height={p.dims.width * U}
          rx="3"
          fill="var(--forest)"
          stroke="var(--surface)"
          strokeWidth="1.5"
        />
      ))}
    </g>
  );
}

/**
 * Two cartons from above, drawn to the same scale: today's setup and the right-sized one, with the product
 * inside and loose fill shown as dots. Everything is read from the evaluated setups.
 */
export function CartonCompare({ today, swap }: { today: EvaluatedSetup; swap?: EvaluatedSetup }) {
  const a = dimsOf(today.parts.outer)!;
  const b = swap ? dimsOf(swap.parts.outer)! : null;
  const H = Math.max(a.width, b?.width ?? 0);
  const width = (a.length + (b ? GAP + b.length : 0)) * U;
  const height = H * U;
  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={
          b
            ? `Top view of two cartons at the same scale. Today: ${fmtDims(a)} inches. Right-sized: ${fmtDims(b)} inches.`
            : `Top view of today's carton, ${fmtDims(a)} inches.`
        }
      >
        <defs>
          {["a", "b"].map((id) => (
            <pattern key={id} id={`peanuts-${id}`} width="9" height="9" patternUnits="userSpaceOnUse">
              <circle cx="2.5" cy="2.5" r="1.7" fill="var(--bark)" fillOpacity="0.4" />
              <circle cx="7" cy="6.5" r="1.4" fill="var(--bark)" fillOpacity="0.3" />
            </pattern>
          ))}
        </defs>
        <Carton setup={today} x={0} y={H - a.width} id="a" />
        {swap && b && <Carton setup={swap} x={a.length + GAP} y={H - b.width} id="b" />}
      </svg>
    </figure>
  );
}
