// What the planner form collects, and how it becomes engine input.
// The form works in seller-friendly units (ounces, percent); the engine works in
// grams and 0..1 shares. Conversion happens only here.

import type { AppData } from "../data.ts";
import type { PresetName } from "../scoring/weights.ts";
import type { Fragility, Product, SellerContext, Setup } from "../types.ts";
import type { ExampleProduct } from "./examples.ts";
import { EXAMPLE_PRODUCTS } from "./examples.ts";

export const GRAMS_PER_OZ = 28.349523125;

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
  /** Today's packaging, as component ids. "" = not provided. */
  current: { outer_id: string; fill_id: string; wrap_id: string; insert_id: string };
  priority: PresetName;
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

/** The demo seller from the brief: a candle brand shipping in poly mailers with bubble wrap. */
export function defaultInput(): PlannerInput {
  return {
    lines: [lineFromExample(EXAMPLE_PRODUCTS[0], "default-candle")],
    ordersPerYear: 200000,
    statePercent: { OR: 1.3, CO: 1.8 },
    current: { outer_id: "poly-mailer-10x13", fill_id: "", wrap_id: "bubble-wrap", insert_id: "" },
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

export function toContext(input: PlannerInput, data: AppData): SellerContext {
  return {
    ordersPerYear: input.ordersPerYear,
    stateShare: Object.fromEntries(Object.entries(input.statePercent).map(([s, pct]) => [s, (pct || 0) / 100])),
    shipping: data.shipping,
    feeSchedules: data.feeSchedules,
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
