// Loads the JSON files in data/ (docs/data-format.md section 2).
// The only file in src/ that knows where data lives.

import coloradoFees from "../../data/fees/colorado-2027.json" with { type: "json" };
import oregonFees from "../../data/fees/oregon-2027.json" with { type: "json" };
import componentsJson from "../../data/library/components.json" with { type: "json" };
import materialsJson from "../../data/materials.json" with { type: "json" };
import shippingJson from "../../data/rules/shipping.json" with { type: "json" };
import type { Catalog, FeeSchedule, Material, PackagingComponent, ShippingRules } from "./types.ts";

export interface AppData {
  catalog: Catalog;
  feeSchedules: FeeSchedule[];
  shipping: ShippingRules;
}

export function loadData(): AppData {
  // JSON imports are typed loosely (e.g. "box" becomes string), so cast once here.
  return {
    catalog: {
      components: componentsJson as unknown as PackagingComponent[],
      materials: materialsJson as unknown as Material[],
    },
    feeSchedules: [oregonFees, coloradoFees] as unknown as FeeSchedule[],
    shipping: shippingJson as unknown as ShippingRules,
  };
}

/** Most recent last_checked date across the fee and shipping data, for the footer. */
export function dataLastUpdated(data: AppData): string | undefined {
  return [...data.feeSchedules.map((f) => f.last_checked), data.shipping.last_checked].sort().at(-1);
}
