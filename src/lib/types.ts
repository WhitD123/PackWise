// Shared shapes. Mirrors docs/data-format.md (the contract with Tyler):
// sections 3-7 are the data files, section 9 is what code hands to code.
// Units are in every field name: _in inches, _g grams, _lb pounds, _usd dollars, _rate 0..1.

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
  unit: ComponentUnit;
  /** Per unit: one box, one cubic foot of filler, one square foot of wrap. */
  weight_g: number;
  price_usd: number;
  price_basis_qty: number;
  protection: Level;
  /** Overrides the material's recycle_rate when set. */
  recycle_rate?: number;
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
  rates: { max_lb: number; price_usd: number }[];
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
  feeSchedules: FeeSchedule[];
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
  /** Outside size of the packed shipment, used for dimensional weight. */
  shippedDims: Dimensions;
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
