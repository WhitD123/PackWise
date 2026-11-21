// Measure one packaging setup (outer + optional insert, wrap, fill) for one order.
// Produces the real numbers behind the five-factor label (brief section 13, step 1).
//
// How the parts combine:
//   wrap   adds WRAP_THICKNESS_IN around every item and counts toward its padding.
//          Used per square foot: two layers over the item's surface.
//   insert holds all the items; the insert then goes into the outer as one block.
//   fill   fills the empty space left in a box (box inside volume minus the items' bounding boxes).
//          Used per cubic foot of empty space.
//   outer  the box or mailer. Boxes keep padding between items and walls by fragility.

import { dimsOf, fittedInsertFits, resolveSetup, setupKey, type CatalogIndex } from "../catalog.ts";
import { checkState } from "../coverage/checkCoverage.ts";
import { estimateFees } from "../coverage/estimateFees.ts";
import { GRAMS_PER_LB, shippingQuote } from "../rightsizing/dimWeight.ts";
import { averagePrice } from "../shipping/price.ts";
import { CLEARANCE_IN, fitMailer, packIntoBox, volume, WALL_IN, WRAP_THICKNESS_IN } from "../rightsizing/packItems.ts";
import { rateProtection } from "../scoring/protection.ts";
import type {
  Dimensions,
  EvaluatedSetup,
  Fragility,
  Material,
  PackagingComponent,
  PartUsage,
  Placement,
  Product,
  SellerContext,
  Setup,
} from "../types.ts";

/**
 * Kg CO2e per kg of a material over its life (CLAUDE.md section 7):
 * production + recycle_rate x recycling + (1 - recycle_rate) x landfill. A null recycling factor counts as 0.
 */
export function lifecycleFactor(m: Material | undefined, recycleRate: number): number {
  if (!m) return 0;
  const eol = m.eol_kg_co2e_per_kg;
  return m.carbon_kg_co2e_per_kg + (eol ? recycleRate * (eol.recycling ?? 0) + (1 - recycleRate) * eol.landfill : 0);
}

const FRAGILITY_RANK: Record<Fragility, number> = { low: 0, medium: 1, high: 2 };
const NO_PAD = { wall: 0, gap: 0 };
const IN3_PER_FT3 = 1728;
const IN2_PER_FT2 = 144;
/**
 * Layers of wrap around each item: CLAUDE.md section 7 says "about two layers; an estimate".
 * For the 12 oz candle this gives 0.88 sq ft; the answer key rounds that to 1.0 sq ft.
 */
export const WRAP_LAYERS = 2;

export interface ExpandedOrder {
  /** One entry per physical item. */
  items: Dimensions[];
  itemsWeight_g: number;
  /** The most fragile item decides how the whole order is padded. */
  fragility: Fragility;
}

export function expandOrder(products: Product[]): ExpandedOrder {
  const items: Dimensions[] = [];
  let itemsWeight_g = 0;
  let fragility: Fragility = "low";
  for (const p of products) {
    for (let i = 0; i < p.items_per_order; i++) {
      items.push({ length: p.length_in, width: p.width_in, height: p.height_in });
    }
    itemsWeight_g += p.weight_g * p.items_per_order;
    if (FRAGILITY_RANK[p.fragility] > FRAGILITY_RANK[fragility]) fragility = p.fragility;
  }
  return { items, itemsWeight_g, fragility };
}

const grow = (d: Dimensions, by: number): Dimensions => ({
  length: d.length + by,
  width: d.width + by,
  height: d.height + by,
});

function surfaceArea(d: Dimensions): number {
  return 2 * (d.length * d.width + d.length * d.height + d.width * d.height);
}

export interface EvaluateOptions {
  /**
   * false = skip the safety padding when fitting. Used only to measure what a
   * seller ships today, since their real box may be tighter than we would pick.
   */
  strictClearance?: boolean;
}

