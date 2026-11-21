// What the planner form collects, and how it becomes engine input.
// The form works in seller-friendly units (ounces, percent); the engine works in
// grams and 0..1 shares. Conversion happens only here.

import type { AppData, ProductPackagingPart } from "../data.ts";
import { zoneMixFromStates, type ZoneMix } from "../shipping/getZone.ts";
import type { PresetName } from "../scoring/weights.ts";
import type { Fragility, Product, SellerContext, Setup } from "../types.ts";
import type { ExampleProduct } from "./examples.ts";
import { EXAMPLE_PRODUCTS } from "./examples.ts";

export const GRAMS_PER_OZ = 28.349523125;

/** The demo seller ships from Portland, OR. Only the first three digits (972) matter: they select the exact USPS chart. */
export const DEFAULT_SHIP_FROM_ZIP = "97201";

/** The ship-from ZIP to use: the demo's Portland unless the seller entered or cleared one. */
export function shipFromZipOf(input: PlannerInput): string {
  return input.shipFromZip ?? DEFAULT_SHIP_FROM_ZIP;
}

export interface ProductLineInput {
  key: string;
  name: string;
  length_in: number;
  width_in: number;
  height_in: number;
  weight_oz: number;
  fragility: Fragility;
  items_per_order: number;
}

export interface PlannerInput {
  lines: ProductLineInput[];
  ordersPerYear: number;
  /** state code -> percent of orders (0..100) */
  statePercent: Record<string, number>;
  /**
   * Where all orders go, percent by state (for shipping zones). From an uploaded order file.
   * Optional: when missing, shipping assumes Zone 5 for every order and says so.
   */
  orderStatePercent?: Record<string, number>;
  /**
   * Where orders ship from: five digits, and only the first three are used (they set the USPS zones).
   * Not set = the demo's Portland, OR (972). "" = left blank, so every order is priced as Zone 5 and labelled "assumed".
   */
  shipFromZip?: string;
  /** Today's packaging, as component ids. "" = not provided. */
  current: { outer_id: string; fill_id: string; wrap_id: string; insert_id: string };
  priority: PresetName;
  /**
   * Worldwide yearly revenue, for the state exemption tests. Optional: when missing,
   * every state with a fee schedule is treated as covered.
   */
  revenueUsd?: number;
  /** Gross sales delivered into California per year, for California's test. */
  californiaSalesUsd?: number;
  /** Packaging that comes with each product (jar, lid). Counted by the state coverage check. */
  productPackaging?: ProductPackagingPart[];
}

/** `key` must be unique within the form; callers in event handlers can use Date.now(). */
export function lineFromExample(p: ExampleProduct, key: string): ProductLineInput {
  return {
    key,
    name: p.name,
    length_in: p.length_in,
    width_in: p.width_in,
    height_in: p.height_in,
    weight_oz: Math.round((p.weight_g / GRAMS_PER_OZ) * 10) / 10,
    fragility: p.fragility,
    items_per_order: p.items_per_order,
  };
}

/** Order volume, state mix and revenue taken from the built-in sample order file. */
export function ordersFromSample(
  data: AppData,
): Pick<PlannerInput, "ordersPerYear" | "statePercent" | "orderStatePercent" | "revenueUsd" | "californiaSalesUsd"> {
  const sample = data.sampleOrders;
  return {
    ordersPerYear: sample.ordersPerYear,
    // Fee states only: these drive packaging fees.
    statePercent: Object.fromEntries(data.feeSchedules.map((f) => [f.state, sample.orderStatePercent[f.state] ?? 0])),
    orderStatePercent: sample.orderStatePercent,
    revenueUsd: sample.revenuePerYear_usd,
    californiaSalesUsd: sample.californiaSalesUsd,
  };
}

/**
 * The demo seller: Maya's 12 oz candle shipped in an oversized box with foam peanuts and
 * bubble wrap (tests/fixtures/demo-answer-key.json), with orders from the sample file.
 */
