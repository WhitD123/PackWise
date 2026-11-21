// Loads the JSON files in data/ (docs/data-format.md section 2).
// The only file in src/ that knows where data lives.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import coloradoFees from "../../data/fees/colorado-2027.json" with { type: "json" };
import oregonFees from "../../data/fees/oregon-2027.json" with { type: "json" };
import componentsJson from "../../data/library/components.json" with { type: "json" };
import materialsJson from "../../data/materials.json" with { type: "json" };
import coverageJson from "../../data/rules/state-coverage.json" with { type: "json" };
import shippingJson from "../../data/rules/shipping.json" with { type: "json" };
import type { StateCoverageRule } from "./coverage/types.ts";
import { parseShopifyCsv } from "./orders/parseShopifyCsv.ts";
import type { Catalog, FeeSchedule, Material, PackagingComponent, ShippingRules } from "./types.ts";

/** The built-in sample order file (Maya's Candles), summarized. Read on the server only. */
export interface SampleOrders {
  label: string;
  ordersPerYear: number;
  revenuePerYear_usd: number;
  /** Orders by ship-to state, percent (0..100), all states. */
  orderStatePercent: Record<string, number>;
}

export interface AppData {
  sampleOrders: SampleOrders;
  catalog: Catalog;
  feeSchedules: FeeSchedule[];
  shipping: ShippingRules;
  coverageRules: StateCoverageRule[];
}

function loadSampleOrders(): SampleOrders {
  const csv = readFileSync(join(process.cwd(), "data/samples/shopify-orders.csv"), "utf8");
  const parsed = parseShopifyCsv(csv);
  return {
    label: "Maya's Candles (sample order file)",
    ordersPerYear: parsed.ordersPerYear,
    revenuePerYear_usd: parsed.revenuePerYear_usd,
    orderStatePercent: Object.fromEntries(Object.entries(parsed.stateShare).map(([s, v]) => [s, v * 100])),
  };
}

export function loadData(): AppData {
  // JSON imports are typed loosely (e.g. "box" becomes string), so cast once here.
  return {
    sampleOrders: loadSampleOrders(),
    catalog: {
      components: componentsJson as unknown as PackagingComponent[],
      materials: materialsJson as unknown as Material[],
    },
    feeSchedules: [oregonFees, coloradoFees] as unknown as FeeSchedule[],
    shipping: shippingJson as unknown as ShippingRules,
    coverageRules: coverageJson as unknown as StateCoverageRule[],
  };
}

/** Most recent last_checked date across the fee and shipping data, for the footer. */
export function dataLastUpdated(data: AppData): string | undefined {
  return [...data.feeSchedules.map((f) => f.last_checked), data.shipping.last_checked].sort().at(-1);
}
