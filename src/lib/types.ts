// Shared shapes. Mirrors docs/data-format.md (the contract with Tyler):
// sections 3-7 are the data files, section 9 is what code hands to code.
// Units are in every field name: _in inches, _g grams, _lb pounds, _usd dollars, _rate 0..1.

import type { SellerProfile, StateCoverageRule as CoverageRuleRecord } from "./coverage/types.ts";

export type Level = "low" | "medium" | "high";
export type Fragility = Level;
export type ProtectionLevel = Level;

// ---------------------------------------------------------------------------
// Data files
// ---------------------------------------------------------------------------

/** Section 3: data/materials.json */
export interface Material {
  id: string;
  name: string;
  is_plastic: boolean;
  recycle_rate: number;
  curbside_recyclable: boolean;
  carbon_kg_co2e_per_kg: number;
  /** End-of-life emissions, kg CO2e per kg (EPA Emission Factors Hub). A null recycling value counts as 0. */
  eol_kg_co2e_per_kg?: { landfill: number; recycling: number | null };
  disposal_text: string;
  source_url: string;
  last_checked: string;
  is_estimate: boolean;
}

export const MATERIAL_IDS = [
  "corrugated",
  "kraft-paper",
  "paperboard",
  "molded-pulp",
  "paper-plastic-mix",
  "pe-film",
  "pp-film",
  "plastic-laminate",
  "eps-foam",
  "glass",
  "aluminum",
  "steel",
] as const;

export type ComponentType = "box" | "mailer" | "filler" | "wrap" | "insert";
export type ComponentUnit = "each" | "cubic_ft" | "square_ft";

/** Section 4: one record in data/library/components.json */
export interface PackagingComponent {
  id: string;
  name: string;
  type: ComponentType;
  /** A Material id. */
  material: string;
  /** Inside size for boxes and inserts. Mailers: flat size, height_in = thickest item that fits. */
  length_in?: number;
  width_in?: number;
  height_in?: number;
  /** Outside size, when the supplier lists it. Otherwise inside + 0.25 in (an estimate). */
  outside_length_in?: number;
  outside_width_in?: number;
  outside_height_in?: number;
  unit: ComponentUnit;
  /** Per unit: one box, one cubic foot of filler, one square foot of wrap. */
  weight_g: number;
  price_usd: number;
  price_basis_qty: number;
  protection: Level;
  /** Overrides the material's recycle_rate when set. */
  recycle_rate?: number;
  /** Box with a built-in jar insert: safe for the jar it is made for without the clearance rule. */
  has_fitted_insert?: boolean;
  /** Size and count of the insert cells, for fitted-insert boxes. */
  fitted_insert?: { cells: number; cell_length_in: number; cell_width_in: number; cell_height_in: number };
  supplier: string;
  source_url: string;
  is_estimate: boolean;
  last_checked: string;
  notes?: string;
}

/** Section 5: data/fees/<state>.json */
export interface FeeSchedule {
  state: string;
  program_year: number;
  status: "final" | "proposed";
  unit: "usd_per_lb";
  rates: Record<string, { rate_usd_per_lb: number; official_category: string }>;
  source_url: string;
  last_checked: string;
  notes: string;
}

/** Section 6: one record in data/rules/state-coverage.json (used by Tyler's coverage check). */
export interface StateCoverageRule {
  state: string;
  name: string;
  law_name: string;
  law_status: "fees_active" | "fees_upcoming" | "registration_only";
  revenue_threshold_usd: number;
  revenue_scope: "global" | "in_state";
  weight_threshold_lb: number | null;
  exempt_if: "any_test" | "revenue_only";
  application_required: boolean;
  key_dates: { date: string; event: string }[];
  fee_file: string | null;
  source_url: string;
  last_checked: string;
  notes: string;
}

/** Section 7: data/rules/shipping.json */
export interface ShippingRules {
  carrier: string;
  service: string;
  zone_assumption: string;
  dim_divisor: number;
  dim_applies_above_cubic_in: number | null;
  /** Single-zone table (Zone 5 column). Used only when the zoned tables below are missing. */
  rates: { max_lb: number; price_usd: number }[];
  /** Weight prices by zone "1".."9". Pick the first row whose max_lb >= billable weight. */
  weight_rates_by_zone?: { max_lb: number; prices_by_zone: Record<string, number> }[];
  /** Ground Advantage Cubic tiers (data/rules/shipping.json). */
  cubic?: {
    max_weight_lb: number;
    max_cubic_ft: number;
    max_longest_dimension_in: number;
    tiers: { tier_cu_ft: number; prices_by_zone: Record<string, number> }[];
  };
  surcharges_usd?: {
    length_over_22_in_up_to_30_in: number;
    length_over_30_in: number;
    volume_over_2_cubic_ft: number;
  };
  /** Zone from the ship-from ZIP3 to each destination state. */
  zones_from_origin?: { origin_zip3: string; states: Record<string, { zone: number }> };
  source_url: string;
  last_checked: string;
}

