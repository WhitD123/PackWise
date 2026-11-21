// Runs the coverage check for one packaging setup, from the planner's answers
// (CLAUDE.md section 8). Used by the results page for "before" and "after" a swap.
//
// Packaging per order = the setup's parts (box, fill, wrap, insert) + the product's own
// packaging (jar, lid). The "treat the jar as product" toggle leaves the jar and lid out.

import type { AppData } from "../data.ts";
import { productPackagingGramsPerOrder, type PlannerInput } from "../planner/plannerInput.ts";
import type { EvaluatedSetup } from "../types.ts";
import { checkCoverage } from "./checkCoverage.ts";
import type { CoverageResult } from "./types.ts";

export interface CoverageOptions {
  /** false = treat the candle jar and lid as part of the product, not packaging. */
  includeCandleContainer: boolean;
  /** Check a different revenue (the "smaller seller" view). California sales scale with it. */
  revenueOverrideUsd?: number;
}

/** Grams per order by material: the setup's parts plus the product's own packaging. */
export function gramsPerOrderByMaterial(
  setup: EvaluatedSetup,
  input: PlannerInput,
  includeCandleContainer: boolean,
): Record<string, number> {
  const grams: Record<string, number> = {};
  const add = (material: string, g: number) => {
    grams[material] = (grams[material] ?? 0) + g;
  };
  for (const u of setup.usage) add(u.component.material, u.weight_g);
  for (const [material, g] of Object.entries(productPackagingGramsPerOrder(input, includeCandleContainer))) add(material, g);
  return grams;
}

/** Orders delivered to each state per year: the full order mix if known, else the fee-state shares. */
export function ordersPerYearByState(input: PlannerInput): Record<string, number> {
  const pct = input.orderStatePercent ?? input.statePercent;
  return Object.fromEntries(Object.entries(pct).map(([s, p]) => [s, ((p || 0) / 100) * input.ordersPerYear]));
}

export function coverageForSetup(
  setup: EvaluatedSetup,
  input: PlannerInput,
  data: AppData,
  opts: CoverageOptions,
): CoverageResult[] {
  const revenue = opts.revenueOverrideUsd ?? input.revenueUsd ?? null;
  let californiaSales = input.californiaSalesUsd ?? null;
  if (opts.revenueOverrideUsd !== undefined && californiaSales !== null && input.revenueUsd) {
    californiaSales *= opts.revenueOverrideUsd / input.revenueUsd;
  }
  return checkCoverage(
    data.coverageRules,
    {
      seller: { worldwideRevenueUsd: revenue, californiaSalesUsd: californiaSales },
      ordersPerYearByState: ordersPerYearByState(input),
      packagingGramsPerOrderByMaterial: gramsPerOrderByMaterial(setup, input, opts.includeCandleContainer),
    },
    data.coverageSchedules,
  );
}
