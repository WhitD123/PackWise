// Swap suggestions (brief feature 5): "switch your plastic mailer to a paper one,
// save $X a year and Y pounds of plastic." Returns the Swap shape from
// docs/data-format.md section 9.
//
// A swap is only suggested when it
//   - protects at least as well as today (and meets the product's minimum),
//   - sends less to landfill or uses less plastic, and
//   - scores higher overall with the seller's weights. This last rule is skipped
//     when today's setup is below the minimum protection: an unsafe setup can
//     look "best" on cost and grams simply because it barely protects anything.
// Results are ranked by overall score, at most one per outer.

import { describeSetup, indexCatalog } from "../catalog.ts";
import { evaluateAll, expandOrder } from "../planner/evaluateSetup.ts";
import { GRAMS_PER_LB } from "../rightsizing/dimWeight.ts";
import { evaluateCurrent } from "../rightsizing/rightSize.ts";
import { paretoFilter, scoreOptions } from "../scoring/fiveFactor.ts";
import { meetsMinimum, minimumProtection, PROTECTION_RANK } from "../scoring/protection.ts";
import { WEIGHT_PRESETS } from "../scoring/weights.ts";
import type { Catalog, FactorKey, Product, ScoredSetup, SellerContext, Setup, Swap, Weights } from "../types.ts";

const EPS = 1e-9;

export interface SwapResult {
  current: ScoredSetup;
  currentHasPadding: boolean;
  /**
   * False when today's setup is below the minimum protection for the product
   * (e.g. glass in a plain poly mailer). Then safe swaps are suggested even if
   * they score lower overall, because the current setup should not be the bar.
   */
  currentMeetsMinimum: boolean;
  swaps: Swap[];
}

function money(n: number, digits = 0): string {
  return `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

function pounds(n: number): string {
  return `${n.toLocaleString("en-US", { maximumFractionDigits: n < 10 ? 1 : 0 })} lb`;
}

function centsOrDollars(n: number): string {
  return n < 1 ? `${Math.round(n * 100)} cents` : money(n, 2);
}

export function buildSwap(current: ScoredSetup, option: ScoredSetup, ordersPerYear: number): Swap {
  const cv = current.values;
  const ov = option.values;
  const usd_saved_per_year = (cv.cost - ov.cost) * ordersPerYear;
  const plastic_avoided_lb_per_year = ((current.plasticWeight_g - option.plasticWeight_g) * ordersPerYear) / GRAMS_PER_LB;
  const landfill_avoided_lb_per_year = ((cv.waste - ov.waste) * ordersPerYear) / GRAMS_PER_LB;

  const worse_on: FactorKey[] = [];
  const tradeoffs: string[] = [];
  if (ov.cost > cv.cost + EPS) {
    worse_on.push("cost");
    tradeoffs.push(`Costs ${centsOrDollars(ov.cost - cv.cost)} more per order`);
  }
  if (PROTECTION_RANK[ov.protection] < PROTECTION_RANK[cv.protection]) {
    worse_on.push("protection");
    tradeoffs.push("Less protection");
  }
  if (ov.waste > cv.waste + EPS) {
    worse_on.push("waste");
    tradeoffs.push(`Sends ${Math.round(ov.waste - cv.waste)} g more to landfill per order`);
  }
  if (ov.fees > cv.fees + EPS) {
    worse_on.push("fees");
    tradeoffs.push(`${money(ov.fees - cv.fees)} more in state fees per year`);
  }
  if (ov.carbon > cv.carbon + EPS) {
    worse_on.push("carbon");
    tradeoffs.push(`${Math.round((ov.carbon - cv.carbon) * 1000)} g more CO2e per order from heavier material`);
  }

  const gains: string[] = [];
  if (usd_saved_per_year > 0.5) gains.push(`save ${money(usd_saved_per_year)} a year`);
  else if (usd_saved_per_year < -0.5) gains.push(`cost ${money(usd_saved_per_year)} more a year`);
  if (plastic_avoided_lb_per_year > 0.05) gains.push(`avoid ${pounds(plastic_avoided_lb_per_year)} of plastic`);
  else if (landfill_avoided_lb_per_year > 0.05) gains.push(`keep ${pounds(landfill_avoided_lb_per_year)} out of landfill`);
  const summary = `Switch ${describeSetup(current.parts)} to ${describeSetup(option.parts)}${
    gains.length ? `: ${gains.join(" and ")}` : ""
  }.`;

  return {
    from: current.setup,
    to: option.setup,
    usd_saved_per_year,
    plastic_avoided_lb_per_year,
    score_change: option.score.overall - current.score.overall,
    tradeoffs,
    landfill_avoided_lb_per_year,
    fees_saved_usd_per_year: cv.fees - ov.fees,
    carbon_avoided_kg_per_year: (cv.carbon - ov.carbon) * ordersPerYear,
    worse_on,
    summary,
    option,
  };
}

export function rankSwaps(
  products: Product[],
  current: Setup,
  catalog: Catalog,
  ctx: SellerContext,
  weights: Weights = WEIGHT_PRESETS.balanced,
  limit = 3,
): SwapResult | null {
  const index = indexCatalog(catalog);
  const now = evaluateCurrent(products, current, index, ctx);
  if (!now) return null;
  const cur = now.evaluated;
  const { fragility } = expandOrder(products);

  const requiredRank = Math.max(
    PROTECTION_RANK[cur.values.protection],
    PROTECTION_RANK[minimumProtection(fragility)],
  );

  const eligible = paretoFilter(
    evaluateAll(products, index, ctx).filter(
      (e) =>
        e.key !== cur.key &&
        PROTECTION_RANK[e.values.protection] >= requiredRank &&
        (e.values.waste < cur.values.waste - EPS || e.plasticWeight_g < cur.plasticWeight_g - EPS),
    ),
  );

  // Score today's setup alongside the candidates so the numbers are comparable.
  const [scoredCurrent, ...scored] = scoreOptions([cur, ...eligible], weights);
  const currentMeetsMinimum = meetsMinimum(cur.values.protection, fragility);

  const seenOuters = new Set<string>();
  const swaps = scored
    .filter((s) => !currentMeetsMinimum || s.score.overall > scoredCurrent.score.overall + EPS)
    .sort((a, b) => b.score.overall - a.score.overall)
    .filter((s) => {
      if (seenOuters.has(s.setup.outer_id)) return false;
      seenOuters.add(s.setup.outer_id);
      return true;
    })
    .slice(0, limit)
    .map((s) => buildSwap(scoredCurrent, s, ctx.ordersPerYear));

  return { current: scoredCurrent, currentHasPadding: now.hasPadding, currentMeetsMinimum, swaps };
}
