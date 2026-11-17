import { dimsOf } from "@/lib/catalog";
import { dims as fmtDims } from "@/lib/format";
import type { EvaluatedSetup } from "@/lib/types";

const SCALE = 14; // px per inch
const PAD = 8;

/** Top-down view of the items inside the container. */
export function BoxFitDiagram({ title, option }: { title: string; option: EvaluatedSetup }) {
  const c = option.parts.outer;
  const d = dimsOf(c)!;
  const L = d.length;
  const W = d.width;
  const w = L * SCALE + PAD * 2;
  const h = W * SCALE + PAD * 2;
  const isBox = c.type === "box";

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm">
        <span className="font-semibold">{title}</span>
        <span className="text-muted"> · {c.name} ({fmtDims(c.type === "mailer" ? { ...d, height: 0 } : d)})</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full max-w-sm"
        role="img"
        aria-label={`${option.placements.length} item(s) inside ${c.name}, seen from above`}
      >
        {/* Container: kraft box or flat mailer outline */}
        <rect
          x={PAD}
          y={PAD}
          width={L * SCALE}
          height={W * SCALE}
          fill={isBox ? "var(--kraft)" : "var(--surface)"}
          fillOpacity={isBox ? 0.35 : 1}
          stroke="var(--bark)"
          strokeWidth={2}
          strokeDasharray={isBox ? undefined : "6 4"}
          rx={isBox ? 0 : 6}
        />
        {option.placements.map((p, i) => (
          <rect
            key={i}
            x={PAD + p.x * SCALE}
            y={PAD + p.y * SCALE}
            width={p.dims.length * SCALE}
            height={p.dims.width * SCALE}
            fill="var(--forest)"
            fillOpacity={0.85 - Math.min(p.z, 6) * 0.08}
            stroke="var(--paper)"
            strokeWidth={1.5}
          />
        ))}
      </svg>
      <p className="text-xs text-muted">
        {isBox
          ? `${Math.round(option.voidVolume_in3)} cubic inches to fill around the items`
          : "Items lie flat inside the mailer"}
      </p>
    </figure>
  );
}
