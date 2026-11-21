import { dimsOf } from "@/lib/catalog";
import { dims as fmtDims } from "@/lib/format";
import type { EvaluatedSetup } from "@/lib/types";

/**
 * What goes with a carton drawing: its name and size, the empty space to fill, and the EU benchmark.
 * The drawing itself is CartonCompare, so both cartons share one scale.
 */
export function BoxFitCaption({
  title,
  option,
  euLimit,
}: {
  title: string;
  option: EvaluatedSetup;
  /** The EU's maximum empty space ratio (0 to 1) and the year it applies, shown as a benchmark. */
  euLimit?: { ratio: number; year: string };
}) {
  const c = option.parts.outer;
  const d = dimsOf(c)!;
  const isBox = c.type === "box";
  return (
    <div className="text-sm">
      <p className="font-semibold">{title}</p>
      <p className="text-muted">
        {c.name} ({fmtDims(c.type === "mailer" ? { ...d, height: 0 } : d)})
      </p>
      <p className="mt-2 text-muted">
        {isBox
          ? `${Math.round(option.voidVolume_in3)} cubic inches to fill around the items`
          : "Items lie flat inside the mailer"}
      </p>
      {isBox && option.emptySpaceRatio !== undefined && (
        <p className="mt-1 text-muted">
          Empty space: {Math.round(option.emptySpaceRatio * 100)}% of the box.
          {euLimit &&
            ` The EU's e-commerce packaging rule (from ${euLimit.year}) allows at most ${Math.round(euLimit.ratio * 100)}%, counting filler as empty. A benchmark, not a US law.`}
        </p>
      )}
    </div>
  );
}
