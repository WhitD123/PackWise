import { FiveFactorLabel } from "@/components/label/FiveFactorLabel";
import { dims } from "@/lib/format";
import type { PlanPicks } from "@/lib/planner/planPackaging";
import type { ScoredSetup } from "@/lib/types";

const PICK_LABELS: Record<keyof PlanPicks, string> = {
  cheapest: "Cheapest",
  bestBalance: "Best balance",
  lowestWaste: "Lowest waste",
};

function extras(o: ScoredSetup): string {
  const parts = [o.parts.insert, o.parts.wrap, o.parts.fill].filter((p) => p !== null);
  return parts.length ? `with ${parts.map((p) => p!.name.toLowerCase()).join(" and ")}` : "nothing inside";
}

/** The three planner picks side by side. A setup that wins twice is shown once with both badges. */
export function OptionsCompare({ picks }: { picks: PlanPicks }) {
  const columns: { option: ScoredSetup; badges: string[] }[] = [];
  for (const k of ["bestBalance", "cheapest", "lowestWaste"] as (keyof PlanPicks)[]) {
    const existing = columns.find((c) => c.option.key === picks[k].key);
    if (existing) existing.badges.push(PICK_LABELS[k]);
    else columns.push({ option: picks[k], badges: [PICK_LABELS[k]] });
  }

  return (
    <div className={`grid gap-6 ${columns.length === 3 ? "lg:grid-cols-3" : columns.length === 2 ? "md:grid-cols-2" : ""}`}>
      {columns.map(({ option, badges }) => (
        <div key={option.key} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span key={b} className="rounded-sm bg-forest px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-paper">
                {b}
              </span>
            ))}
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-snug">{option.parts.outer.name}</h3>
            <p className="text-sm text-muted">
              {extras(option)} · ships at {dims(option.shippedDims)}
            </p>
          </div>
          <FiveFactorLabel option={option} />
        </div>
      ))}
    </div>
  );
}
