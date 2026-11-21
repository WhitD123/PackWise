// Fee estimate for one state (CLAUDE.md section 8, step 5):
//   fee = sum over materials of (pounds delivered to the state x rate per lb)
// Rates may be negative (Oregon aluminum is a credit). A material with no rate is
// reported as missing, never counted as zero.

import type { FeeEstimate, FeeSchedule } from "./types.ts";

export const GRAMS_PER_LB = 453.59237;

export function estimateFees(
  schedule: FeeSchedule,
  ordersToState: number,
  gramsPerOrderByMaterial: Record<string, number>,
): FeeEstimate {
  const by_material: Record<string, number> = {};
  const missing_materials: string[] = [];
  const warnings: string[] = [];
  let total = 0;

  for (const [material, grams] of Object.entries(gramsPerOrderByMaterial)) {
    if (!(grams > 0)) continue;
    const rate = schedule.rates[material];
    if (!rate) {
      missing_materials.push(material);
      continue;
    }
    const lb = (grams / GRAMS_PER_LB) * ordersToState;
    let perLb = rate.rate_usd_per_lb;
    if (rate.plastic_component_fees_apply && schedule.plastic_component_fees) {
      perLb +=
        schedule.plastic_component_fees.reuse_investment_usd_per_lb_plastic +
        schedule.plastic_component_fees.ppmf_weight_usd_per_lb_plastic;
    }
    by_material[material] = lb * perLb;
    total += lb * perLb;
  }

  if (missing_materials.length > 0) {
    warnings.push(`No ${schedule.state} fee rate found for: ${missing_materials.join(", ")}. Not included in the estimate.`);
  }
  if (schedule.plastic_component_fees) {
    warnings.push("Excludes California's per-component plastic fee, which needs a count of plastic parts.");
  }
  return { fee_usd_per_year: total, missing_materials, by_material, warnings };
}
