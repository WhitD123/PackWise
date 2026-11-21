// Loads the JSON files in data/ (docs/data-format.md section 2).
// The only file in src/ that knows where data lives.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import californiaFees from "../../data/fees/california.json" with { type: "json" };
import coloradoFees from "../../data/fees/colorado-2027.json" with { type: "json" };
import oregonFees from "../../data/fees/oregon-2027.json" with { type: "json" };
import demoProductsJson from "../../data/samples/demo-products.json" with { type: "json" };
import componentsJson from "../../data/library/components.json" with { type: "json" };
import materialsJson from "../../data/materials.json" with { type: "json" };
import coverageJson from "../../data/rules/state-coverage.json" with { type: "json" };
import environmentJson from "../../data/rules/environment.json" with { type: "json" };
import shippingJson from "../../data/rules/shipping.json" with { type: "json" };
import populationJson from "../../data/rules/state-population.json" with { type: "json" };
import type { FeeSchedule as CoverageFeeSchedule, StateCoverageRule } from "./coverage/types.ts";
import { parseShopifyCsv } from "./orders/parseShopifyCsv.ts";
import type { Catalog, FeeSchedule, Material, PackagingComponent, ShippingRules } from "./types.ts";

/** The built-in sample order file (Maya's Candles), summarized. Read on the server only. */
export interface SampleOrders {
  label: string;
  ordersPerYear: number;
  revenuePerYear_usd: number;
  /** Orders by ship-to state, percent (0..100), all states. */
  orderStatePercent: Record<string, number>;
  /** Sales delivered into California per year, for California's in-state test. */
  californiaSalesUsd: number;
}

/** Packaging that comes with the product itself (jar, lid), per item. */
export interface ProductPackagingPart {
  label: string;
  material: string;
  weight_g: number;
  /** True for the candle jar and lid: "likely covered, no official ruling". */
  is_candle_container: boolean;
}

export interface AppData {
  sampleOrders: SampleOrders;
  catalog: Catalog;
  feeSchedules: FeeSchedule[];
  shipping: ShippingRules;
  coverageRules: StateCoverageRule[];
  /** Every fee schedule a state rule points to, keyed by its fee_file name (includes California). */
  coverageSchedules: Record<string, CoverageFeeSchedule>;
  /** Maya's jar and lid (data/samples/demo-products.json, Uline S-22916M-GLD). */
  demoProductPackaging: ProductPackagingPart[];
  /**
   * Percent of the US population in each state (Census, state-population.json). Used to spread orders across the
   * country when a seller has no order file yet: the population fallback CLAUDE.md section 8 allows, labeled as an estimate.
   */
  populationPercent: Record<string, number>;
  populationVintage: string;
  /** US parcels shipped in 2025, the scale anchor for the impact projection (environment.json impact_baseline). */
  usParcelVolume: { value_billion: number; year: number; publisher: string; source_url: string };
  /** EU PPWR Article 24: maximum empty space for e-commerce packaging. A benchmark only, not a US law. */
  euEmptySpace: { max_empty_space_ratio: number; application_date: string; source_url: string };
}

function loadSampleOrders(): SampleOrders {
  const csv = readFileSync(join(process.cwd(), "data/samples/shopify-orders.csv"), "utf8");
  const parsed = parseShopifyCsv(csv);
  return {
    label: "Maya's Candles (sample order file)",
    ordersPerYear: parsed.ordersPerYear,
    revenuePerYear_usd: parsed.revenuePerYear_usd,
    orderStatePercent: Object.fromEntries(Object.entries(parsed.stateShare).map(([s, v]) => [s, v * 100])),
    californiaSalesUsd: parsed.salesPerYearByState_usd.CA ?? 0,
  };
}

const DEMO_JAR_ID = "uline-s-22916m-gld-12oz-straight-sided";

function loadDemoProductPackaging(): ProductPackagingPart[] {
  const jars = (demoProductsJson as unknown as { jars: { id: string; jar_weight_g: number | null; lid_weight_g: number | null }[] }).jars;
  const jar = jars.find((j) => j.id === DEMO_JAR_ID);
  if (!jar || jar.jar_weight_g === null || jar.lid_weight_g === null) return [];
  return [
    { label: "Glass jar", material: "glass", weight_g: jar.jar_weight_g, is_candle_container: true },
    // Electrolytic tin-coated steel cap (Uline listing).
    { label: "Metal lid", material: "steel", weight_g: jar.lid_weight_g, is_candle_container: true },
  ];
}

function loadPopulation(): Pick<AppData, "populationPercent" | "populationVintage"> {
  const rows = populationJson as { state: string; population: number; vintage: string }[];
  const total = rows.reduce((s, r) => s + r.population, 0);
  return {
    populationPercent: Object.fromEntries(rows.map((r) => [r.state, (r.population / total) * 100])),
    populationVintage: rows[0]?.vintage ?? "",
  };
}

function loadParcelVolume(): AppData["usParcelVolume"] {
  const fact = (environmentJson.impact_baseline as { id: string; value: number; year: number; publisher: string; source_url: string }[]).find(
    (f) => f.id === "us-parcel-volume-2025",
  );
  if (!fact) throw new Error("environment.json is missing the us-parcel-volume-2025 fact");
  return { value_billion: fact.value, year: fact.year, publisher: fact.publisher, source_url: fact.source_url };
}

export function loadData(): AppData {
  // JSON imports are typed loosely (e.g. "box" becomes string), so cast once here.
  return {
    sampleOrders: loadSampleOrders(),
    catalog: {
      components: componentsJson as unknown as PackagingComponent[],
      materials: materialsJson as unknown as Material[],
    },
    // Every state with a fee schedule counts toward the Fees score. California's 2027 rates are
    // proposed (status "proposed"); the coverage card labels them that way.
    feeSchedules: [oregonFees, coloradoFees, californiaFees] as unknown as FeeSchedule[],
    shipping: shippingJson as unknown as ShippingRules,
    coverageRules: coverageJson as unknown as StateCoverageRule[],
    coverageSchedules: {
      "oregon-2027.json": oregonFees as unknown as CoverageFeeSchedule,
      "colorado-2027.json": coloradoFees as unknown as CoverageFeeSchedule,
      "california.json": californiaFees as unknown as CoverageFeeSchedule,
    },
    demoProductPackaging: loadDemoProductPackaging(),
    euEmptySpace: environmentJson.eu_empty_space,
    usParcelVolume: loadParcelVolume(),
    ...loadPopulation(),
  };
}

/** Most recent last_checked date across the fee and shipping data, for the footer. */
export function dataLastUpdated(data: AppData): string | undefined {
  return [...data.feeSchedules.map((f) => f.last_checked), data.shipping.last_checked].sort().at(-1);
}
