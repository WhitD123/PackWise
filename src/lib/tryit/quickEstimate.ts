// The "try it" calculator on the home page: three choices (what you sell, how you pack it today, orders a month)
// give an instant estimate, computed by the same engine as the full results. NN/g's calculator guidance: few inputs,
// choices instead of typing, results that update live, and an explanation of how the numbers are made.
//
// With no order file, orders are spread across the US by Census population (the fallback CLAUDE.md section 8
// allows) and shipped from the ZIP the visitor gives (Portland by default). Everything here is labeled an estimate.

import type { AppData } from "../data.ts";
import { EXAMPLE_PRODUCTS } from "../planner/examples.ts";
import {
  currentSetup,
  DEFAULT_SHIP_FROM_ZIP,
  lineFromExample,
  toContext,
  toProducts,
  type PlannerInput,
} from "../planner/plannerInput.ts";
import { WEIGHT_PRESETS } from "../scoring/weights.ts";
import { rankSwaps } from "../swaps/rankSwaps.ts";
import type { ScoredSetup, Swap } from "../types.ts";

export interface PackagingPreset {
  id: string;
  label: string;
  setup: { outer_id: string; fill_id: string; wrap_id: string; insert_id: string };
}

/** Common ways small shops pack an order today. Every id is a component in data/library/components.json. */
export const PACKAGING_PRESETS: PackagingPreset[] = [
  {
    id: "big-box-foam",
    label: "A big box with foam peanuts and bubble wrap",
    setup: { outer_id: "box-12x10x8-single", fill_id: "foam-peanuts-fill", wrap_id: "bubble-wrap-3-16", insert_id: "" },
  },
  {
    id: "big-box-paper",
    label: "A big box with crumpled paper",
    setup: { outer_id: "box-12x10x8-single", fill_id: "kraft-paper-void-fill", wrap_id: "", insert_id: "" },
  },
  {
    id: "medium-box-air",
    label: "A medium box with plastic air pillows",
    setup: { outer_id: "box-10x8x6-single", fill_id: "air-pillows-fill", wrap_id: "", insert_id: "" },
  },
  {
    id: "poly-mailer",
    label: "A plastic poly mailer",
    setup: { outer_id: "poly-mailer-10x13", fill_id: "", wrap_id: "", insert_id: "" },
  },
  {
    id: "bubble-mailer",
    label: "A plastic bubble mailer",
    setup: { outer_id: "poly-bubble-mailer-8-4x10-8", fill_id: "", wrap_id: "", insert_id: "" },
  },
];

export const QUICK_PRODUCTS = EXAMPLE_PRODUCTS;

/** Planner answers for the quick estimate. They carry straight into the full planner and results. */
export function quickInput(
  data: AppData,
  productId: string,
  presetId: string,
  ordersPerMonth: number,
  shipFromZip: string = DEFAULT_SHIP_FROM_ZIP,
): PlannerInput {
  const product = QUICK_PRODUCTS.find((p) => p.id === productId) ?? QUICK_PRODUCTS[1];
  const preset = PACKAGING_PRESETS.find((p) => p.id === presetId) ?? PACKAGING_PRESETS[0];
  const pop = data.populationPercent;
  return {
    lines: [lineFromExample(product, `quick-${product.id}`)],
    ordersPerYear: Math.max(1, Math.round(ordersPerMonth * 12)),
    statePercent: Object.fromEntries(data.feeSchedules.map((f) => [f.state, pop[f.state] ?? 0])),
    orderStatePercent: pop,
    ordersNote: `Your estimate: ${Math.round(ordersPerMonth).toLocaleString("en-US")} orders a month, spread across the US by population`,
    shipFromZip,
    // The jar and lid only count for the demo candle (productPackagingOf checks the product line).
    productPackaging: data.demoProductPackaging,
    current: { ...preset.setup },
    priority: "balanced",
  };
}

export type QuickEstimate =
  | { status: "no-fit" }
  | {
      status: "ok";
      current: ScoredSetup;
      /** False when today's packaging is below the protection the product needs (glass in a plain mailer). */
      currentMeetsMinimum: boolean;
      best: Swap | null;
    };

export function quickEstimate(data: AppData, input: PlannerInput): QuickEstimate {
  const setup = currentSetup(input);
  if (!setup) return { status: "no-fit" };
  const result = rankSwaps(toProducts(input), setup, data.catalog, toContext(input, data), WEIGHT_PRESETS.balanced, 50);
  if (!result) return { status: "no-fit" };
  // The panel shows one "better" setup: the safe swap with the best overall score (ties go to more plastic avoided).
  // That matches "Our pick" on the results page. The full swap list there stays ranked by plastic avoided.
  const best =
    [...result.swaps].sort(
      (a, b) => b.score_change - a.score_change || b.plastic_avoided_lb_per_year - a.plastic_avoided_lb_per_year,
    )[0] ?? null;
  return { status: "ok", current: result.current, currentMeetsMinimum: result.currentMeetsMinimum, best };
}
