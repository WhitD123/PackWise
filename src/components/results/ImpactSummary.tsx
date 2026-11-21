import Link from "next/link";

import { num, pounds } from "@/lib/format";
import { projectSwap } from "@/lib/impact/projection";
import type { ScoredSetup, Swap } from "@/lib/types";

/**
 * "If N similar sellers made the same swap", with the math shown. One seller's own numbers times N:
 * an illustration, not a forecast. The formula and its caveats are on the "How we calculate this" page.
 */
export function ImpactSummary({
  swap,
  current,
  ordersPerYear,
  usParcelsBillion,
  parcelYear,
}: {
  swap: Swap;
  current: ScoredSetup;
  ordersPerYear: number;
  usParcelsBillion: number;
  parcelYear: number;
}) {
  const p = projectSwap(current, swap.option, ordersPerYear, usParcelsBillion * 1e9);
  if (p.plasticAvoidedLbPerSeller <= 0) return null;
  return (
    <div className="rounded-sm bg-forest p-6 text-paper">
      <p className="text-base text-kraft">If {num(p.sellers)} similar sellers made this swap</p>
      <p className="mt-2 font-serif text-4xl font-semibold">{num(p.plasticAvoidedUsTons, 1)} tons of plastic avoided a year</p>
      <p className="mt-3 text-sm text-paper/80">
        {pounds(p.plasticAvoidedLbPerSeller)} per seller ({num(ordersPerYear)} orders a year) × {num(p.sellers)} sellers ={" "}
        {num(p.plasticAvoidedLb)} lb ≈ {num(p.plasticAvoidedUsTons, 1)} US tons.
      </p>
      <p className="mt-2 text-sm text-paper/80">
        Paper and other non-plastic packaging: {num(Math.abs(p.nonPlasticAddedLb))} lb {p.nonPlasticAddedLb < 0 ? "less" : "more"} a
        year. Those {num(p.sellers * ordersPerYear)} orders are {num(p.parcelShare * 100, 1)}% of the {num(usParcelsBillion, 1)} billion
        parcels shipped in the US in {parcelYear}.
      </p>
      <p className="mt-3 text-xs text-paper/70">
        An illustration: one seller&rsquo;s numbers times {num(p.sellers)}. It does not predict that sellers will switch.{" "}
        <Link href="/how-it-works#impact" className="underline underline-offset-2">
          How we calculate this
        </Link>
      </p>
    </div>
  );
}
