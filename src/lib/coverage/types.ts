// Shapes for the "Am I covered?" check (docs/data-format.md sections 5, 6 and 9).
// Units are in the field names: _usd dollars, _lb pounds, _g grams.

/** One record in data/rules/state-coverage.json. Only the fields the check reads. */
export interface StateCoverageRule {
  state: string;
  name: string;
  law_name: string | null;
  law_status: "fees_active" | "fees_upcoming" | "registration_only" | "none";
  revenue_threshold_usd: number | null;
  revenue_scope: "global" | "in_state" | null;
  weight_threshold_lb: number | null;
  exempt_if: "any_test" | "revenue_only" | null;
  application_required: boolean | null;
  key_dates: { date: string; event: string }[];
  fee_file: string | null;
  source_url: string;
  last_checked: string;
}

/** One record in data/fees/*.json. Negative rates (credits) are allowed. */
export interface FeeSchedule {
  state: string;
  program_year: number;
  status: "final" | "proposed";
  rates: Record<
    string,
    { rate_usd_per_lb: number; official_category?: string; plastic_component_fees_apply?: boolean }
  >;
  /** California only: charged per pound of plastic, on top of the base rate. */
  plastic_component_fees?: {
    reuse_investment_usd_per_lb_plastic: number;
    ppmf_weight_usd_per_lb_plastic: number;
  };
  source_url: string;
  last_checked: string;
}

export interface SellerProfile {
  /** Worldwide gross revenue for the year the user says their numbers cover. */
  worldwideRevenueUsd: number;
  /** Gross sales delivered into California. null = not known yet. */
  californiaSalesUsd: number | null;
}

export interface CoverageInput {
  seller: SellerProfile;
  /** Orders delivered to each state per year, state code -> count (already annualized). */
  ordersPerYearByState: Record<string, number>;
  /**
   * Packaging per order, grams by material id: shipping box, fill, wrap and
   * product packaging (jar, lid). The caller builds it, so the "treat the jar
   * as product" toggle is just a second call without the jar.
   */
  packagingGramsPerOrderByMaterial: Record<string, number>;
}

/** Section 9 result, plus extra detail the card shows. */
export interface CoverageResult {
  state: string;
  result: "covered" | "exempt" | "no_law" | "apply_for_exemption";
  /** One plain sentence. */
  reason: string;
  /** null if exempt, if no rates exist, or if the fee can't be estimated. */
  fee_usd_per_year: number | null;
  fee_status: "final" | "proposed" | "none";
  /** Packaging delivered into the state per year, all materials. */
  weight_lb_per_year: number;
  /** True when the deciding number is within the close-to-the-line band. */
  close_to_line: boolean;
  /** What the user still has to enter, or null. */
  needs_input: string | null;
  /** Things the user should know: missing rates, excluded fees. */
  warnings: string[];
  source_url: string;
  last_checked: string;
}

export interface FeeEstimate {
  fee_usd_per_year: number;
  /** Materials with weight but no rate. Counted as "no rate found", never as zero. */
  missing_materials: string[];
  by_material: Record<string, number>;
  warnings: string[];
}
