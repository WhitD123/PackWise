import { Card } from "@/components/ui/Card";
import { describeSetup } from "@/lib/catalog";
import { Warning } from "@/components/ui/Warning";
import { pounds, usdWhole } from "@/lib/format";
import type { ScoredSetup, Swap } from "@/lib/types";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Stat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div>
      <div className={`font-serif text-2xl font-semibold ${good ? "text-moss" : "text-brick"}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

export function SwapCard({ swap, current, rank }: { swap: Swap; current: ScoredSetup; rank: number }) {
  const o = swap.option;
  return (
    <Card>
      <div className="mb-4 flex items-baseline gap-4">
        <span aria-hidden="true" className="font-serif text-3xl font-bold text-bark">
          {rank}
        </span>
        <div>
          <p className="text-xl font-semibold leading-snug text-forest">Switch to {describeSetup(o.parts)}</p>
          <p className="mt-1 text-sm text-muted">From {describeSetup(current.parts)}</p>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label={swap.usd_saved_per_year >= 0 ? "saved per year" : "extra cost per year"}
          value={usdWhole(Math.abs(swap.usd_saved_per_year))}
          good={swap.usd_saved_per_year >= 0}
        />
        <Stat
          label="plastic avoided per year"
          value={pounds(swap.plastic_avoided_lb_per_year)}
          good={swap.plastic_avoided_lb_per_year >= 0}
        />
        <Stat
          label={swap.landfill_avoided_lb_per_year >= 0 ? "less to landfill per year" : "more to landfill per year"}
          value={pounds(Math.abs(swap.landfill_avoided_lb_per_year))}
          good={swap.landfill_avoided_lb_per_year >= 0}
        />
        <Stat
          label={swap.fees_saved_usd_per_year >= 0 ? "lower state fees per year" : "higher state fees per year"}
          value={usdWhole(Math.abs(swap.fees_saved_usd_per_year))}
          good={swap.fees_saved_usd_per_year >= 0}
        />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          Protection: {capitalize(current.score.protection.level)} → <strong>{capitalize(o.score.protection.level)}</strong>
        </span>
        <span>
          Overall score: {current.score.overall.toFixed(1)} → <strong>{o.score.overall.toFixed(1)}</strong> (
          {swap.score_change >= 0 ? "+" : ""}
          {swap.score_change.toFixed(1)})
        </span>
      </div>
      {swap.tradeoffs.length > 0 && <p className="mt-2 text-sm text-muted">Trade-offs: {swap.tradeoffs.join("; ")}.</p>}
      {o.warnings.length > 0 && <Warning className="mt-3 text-xs">{o.warnings.join(" ")}</Warning>}
    </Card>
  );
}
