// Right-sizing (brief feature 4): keep the seller's kind of outer (box or mailer)
// and their insert, wrap and fill; find the smallest outer that still fits
// safely, and show the savings. A box made to hold the product (a fitted insert) counts too.

import { dimsOf, indexCatalog, type CatalogIndex } from "../catalog.ts";
import { evaluateSetup, expandOrder } from "../planner/evaluateSetup.ts";
import { PROTECTION_RANK } from "../scoring/protection.ts";
import type { Catalog, EvaluatedSetup, PackagingComponent, Product, SellerContext, Setup } from "../types.ts";
import { volume } from "./packItems.ts";

export interface RightSizeResult {
  current: EvaluatedSetup;
  /** False when today's outer only fits the order without safety padding. */
  currentHasPadding: boolean;
  /** null when today's outer is already the smallest safe one. */
  recommended: EvaluatedSetup | null;
  /** Positive = money saved. */
  shippingSavingsPerOrder_usd: number;
  totalSavingsPerOrder_usd: number;
  totalSavingsPerYear_usd: number;
  /** Less empty space to fill, cubic inches per order. */
  voidReduction_in3: number;
  /** Less packaging, grams per order. */
  packagingSaved_g: number;
}

/** Size used to rank outers: volume for boxes, flat area for mailers. */
export function outerSize(c: PackagingComponent): number {
  const d = dimsOf(c);
  if (!d) return Infinity;
  return c.type === "box" ? volume(d) : d.length * d.width;
}

/** Measure what the seller ships today: with padding if it fits, otherwise as packed. */
export function evaluateCurrent(
  products: Product[],
  current: Setup,
  index: CatalogIndex,
  ctx: SellerContext,
): { evaluated: EvaluatedSetup; hasPadding: boolean } | null {
  const strict = evaluateSetup(products, current, index, ctx);
  if (strict) return { evaluated: strict, hasPadding: true };
  const loose = evaluateSetup(products, current, index, ctx, { strictClearance: false });
  return loose ? { evaluated: loose, hasPadding: expandOrder(products).fragility === "low" } : null;
}

export function rightSize(
  products: Product[],
  current: Setup,
  catalog: Catalog,
  ctx: SellerContext,
): RightSizeResult | null {
  const index = indexCatalog(catalog);
  const now = evaluateCurrent(products, current, index, ctx);
  if (!now) return null;
  const cur = now.evaluated;
  const currentOuter = cur.parts.outer;

  // Each outer keeps the seller's insert, wrap and fill. A fitted-insert box (made for one jar) holds the
  // jar snugly and takes no wrap or loose fill, so it is tried on its own (CLAUDE.md section 7: candidate
  // boxes fit by the packing rules or have a fitted insert for that product).
  const fittedBoxes = currentOuter.type === "box" ? index.byType("box").filter((o) => o.has_fitted_insert) : [];
  const attempts: Setup[] = [
    ...index.byType(currentOuter.type).map((outer) => ({ ...current, outer_id: outer.id })),
    ...fittedBoxes.map((outer) => ({ outer_id: outer.id, fill_id: null, wrap_id: null, insert_id: null })),
  ];
  const candidates = attempts
    .map((setup) => evaluateSetup(products, setup, index, ctx))
    .filter((e): e is EvaluatedSetup => e !== null)
    .filter((e) => PROTECTION_RANK[e.values.protection] >= PROTECTION_RANK[cur.values.protection])
    .sort((a, b) => outerSize(a.parts.outer) - outerSize(b.parts.outer) || a.values.cost - b.values.cost);

  const smallest = candidates[0];
  const isBetter =
    smallest !== undefined &&
    smallest.key !== cur.key &&
    (outerSize(smallest.parts.outer) < outerSize(currentOuter) || !now.hasPadding);
  const recommended = isBetter ? smallest : null;
  const best = recommended ?? cur;

  const perOrder = cur.values.cost - best.values.cost;
  return {
    current: cur,
    currentHasPadding: now.hasPadding,
    recommended,
    shippingSavingsPerOrder_usd: cur.shippingCost_usd - best.shippingCost_usd,
    totalSavingsPerOrder_usd: perOrder,
    totalSavingsPerYear_usd: perOrder * ctx.ordersPerYear,
    voidReduction_in3: cur.voidVolume_in3 - best.voidVolume_in3,
    packagingSaved_g: cur.packagingWeight_g - best.packagingWeight_g,
  };
}
