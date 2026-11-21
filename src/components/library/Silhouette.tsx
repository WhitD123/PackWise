import type { PackagingComponent } from "@/lib/types";

/** Pixels per inch, the same for every item on the page, so a 4 in box really looks a sixth the width of a 24 in mailer.
 *  At 4 px per inch the largest item (a 24 in mailer) just fits the 96 px frame. */
const PX_PER_IN = 4;
const BOX = 96;

/** A top view at one shared scale for boxes, mailers and inserts; a material swatch for fillers and wraps. */
export function Silhouette({ c }: { c: PackagingComponent }) {
  if (c.unit !== "each" || c.length_in === undefined || c.width_in === undefined) {
    const id = `sw-${c.id}`;
    return (
      <svg aria-hidden="true" viewBox="0 0 44 44" className="h-11 w-11">
        <defs>
          <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
            {c.type === "wrap" ? (
              <circle cx="4" cy="4" r="2.6" fill="none" stroke="var(--bark)" strokeWidth="1" />
            ) : (
              <>
                <circle cx="2.5" cy="2.5" r="1.6" fill="var(--bark)" fillOpacity="0.55" />
                <circle cx="6.5" cy="6" r="1.3" fill="var(--bark)" fillOpacity="0.4" />
              </>
            )}
          </pattern>
        </defs>
        <rect x="1" y="1" width="42" height="42" fill="var(--surface)" stroke="var(--bark)" strokeWidth="1" />
        <rect x="1" y="1" width="42" height="42" fill={`url(#${id})`} />
      </svg>
    );
  }
  const L = Math.min(c.length_in * PX_PER_IN, BOX - 2);
  const W = Math.min(c.width_in * PX_PER_IN, BOX - 2);
  const isMailer = c.type === "mailer";
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${BOX} ${BOX}`} className="h-24 w-24">
      <rect
        x={(BOX - L) / 2}
        y={(BOX - W) / 2}
        width={L}
        height={W}
        rx={isMailer ? 4 : 0}
        fill={c.type === "insert" ? "var(--surface)" : "var(--kraft)"}
        fillOpacity={isMailer ? 0.35 : 0.6}
        stroke="var(--bark)"
        strokeWidth={1.5}
        strokeDasharray={isMailer ? "4 3" : undefined}
      />
      {c.fitted_insert &&
        Array.from({ length: c.fitted_insert.cells }).map((_, i) => {
          const cl = c.fitted_insert!.cell_length_in * PX_PER_IN;
          const cw = c.fitted_insert!.cell_width_in * PX_PER_IN;
          const gap = (L - cl * c.fitted_insert!.cells) / (c.fitted_insert!.cells + 1);
          return (
            <circle
              key={i}
              cx={(BOX - L) / 2 + gap * (i + 1) + cl * i + cl / 2}
              cy={BOX / 2}
              r={Math.min(cl, cw) / 2}
              fill="var(--forest)"
              fillOpacity={0.85}
            />
          );
        })}
    </svg>
  );
}