export function defaultInput(data: AppData): PlannerInput {
  return {
    lines: [lineFromExample(EXAMPLE_PRODUCTS[1], "default-candle")],
    ...ordersFromSample(data),
    productPackaging: data.demoProductPackaging,
    shipFromZip: DEFAULT_SHIP_FROM_ZIP,
    current: { outer_id: "box-12x10x8-single", fill_id: "foam-peanuts-fill", wrap_id: "bubble-wrap-3-16", insert_id: "" },
    priority: "balanced",
  };
}

export function toProducts(input: PlannerInput): Product[] {
  return input.lines.map((l) => ({
    name: l.name,
    length_in: l.length_in,
    width_in: l.width_in,
    height_in: l.height_in,
    weight_g: l.weight_oz * GRAMS_PER_OZ,
    fragility: l.fragility,
    items_per_order: l.items_per_order,
  }));
}

/**
 * Grams per order by material of the packaging that comes with the product (jar, lid).
 * `includeCandleContainer` false = treat the jar and lid as part of the product, not packaging.
 */
export function productPackagingGramsPerOrder(input: PlannerInput, includeCandleContainer: boolean): Record<string, number> {
  const grams: Record<string, number> = {};
  const itemsPerOrder = input.lines.reduce((s, l) => s + l.items_per_order, 0) || 1;
  for (const part of input.productPackaging ?? []) {
    if (part.is_candle_container && !includeCandleContainer) continue;
    grams[part.material] = (grams[part.material] ?? 0) + part.weight_g * itemsPerOrder;
  }
  return grams;
}

/** Zones for the seller's order mix from their ship-from ZIP; null = no usable mix or ZIP, so Zone 5 is assumed. */
export function zonesFor(input: PlannerInput, data: AppData): ZoneMix | null {
  const byState = Object.fromEntries(Object.entries(input.orderStatePercent ?? {}).map(([s, pct]) => [s, (pct || 0) / 100]));
  return zoneMixFromStates(byState, shipFromZipOf(input), data.shipping);
}

export function toContext(input: PlannerInput, data: AppData): SellerContext {
  const zones = zonesFor(input, data);
  return {
    ordersPerYear: input.ordersPerYear,
    stateShare: Object.fromEntries(Object.entries(input.statePercent).map(([s, pct]) => [s, (pct || 0) / 100])),
    shipping: data.shipping,
    zoneShare: zones?.share,
    zoneLabel: zones?.label,
    feeSchedules: data.feeSchedules,
    // The coverage card counts the jar and lid by default, so the Fees score does too.
    productPackagingGrams: productPackagingGramsPerOrder(input, true),
    coverage:
      input.revenueUsd === undefined
        ? undefined
        : { rules: data.coverageRules, seller: { worldwideRevenueUsd: input.revenueUsd, californiaSalesUsd: input.californiaSalesUsd ?? null } },
  };
}

export function currentSetup(input: PlannerInput): Setup | null {
  const c = input.current;
  if (!c.outer_id) return null;
  return {
    outer_id: c.outer_id,
    fill_id: c.fill_id || null,
    wrap_id: c.wrap_id || null,
    insert_id: c.insert_id || null,
  };
}

/** Problems that stop the planner from running, in plain words. */
export function validateInput(input: PlannerInput): string[] {
  const errors: string[] = [];
  if (input.lines.length === 0) errors.push("Add at least one product.");
  input.lines.forEach((l, i) => {
    const label = l.name || `Product ${i + 1}`;
    if (!(l.length_in > 0 && l.width_in > 0 && l.height_in > 0)) errors.push(`${label}: enter all three sizes.`);
    if (!(l.weight_oz > 0)) errors.push(`${label}: enter a weight.`);
    if (!(l.items_per_order >= 1 && Number.isInteger(l.items_per_order))) {
      errors.push(`${label}: items per order must be a whole number.`);
    }
  });
  if (!(input.ordersPerYear > 0)) errors.push("Enter how many orders you ship a year.");
  const total = Object.values(input.statePercent).reduce((s, v) => s + (v || 0), 0);
  if (total > 100) errors.push("State shares add up to more than 100%.");
  return errors;
}
