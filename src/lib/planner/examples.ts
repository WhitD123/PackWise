// Example products for the planner's "start from an example" menu.
// Sizes and weights are estimates. Product shape: docs/data-format.md section 9.

import type { Product } from "../types.ts";

export interface ExampleProduct extends Product {
  id: string;
}

export const EXAMPLE_PRODUCTS: ExampleProduct[] = [
  { id: "candle-8oz", name: "8 oz candle in glass jar", length_in: 3.5, width_in: 3.5, height_in: 4, weight_g: 450, fragility: "high", items_per_order: 1 },
  { id: "candle-12oz", name: "12 oz candle in glass jar", length_in: 4, width_in: 4, height_in: 4.5, weight_g: 650, fragility: "high", items_per_order: 1 },
  { id: "ceramic-mug", name: "Ceramic mug", length_in: 4.5, width_in: 3.5, height_in: 4, weight_g: 350, fragility: "high", items_per_order: 1 },
  { id: "soap-bar", name: "Bar soap", length_in: 3.5, width_in: 2.5, height_in: 1.2, weight_g: 120, fragility: "low", items_per_order: 1 },
  { id: "tshirt-folded", name: "Folded T-shirt", length_in: 10, width_in: 8, height_in: 1, weight_g: 180, fragility: "low", items_per_order: 1 },
  { id: "paperback-book", name: "Paperback book", length_in: 9, width_in: 6, height_in: 1, weight_g: 450, fragility: "low", items_per_order: 1 },
];
