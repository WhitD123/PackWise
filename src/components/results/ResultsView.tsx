"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { OptionsCompare } from "@/components/planner/OptionsCompare";
import { ButtonLink } from "@/components/ui/Button";
import { Card, SectionHeading } from "@/components/ui/Card";
import { describeSetup, indexCatalog, resolveSetup } from "@/lib/catalog";
import type { AppData } from "@/lib/data";
import { grams, usd, usdWhole } from "@/lib/format";
import { planPackaging } from "@/lib/planner/planPackaging";
import { currentSetup, defaultInput, toContext, toProducts, validateInput, type PlannerInput } from "@/lib/planner/plannerInput";
import { loadPlannerInput } from "@/lib/planner/storage";
import { rightSize } from "@/lib/rightsizing/rightSize";
import { PRESET_LABELS, WEIGHT_PRESETS } from "@/lib/scoring/weights";
import { rankSwaps } from "@/lib/swaps/rankSwaps";

import { BoxFitDiagram } from "./BoxFitDiagram";
import { ImpactSummary } from "./ImpactSummary";
import { SwapCard } from "./SwapCard";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ResultsView({ data }: { data: AppData }) {
  const [input, setInput] = useState<PlannerInput | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const saved = loadPlannerInput();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read from browser storage
    setInput(saved ?? defaultInput());
    setIsDemo(!saved);
  }, []);

  const results = useMemo(() => {
    if (!input || validateInput(input).length) return null;
    const products = toProducts(input);
    const ctx = toContext(input, data);
    const weights = WEIGHT_PRESETS[input.priority];
    const current = currentSetup(input);
    const currentParts = current ? resolveSetup(current, indexCatalog(data.catalog)) : null;
    return {
      ctx,
      plan: planPackaging(products, data.catalog, ctx, weights),
      current,
      currentParts,
      rightSize: current ? rightSize(products, current, data.catalog, ctx) : null,
      swaps: current ? rankSwaps(products, current, data.catalog, ctx, weights) : null,
    };
  }, [input, data]);

  if (!input) return <p className="text-muted">Working out your options…</p>;
  if (!results) {
    return (
      <Card>
        <p className="mb-4">Some planner answers are missing or invalid.</p>
        <ButtonLink href="/planner">Back to the planner</ButtonLink>
      </Card>
    );
  }

  const { plan, current, currentParts, rightSize: rs, swaps, ctx } = results;
  const productNames = input.lines
    .map((l) => (l.items_per_order > 1 ? `${l.items_per_order} × ${l.name}` : l.name))
    .join(", ");
  const currentName = currentParts ? describeSetup(currentParts) : null;

  return (
    <div className="space-y-14">
      <div>
        <h1 className="text-4xl font-semibold text-forest">Your packaging options</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted">
          For one order of {productNames}, shipping {input.ordersPerYear.toLocaleString("en-US")} orders a year.
          Ranked with “{PRESET_LABELS[input.priority]}”.
        </p>
        {isDemo && (
          <p className="mt-3 text-sm text-bark">
            Showing the demo seller (a candle brand).{" "}
            <Link href="/planner" className="underline">
              Enter your own products
            </Link>
            .
          </p>
        )}
      </div>

      <section>
        <SectionHeading
          title="Three ways to pack it"
          lead={`We tested ${plan.fittingCount} combinations of boxes, mailers, wraps, fills and inserts that fit this order and kept the ones that protect it well enough.`}
        />
        {plan.picks ? (
          <OptionsCompare picks={plan.picks} />
        ) : plan.noSafeOption ? (
          <Card>
            {plan.fittingCount} setups fit this order, but none in our library protects it well enough, so we
            aren&rsquo;t recommending any. Try a different fragility or add your own packaging.
          </Card>
        ) : (
          <Card>Nothing in our library fits this order. Try fewer items per order.</Card>
        )}
      </section>

      {current && (
        <section>
          <SectionHeading
            title="Right-sizing"
            lead="Carriers charge by box size as well as weight. A smaller container that still fits safely costs less to ship and needs less filler."
          />
          {!currentParts ? (
            <Card>We couldn’t find today’s packaging in our library, or the parts don’t go together.</Card>
          ) : !rs ? (
            <Card>Your order doesn’t fit in {currentName} as entered. Check the sizes in the planner.</Card>
          ) : (
            <Card>
              <div className="grid gap-8 md:grid-cols-2">
                <BoxFitDiagram title="Today" option={rs.current} />
                {rs.recommended ? (
                  <BoxFitDiagram title="Right-sized" option={rs.recommended} />
                ) : (
                  <p className="self-center text-muted">
                    {currentParts.outer.name} is already the smallest {currentParts.outer.type} in our library that
                    fits this order safely.
                  </p>
                )}
              </div>
              {!rs.currentHasPadding && (
                <p className="mt-4 text-sm text-ochre">
                  Today’s {currentParts.outer.type} leaves less padding than we recommend for fragile items.
                </p>
              )}
              {rs.recommended && (
                <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
                  <Fact
                    label="Shipping per order"
                    value={`${usd(rs.current.shippingCost_usd)} → ${usd(rs.recommended.shippingCost_usd)}`}
                  />
                  <Fact label="Saved per order" value={usd(rs.totalSavingsPerOrder_usd)} />
                  <Fact label="Saved per year" value={usdWhole(rs.totalSavingsPerYear_usd)} />
                  <Fact label="Less packaging per order" value={grams(rs.packagingSaved_g)} />
                </dl>
              )}
            </Card>
          )}
        </section>
      )}

      {swaps && (
        <section>
          <SectionHeading
            title="Better swaps"
            lead={`Compared with what you use today (${currentName}). We only suggest swaps that protect at least as well and cut plastic or landfill waste.`}
          />
          {!swaps.currentMeetsMinimum && (
            <p className="mb-4 rounded-sm border border-ochre/50 bg-ochre/10 p-3 text-sm">
              Your current setup is rated <strong>{capitalize(swaps.current.score.protection.level)}</strong>{" "}
              protection, which is below what we recommend for fragile items. It may look cheap and light, but these
              options protect the order properly.
            </p>
          )}
          {swaps.swaps.length === 0 ? (
            <Card>Nothing in our library beats your current setup with these priorities.</Card>
          ) : (
            <div className="space-y-4">
              {swaps.swaps.map((s, i) => (
                <SwapCard key={s.option.key} swap={s} current={swaps.current} rank={i + 1} />
              ))}
              <ImpactSummary swap={swaps.swaps[0]} ordersPerYear={ctx.ordersPerYear} />
            </div>
          )}
        </section>
      )}

      <p className="text-xs text-muted">
        Every number on this page is calculated from the packaging library, materials list, shipping rules and fee
        schedules. Prices, weights and some rates are estimates; see SOURCES.md.
      </p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-serif text-lg font-semibold">{value}</dd>
    </div>
  );
}