/** Returns null if the setup is not a valid combination or the order does not fit. */
export function evaluateSetup(
  products: Product[],
  setup: Setup,
  index: CatalogIndex,
  ctx: SellerContext,
  opts: EvaluateOptions = {},
): EvaluatedSetup | null {
  const parts = resolveSetup(setup, index);
  if (!parts) return null;
  const { items, itemsWeight_g, fragility } = expandOrder(products);
  if (items.length === 0) return null;

  // 1. Wrap every item, then (optionally) put them all in an insert.
  const wrapT = parts.wrap ? WRAP_THICKNESS_IN : 0;
  let blocks = items.map((d) => grow(d, 2 * wrapT));
  if (parts.insert) {
    const inside = dimsOf(parts.insert)!;
    if (!packIntoBox(blocks, inside, NO_PAD)) return null;
    blocks = [grow(inside, 2 * WALL_IN)];
  }

  // 2. Fit into the outer. A fitted-insert box counts as fitted only for jars that sit in its cells.
  const fitted = fittedInsertFits(parts.outer, items);
  const outerDims = dimsOf(parts.outer)!;
  let placements: Placement[];
  let shippedDims: Dimensions;
  let voidVolume_in3 = 0;
  let emptySpaceRatio: number | undefined;

  if (parts.outer.type === "box") {
    // A fitted-insert box holds the jar it is made for snugly, so the clearance rule does not apply.
    const base = opts.strictClearance === false || fitted ? NO_PAD : CLEARANCE_IN[fragility];
    // An insert holds items snugly; wrap counts toward the padding.
    const clearance = parts.insert
      ? NO_PAD
      : { wall: Math.max(0, base.wall - wrapT), gap: Math.max(0, base.gap - 2 * wrapT) };
    const packed = packIntoBox(blocks, outerDims, clearance);
    if (!packed) return null;
    placements = packed;
    // Empty space the filler has to occupy (CLAUDE.md section 7): inside volume minus the products'
    // own bounding boxes. The wrap's thickness is not subtracted. With an insert, the insert block is the solid.
    const solids = parts.insert ? blocks : items;
    voidVolume_in3 = Math.max(0, volume(outerDims) - solids.reduce((s, d) => s + volume(d), 0));
    // EU method (environment.json eu_empty_space): the products' own boxes are the contents, filler is empty space.
    emptySpaceRatio = Math.max(0, volume(outerDims) - items.reduce((s, d) => s + volume(d), 0)) / volume(outerDims);
    // Outside size: the supplier's, if listed (the fitted jar boxes), else inside + the wall thickness.
    const o = parts.outer;
    shippedDims =
      o.outside_length_in !== undefined && o.outside_width_in !== undefined && o.outside_height_in !== undefined
        ? { length: o.outside_length_in, width: o.outside_width_in, height: o.outside_height_in }
        : grow(outerDims, 2 * WALL_IN);
  } else {
    const fit = fitMailer(
      blocks,
      { length: outerDims.length, width: outerDims.width, maxThickness: outerDims.height },
      0,
    );
    if (!fit) return null;
    placements = fit.placements;
    // A filled pouch measures about (flat length - thickness) x (flat width - thickness) x thickness.
    const t = fit.bundle.height;
    shippedDims = {
      length: Math.max(fit.bundle.length, outerDims.length - t),
      width: Math.max(fit.bundle.width, outerDims.width - t),
      height: t,
    };
  }

  // 3. How much of each part goes out per order.
  const usageOf = (component: PackagingComponent, units: number): PartUsage => ({
    component,
    units,
    weight_g: component.weight_g * units,
    price_usd: component.price_usd * units,
  });
  const usage: PartUsage[] = [usageOf(parts.outer, 1)];
  if (parts.insert) usage.push(usageOf(parts.insert, 1));
  if (parts.wrap) usage.push(usageOf(parts.wrap, (WRAP_LAYERS * items.reduce((s, d) => s + surfaceArea(d), 0)) / IN2_PER_FT2));
  // A fitted box has no loose fill (CLAUDE.md section 7), whatever empty space it has.
  if (parts.fill) usage.push(usageOf(parts.fill, fitted ? 0 : voidVolume_in3 / IN3_PER_FT3));

  // 4. Materials: waste, plastic, carbon.
  const warnings = new Set<string>();
  let waste = 0;
  let plasticWeight_g = 0;
  let carbon = 0;
  const gramsByMaterial: Record<string, number> = {};
  for (const u of usage) {
    const m = index.material(u.component.material);
    if (!m) warnings.add(`Unknown material "${u.component.material}" on ${u.component.name}.`);
    const recycle = u.component.recycle_rate ?? m?.recycle_rate ?? 0;
    waste += u.weight_g * (1 - recycle);
    if (m?.is_plastic) plasticWeight_g += u.weight_g;
    carbon += (u.weight_g / 1000) * lifecycleFactor(m, recycle);
    gramsByMaterial[u.component.material] = (gramsByMaterial[u.component.material] ?? 0) + u.weight_g;
  }

  // 5. Fees: pounds delivered to each state x its rate, via the coverage module so
  //    scoring and the coverage card agree. An exempt state costs $0.
  const feeGrams: Record<string, number> = { ...gramsByMaterial };
  for (const [material, g] of Object.entries(ctx.productPackagingGrams ?? {})) feeGrams[material] = (feeGrams[material] ?? 0) + g;
  let feesPerYear = 0;
  for (const [state, share] of Object.entries(ctx.stateShare)) {
    if (!(share > 0)) continue;
    const schedule = ctx.feeSchedules.find((f) => f.state === state);
    if (!schedule) continue; // no fee schedule = no fees in that state
    const orders = share * ctx.ordersPerYear;
    const rule = ctx.coverage?.rules.find((r) => r.state === state);
    if (ctx.coverage && rule) {
      const r = checkState(
        rule,
        { seller: ctx.coverage.seller, ordersPerYearByState: { [state]: orders }, packagingGramsPerOrderByMaterial: feeGrams },
        rule.fee_file ? { [rule.fee_file]: schedule } : {},
      );
      feesPerYear += r.fee_usd_per_year ?? 0;
      r.warnings.forEach((w) => warnings.add(w));
    } else {
      const fee = estimateFees(schedule, orders, feeGrams);
      feesPerYear += fee.fee_usd_per_year;
      fee.warnings.forEach((w) => warnings.add(w));
    }
  }

  const packagingWeight_g = usage.reduce((s, u) => s + u.weight_g, 0);
  const packagingCost_usd = usage.reduce((s, u) => s + u.price_usd, 0);
  const shippedWeight_g = itemsWeight_g + packagingWeight_g;
  let shipping: { price_usd: number; billable_lb: number };
  let shippingMethod: EvaluatedSetup["shippingMethod"];
  let zoneLabel: EvaluatedSetup["zoneLabel"];
  if (ctx.shipping.weight_rates_by_zone) {
    // Real USPS tables: prices by zone, Cubic, ounce tiers (src/lib/shipping/price.ts).
    const zoneShare = ctx.zoneShare ?? { "5": 1 };
    zoneLabel = ctx.zoneShare ? (ctx.zoneLabel ?? "exact") : "assumed";
    const avg = averagePrice(
      {
        dims: shippedDims,
        weight_lb: shippedWeight_g / GRAMS_PER_LB,
        softPack:
          parts.outer.type === "mailer" ? { length_in: outerDims.length, width_in: outerDims.width } : undefined,
      },
      zoneShare,
      ctx.shipping,
    );
    if (!avg) return null;
    shipping = avg;
    shippingMethod = avg.method;
  } else {
    // Single-zone table: kept for the small hand-worked test catalog.
    const quote = shippingQuote(shippedDims, shippedWeight_g, ctx.shipping);
    if (!quote) return null;
    shipping = quote;
  }

  return {
    key: setupKey(setup),
    setup,
    parts,
    usage,
    packagingWeight_g,
    plasticWeight_g,
    packagingCost_usd,
    shippingCost_usd: shipping.price_usd,
    billableWeight_lb: shipping.billable_lb,
    shippingMethod,
    zoneLabel,
    shippedDims,
    voidVolume_in3,
    emptySpaceRatio,
    placements,
    warnings: [...warnings],
    values: {
      cost: packagingCost_usd + shipping.price_usd,
      protection: rateProtection(parts, fragility, {
        fitted,
        voidVolume_in3,
        shippedWeight_lb: (itemsWeight_g + packagingWeight_g) / GRAMS_PER_LB,
      }),
      waste,
      fees: feesPerYear,
      carbon,
    },
  };
}

/** Every allowed outer x insert x wrap x fill combination that fits the order. */
export function evaluateAll(products: Product[], index: CatalogIndex, ctx: SellerContext): EvaluatedSetup[] {
  const ids = (type: PackagingComponent["type"]) => index.byType(type).map((c) => c.id);
  const orNone = (list: string[]) => [null, ...list];
  const out: EvaluatedSetup[] = [];
  for (const outer of [...index.byType("box"), ...index.byType("mailer")]) {
    for (const insert_id of orNone(ids("insert"))) {
      for (const wrap_id of orNone(ids("wrap"))) {
        for (const fill_id of outer.type === "box" ? orNone(ids("filler")) : [null]) {
          const ev = evaluateSetup(products, { outer_id: outer.id, fill_id, wrap_id, insert_id }, index, ctx);
          if (ev) out.push(ev);
        }
      }
    }
  }
  return out;
}