// ---------------------------------------------------------------------------
// Section 9: shapes passed between code
// ---------------------------------------------------------------------------

export interface Product {
  name: string;
  length_in: number;
  width_in: number;
  height_in: number;
  weight_g: number;
  fragility: Fragility;
  items_per_order: number;
}

export interface Setup {
  outer_id: string;
  fill_id: string | null;
  wrap_id: string | null;
  insert_id: string | null;
}

export interface ScoreResult {
  cost: { usd_per_order: number; score: number };
  protection: { level: ProtectionLevel; score: number };
  waste: { landfill_g_per_order: number; score: number };
  fees: { usd_per_year: number; score: number };
  carbon: { kg_co2e_per_order: number; score: number };
  plastic_g_per_order: number;
  overall: number;
}

export interface CoverageResult {
  state: string;
  result: "covered" | "exempt" | "no_law" | "apply_for_exemption";
  reason: string;
  fee_usd_per_year: number | null;
  fee_status: "final" | "proposed" | "none";
}

// ---------------------------------------------------------------------------
// Engine inputs and internals
// ---------------------------------------------------------------------------

/** Everything the engine looks things up in. */
export interface Catalog {
  components: PackagingComponent[];
  materials: Material[];
}

export interface SellerContext {
  ordersPerYear: number;
  /** state code -> share of orders shipped there (0..1). */
  stateShare: Record<string, number>;
  shipping: ShippingRules;
  /** Share of orders by USPS zone ("1".."9"), summing to 1. Missing = Zone 5 assumed. */
  zoneShare?: Record<string, number>;
  feeSchedules: FeeSchedule[];
  /**
   * Who the seller is, for the exemption tests. When set, fees follow the coverage
   * check (an exempt state costs $0). When missing, every state with a schedule is
   * treated as covered.
   */
  coverage?: { rules: CoverageRuleRecord[]; seller: SellerProfile };
  /**
   * Grams per order, by material, of packaging that comes with the product (the candle's jar and lid).
   * The state fee check counts it for every setup alike, so the Fees score matches the coverage card.
   */
  productPackagingGrams?: Record<string, number>;
}

/** Internal geometry helper (not a data shape). */
export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface Placement {
  /** Index into the expanded item list (one entry per physical unit). */
  item: number;
  /** Lower corner, inches from the inside corner of the container. */
  x: number;
  y: number;
  z: number;
  dims: Dimensions;
}

/** The setup's parts, looked up from the catalog. */
export interface ResolvedSetup {
  outer: PackagingComponent;
  fill: PackagingComponent | null;
  wrap: PackagingComponent | null;
  insert: PackagingComponent | null;
}

/** How much of one part goes out per order. */
export interface PartUsage {
  component: PackagingComponent;
  /** In the component's unit: pieces, cubic feet or square feet. */
  units: number;
  weight_g: number;
  price_usd: number;
}

/** Raw numbers behind the score. Lower is better except protection. */
export interface FactorValues {
  cost: number;
  protection: ProtectionLevel;
  waste: number;
  fees: number;
  carbon: number;
}

export type FactorKey = keyof FactorValues;
export type FactorScores = Record<FactorKey, number>;
export type Weights = Partial<Record<FactorKey, number>>;

export interface EvaluatedSetup {
  /** Stable key, e.g. "box-8x8x8+kraft-fill". */
  key: string;
  setup: Setup;
  parts: ResolvedSetup;
  usage: PartUsage[];
  packagingWeight_g: number;
  plasticWeight_g: number;
  packagingCost_usd: number;
  shippingCost_usd: number;
  billableWeight_lb: number;
  /** Outside size of the packed shipment, used for dimensional weight and Cubic pricing. */
  shippedDims: Dimensions;
  /** Which price won: weight, Cubic, or a mix across zones. Undefined with the old single-zone table. */
  shippingMethod?: "weight" | "cubic" | "mixed";
  /** "exact": zones from the order mix. "assumed": no order mix given, so Zone 5 for every order. */
  zoneLabel?: "exact" | "assumed";
  /** Empty space inside a box, cubic inches (0 for mailers). */
  voidVolume_in3: number;
  placements: Placement[];
  /** Things the user should know, e.g. a fee rate missing for a material. */
  warnings: string[];
  values: FactorValues;
}

export interface ScoredSetup extends EvaluatedSetup {
  score: ScoreResult;
}

/** Section 9 swap shape, plus extra detail the results screen shows. */
export interface Swap {
  from: Setup;
  to: Setup;
  usd_saved_per_year: number;
  plastic_avoided_lb_per_year: number;
  score_change: number;
  tradeoffs: string[];
  landfill_avoided_lb_per_year: number;
  fees_saved_usd_per_year: number;
  carbon_avoided_kg_per_year: number;
  /** Factors where the new setup is worse. */
  worse_on: FactorKey[];
  /** One sentence for the screen. */
  summary: string;
  /** The full scored option, for the five-factor label. */
  option: ScoredSetup;
}
