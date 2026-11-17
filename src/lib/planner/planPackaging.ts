// Packaging planner: given an order, return three setups:
// cheapest, best balance, and lowest waste (brief feature 2).
//
// 1. Measure every allowed outer x insert x wrap x fill combination that fits.
// 2. Drop anything below the minimum protection for the product.
// 3. Drop anything beaten on every factor (Pareto filter).
// 4. Score the rest against each other and pick the three.

import { indexCatalog } from "../catalog.ts";
import { paretoFilter, scoreOptions } from "../scoring/fiveFactor.ts";
import { meetsMinimum } from "../scoring/protection.ts";
import { WEIGHT_PRESETS } from "../scoring/weights.ts";
import type { Catalog, Fragility, Product, ScoredSetup, SellerContext, Weights } from "../types.ts";
import { evaluateAll, expandOrder } from "./evaluateSetup.ts";

export interface PlanPicks {
  cheapest: ScoredSetup;
  bestBalance: ScoredSetup;
  lowestWaste: ScoredSetup;
}

export interface PlanResult {
  fragility: Fragility;
  /** Surviving options, best overall first. */
  options: ScoredSetup[];
  picks: PlanPicks | null;
  /** True when nothing met the minimum protection, so picks come from unsafe options. */
  noSafeOption: boolean;
  /** How many setups fit the order before filtering. */
  fittingCount: number;
}

export function planPackaging(
  products: Product[],
  catalog: Catalog,
  ctx: SellerContext,
  weights: Weights = WEIGHT_PRESETS.balanced,
): PlanResult {
  const { fragility } = expandOrder(products);
  const fitting = evaluateAll(products, indexCatalog(catalog), ctx);

  const safe = fitting.filter((e) => meetsMinimum(e.values.protection, fragility));
  const noSafeOption = safe.length === 0;
  const pool = noSafeOption ? fitting : safe;

  const options = scoreOptions(paretoFilter(pool), weights).sort((a, b) => b.score.overall - a.score.overall);
  if (options.length === 0) {
    return { fragility, options, picks: null, noSafeOption, fittingCount: fitting.length };
  }

  const first = (order: (a: ScoredSetup, b: ScoredSetup) => number) => [...options].sort(order)[0];
  const picks: PlanPicks = {
    cheapest: first((a, b) => a.values.cost - b.values.cost || b.score.overall - a.score.overall),
    bestBalance: options[0],
    lowestWaste: first((a, b) => a.values.waste - b.values.waste || a.values.cost - b.values.cost),
  };
  return { fragility, options, picks, noSafeOption, fittingCount: fitting.length };
}
