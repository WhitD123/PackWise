import { ScoreBar } from "@/components/ui/ScoreBar";
import { Warning } from "@/components/ui/Warning";
import { grams, num, usd, usdWhole } from "@/lib/format";
import { ZONE_SHORT } from "@/lib/shipping/getZone";
import type { ScoredSetup } from "@/lib/types";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Nutrition-label style scorecard for one packaging setup. */
export function FiveFactorLabel({ option }: { option: ScoredSetup }) {
  const s = option.score;
  // Waste first: the theme is waste (docs/scoring-spec.md).
  const rows: { label: string; value: string; score: number; detail?: string }[] = [
    {
      label: "Landfill waste",
      value: `${grams(s.waste.landfill_g_per_order)} / order`,
      score: s.waste.score,
      detail: `${grams(option.packagingWeight_g)} packaging, ${grams(s.plastic_g_per_order)} plastic`,
    },
    {
      label: "Cost",
      value: `${usd(s.cost.usd_per_order)} / order`,
      score: s.cost.score,
      detail: `${usd(option.packagingCost_usd)} packaging + ${usd(option.shippingCost_usd)} shipping (${num(option.billableWeight_lb, 1)} lb${
        option.shippingMethod === "cubic" ? ", Cubic price" : ""
      }, ${ZONE_SHORT[option.zoneLabel ?? "assumed"]})`,
    },
    { label: "Protection", value: capitalize(s.protection.level), score: s.protection.score },
    { label: "State fees", value: `${usdWhole(s.fees.usd_per_year)} / year`, score: s.fees.score },
    { label: "Carbon", value: `${num(s.carbon.kg_co2e_per_order * 1000, 0)} g CO2e / order`, score: s.carbon.score },
  ];

  return (
    <div className="w-full max-w-sm border-2 border-ink bg-surface p-3 font-sans text-ink">
      <div className="border-b-[length:var(--rule-thick)] border-ink pb-1">
        <div className="font-serif text-2xl font-bold leading-none">Packaging Facts</div>
        <div className="mt-1 text-xs">Per order, scored 0 to 10 against the other options</div>
      </div>
      <dl>
        {rows.map((r) => (
          <div key={r.label} className="border-b border-ink/60 py-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <dt className="font-bold">{r.label}</dt>
              <dd className="text-right">{r.value}</dd>
            </div>
            {r.detail && <div className="text-[11px] text-muted">{r.detail}</div>}
            <div className="mt-1 flex items-center gap-2">
              <ScoreBar score={r.score} />
              <span className="w-7 text-right text-xs tabular-nums">{num(r.score, 1)}</span>
            </div>
          </div>
        ))}
      </dl>
      <div className="flex items-baseline justify-between border-t-[length:var(--rule-thick)] border-ink pt-1">
        <span className="font-bold">Overall</span>
        <span className="font-serif text-xl font-bold tabular-nums">{num(s.overall, 1)} / 10</span>
      </div>
      {option.warnings.length > 0 && (
        <div className="mt-3 space-y-1">
          {option.warnings.map((w) => (
            <Warning key={w} className="text-xs">
              {w}
            </Warning>
          ))}
        </div>
      )}
    </div>
  );
}
