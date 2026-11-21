// Packaging planner: given an order, return three setups:
// cheapest, best balance, and lowest waste (brief feature 2).
//
// 1. Measure every allowed outer x insert x wrap x fill combination that fits.
// 2. Drop anything below the minimum protection for the product. If nothing is
//    left, return no picks (never recommend an unsafe setup).
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
  /** True when setups fit but none met the minimum protection, so there are no picks. */
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
  const noSafeOption = fitting.length > 0 && safe.length === 0;

  // Ties on overall go to less waste, then lower cost (scoring-spec.md section 5).
  const byBalance = (a: ScoredSetup, b: ScoredSetup) =>
    b.score.overall - a.score.overall || a.values.waste - b.values.waste || a.values.cost - b.values.cost;
  const options = scoreOptions(paretoFilter(safe), weights).sort(byBalance);
  if (options.length === 0) {
    return { fragility, options, picks: null, noSafeOption, fittingCount: fitting.length };
  }

  const first = (order: (a: ScoredSetup, b: ScoredSetup) => number) => [...options].sort(order)[0];
  const picks: PlanPicks = {
    cheapest: first((a, b) => a.values.cost - b.values.cost || a.values.waste - b.values.waste),
    bestBalance: options[0],
    lowestWaste: first((a, b) => a.values.waste - b.values.waste || a.values.cost - b.values.cost),
  };
  return { fragility, options, picks, noSafeOption, fittingCount: fitting.length };
}
