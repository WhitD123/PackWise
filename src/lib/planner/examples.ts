// Example products for the planner's "start from an example" menu.
// The two candles match the sourced demo candles in data/samples/demo-products.json (a test checks this):
// size = jar diameter x height with cap, weight = packed weight. The other products are typical estimates.
// Product shape: docs/data-format.md section 9.

import type { Product } from "../types.ts";

/** How a product is drawn from above in the carton pictures. Only used for drawing. */
export type ProductLook = "jar" | "mug" | "bar" | "folded" | "book" | "generic";

export interface ExampleProduct extends Product {
  id: string;
  look: ProductLook;
}

/** The drawing for a product, by its name. Anything that is not one of the examples is drawn as a plain block. */
export function lookOf(name: string | undefined): ProductLook {
  return EXAMPLE_PRODUCTS.find((p) => p.name === name)?.look ?? "generic";
}

export const EXAMPLE_PRODUCTS: ExampleProduct[] = [
  { id: "candle-8oz", look: "jar", name: "8 oz glass-jar candle", length_in: 2.875, width_in: 2.875, height_in: 3.5625, weight_g: 398.0, fragility: "high", items_per_order: 1 },
  { id: "candle-12oz", look: "jar", name: "12 oz glass-jar candle", length_in: 3.25, width_in: 3.25, height_in: 3.25, weight_g: 463.1, fragility: "high", items_per_order: 1 },
  { id: "ceramic-mug", look: "mug", name: "Ceramic mug", length_in: 4.5, width_in: 3.5, height_in: 4, weight_g: 350, fragility: "high", items_per_order: 1 },
  { id: "soap-bar", look: "bar", name: "Bar soap", length_in: 3.5, width_in: 2.5, height_in: 1.2, weight_g: 120, fragility: "low", items_per_order: 1 },
  { id: "tshirt-folded", look: "folded", name: "Folded T-shirt", length_in: 10, width_in: 8, height_in: 1, weight_g: 180, fragility: "low", items_per_order: 1 },
  { id: "paperback-book", look: "book", name: "Paperback book", length_in: 9, width_in: 6, height_in: 1, weight_g: 450, fragility: "low", items_per_order: 1 },
];
