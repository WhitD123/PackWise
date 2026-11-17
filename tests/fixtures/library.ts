// Small made-up catalog and context for engine tests, in the docs/data-format.md shapes.
// NOT real data: the real files live in data/ (Tyler).
// Numbers are round so expected answers can be worked out by hand.

import type { Catalog, Material, PackagingComponent, Product, SellerContext, ShippingRules } from "../../src/lib/types.ts";

const SRC = { source_url: "", last_checked: "2026-11-16", is_estimate: true };

const material = (id: string, is_plastic: boolean, recycle_rate: number, carbon: number): Material => ({
  id,
  name: id,
  is_plastic,
  recycle_rate,
  curbside_recyclable: !is_plastic,
  carbon_kg_co2e_per_kg: carbon,
  disposal_text: "",
  ...SRC,
});

export const MATERIALS: Material[] = [
  material("corrugated", false, 0.9, 0.9),
  material("kraft-paper", false, 0.8, 1.1),
  material("molded-pulp", false, 0.5, 0.8),
  material("pe-film", true, 0.1, 2.5),
];

const base = { price_basis_qty: 500, supplier: "test", ...SRC };

const box = (l: number, w: number, h: number, weight_g: number, price_usd: number): PackagingComponent => ({
  id: `box-${l}x${w}x${h}`,
  name: `Box ${l}x${w}x${h}`,
  type: "box",
  material: "corrugated",
  length_in: l,
  width_in: w,
  height_in: h,
  unit: "each",
  weight_g,
  price_usd,
  protection: "high",
  ...base,
});

export const BOX_4 = box(4, 4, 4, 80, 0.45);
export const BOX_6 = box(6, 6, 6, 150, 0.8);
export const BOX_8 = box(8, 8, 8, 220, 1.1);
export const BOX_12x8x8 = box(12, 8, 8, 280, 1.35);
export const BOX_12 = box(12, 12, 12, 400, 1.9);

export const POLY_MAILER: PackagingComponent = {
  id: "poly-mailer-10x13",
  name: "Poly mailer 10x13",
  type: "mailer",
  material: "pe-film",
  length_in: 13,
  width_in: 10,
  height_in: 5,
  unit: "each",
  weight_g: 15,
  price_usd: 0.12,
  protection: "low",
  ...base,
};

export const PADDED_KRAFT_MAILER: PackagingComponent = {
  ...POLY_MAILER,
  id: "padded-kraft-mailer-10x13",
  name: "Padded kraft mailer 10x13",
  material: "kraft-paper",
  weight_g: 60,
  price_usd: 0.55,
  protection: "medium",
};

export const AIR_PILLOWS: PackagingComponent = {
  id: "air-pillows",
  name: "Air pillows",
  type: "filler",
  material: "pe-film",
  unit: "cubic_ft",
  weight_g: 54,
  price_usd: 0.54,
  protection: "medium",
  ...base,
  price_basis_qty: 1,
};

export const KRAFT_FILL: PackagingComponent = {
  ...AIR_PILLOWS,
  id: "kraft-fill",
  name: "Kraft paper fill",
  material: "kraft-paper",
  weight_g: 200,
  price_usd: 0.5,
};

export const BUBBLE_WRAP: PackagingComponent = {
  id: "bubble-wrap",
  name: "Bubble wrap",
  type: "wrap",
  material: "pe-film",
  unit: "square_ft",
  weight_g: 4,
  price_usd: 0.05,
  protection: "high",
  ...base,
  price_basis_qty: 1,
};

export const HONEYCOMB_WRAP: PackagingComponent = {
  ...BUBBLE_WRAP,
  id: "honeycomb-wrap",
  name: "Honeycomb paper wrap",
  material: "kraft-paper",
  weight_g: 10,
  price_usd: 0.08,
};

export const JAR_INSERT: PackagingComponent = {
  id: "jar-insert",
  name: "Molded pulp jar insert",
  type: "insert",
  material: "molded-pulp",
  length_in: 4,
  width_in: 4,
  height_in: 4.5,
  unit: "each",
  weight_g: 45,
  price_usd: 0.4,
  protection: "high",
  ...base,
};

export const CATALOG: Catalog = {
  components: [
    BOX_4, BOX_6, BOX_8, BOX_12x8x8, BOX_12,
    POLY_MAILER, PADDED_KRAFT_MAILER,
    AIR_PILLOWS, KRAFT_FILL, BUBBLE_WRAP, HONEYCOMB_WRAP, JAR_INSERT,
  ],
  materials: MATERIALS,
};

export const setup = (outer: PackagingComponent, extras: { fill?: PackagingComponent; wrap?: PackagingComponent; insert?: PackagingComponent } = {}) => ({
  outer_id: outer.id,
  fill_id: extras.fill?.id ?? null,
  wrap_id: extras.wrap?.id ?? null,
  insert_id: extras.insert?.id ?? null,
});

export const CANDLE: Product = {
  name: "8 oz candle in glass jar",
  length_in: 3.5,
  width_in: 3.5,
  height_in: 4,
  weight_g: 450,
  fragility: "high",
  items_per_order: 1,
};

export const SOAP: Product = {
  name: "Bar soap",
  length_in: 3.5,
  width_in: 2.5,
  height_in: 1.2,
  weight_g: 120,
  fragility: "low",
  items_per_order: 1,
};

export const TSHIRT: Product = {
  name: "Folded T-shirt",
  length_in: 10,
  width_in: 8,
  height_in: 1,
  weight_g: 180,
  fragility: "low",
  items_per_order: 1,
};

export const USPS_LIKE: ShippingRules = {
  carrier: "USPS-like",
  service: "test",
  zone_assumption: "test",
  dim_divisor: 166,
  dim_applies_above_cubic_in: 1728,
  rates: [
    { max_lb: 1, price_usd: 5.5 },
    { max_lb: 2, price_usd: 6.5 },
    { max_lb: 3, price_usd: 7.5 },
    { max_lb: 5, price_usd: 9 },
    { max_lb: 10, price_usd: 13 },
    { max_lb: 20, price_usd: 20 },
  ],
  source_url: "",
  last_checked: "2026-11-16",
};

export const UPS_LIKE: ShippingRules = { ...USPS_LIKE, carrier: "UPS-like", dim_divisor: 139, dim_applies_above_cubic_in: null };

export const CONTEXT: SellerContext = {
  ordersPerYear: 10000,
  stateShare: { OR: 0.1 },
  shipping: USPS_LIKE,
  feeSchedules: [
    {
      state: "OR",
      program_year: 2026,
      status: "final",
      unit: "usd_per_lb",
      rates: {
        corrugated: { rate_usd_per_lb: 0.08, official_category: "Corrugated cardboard" },
        "pe-film": { rate_usd_per_lb: 0.43, official_category: "HDPE/LDPE film" },
        "kraft-paper": { rate_usd_per_lb: 0.08, official_category: "test" },
        "molded-pulp": { rate_usd_per_lb: 0.08, official_category: "test" },
      },
      source_url: "",
      last_checked: "2026-11-16",
      notes: "",
    },
  ],
};
