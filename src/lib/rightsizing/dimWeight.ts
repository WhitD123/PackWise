// Shipping cost from package size and weight (docs/data-format.md section 7):
//
//   dimensional weight (lb) = length_in x width_in x height_in / divisor
//   billable weight (lb)    = larger of actual and dimensional weight, rounded up to a whole pound
//
// Dimensional weight only applies above `dim_applies_above_cubic_in` (null = always).

import type { Dimensions, ShippingRules } from "../types.ts";

export const GRAMS_PER_LB = 453.59237;

export interface BillableWeight {
  actual_lb: number;
  /** 0 when the package is under the carrier's size threshold. */
  dim_lb: number;
  billable_lb: number;
  volume_in3: number;
}

export function billableWeight(dims: Dimensions, weight_g: number, rules: ShippingRules): BillableWeight {
  const volume_in3 = dims.length * dims.width * dims.height;
  const actual_lb = weight_g / GRAMS_PER_LB;
  const threshold = rules.dim_applies_above_cubic_in;
  const dim_lb = threshold === null || volume_in3 > threshold ? volume_in3 / rules.dim_divisor : 0;
  // Small tolerance so floating point noise (2.0000000001) does not bump a pound.
  const billable_lb = Math.max(1, Math.ceil(Math.max(actual_lb, dim_lb) - 1e-9));
  return { actual_lb, dim_lb, billable_lb, volume_in3 };
}

export interface ShippingQuote extends BillableWeight {
  price_usd: number;
}

/** Returns null when the package is heavier than the last step of the rate table. */
export function shippingQuote(dims: Dimensions, weight_g: number, rules: ShippingRules): ShippingQuote | null {
  const bw = billableWeight(dims, weight_g, rules);
  const step = rules.rates.find((r) => bw.billable_lb <= r.max_lb);
  return step ? { ...bw, price_usd: step.price_usd } : null;
}
