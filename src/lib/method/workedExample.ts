// The worked example on the "How we calculate this" page: Maya's candle, today's setup against the top
// swap, with every part's weight, recycle rate and carbon shown. Everything is read from the engine, never typed.

import { describeSetup, indexCatalog } from "../catalog.ts";
import type { AppData } from "../data.ts";
import { projectSwap, type Projection } from "../impact/projection.ts";
import { lifecycleFactor } from "../planner/evaluateSetup.ts";
import { currentSetup, defaultInput, toContext, toProducts, type PlannerInput } from "../planner/plannerInput.ts";
import { rankSwaps } from "../swaps/rankSwaps.ts";
import type { EvaluatedSetup, ScoredSetup } from "../types.ts";

export interface PartRow {
  name: string;
  materialName: string;
  /** "1", "0.54 cu ft" or "0.88 sq ft". */
  amount: string;
  grams: number;
  recycleRate: number;
  landfillGrams: number;
  co2eGrams: number;
}

export interface SetupBreakdown {
  label: string;
  description: string;
  parts: PartRow[];
  evaluated: EvaluatedSetup;
}

export interface WorkedExample {
  input: PlannerInput;
  ordersPerYear: number;
  today: SetupBreakdown;
  swap: SetupBreakdown;
  /** The same two setups with their five-factor scores, for the label. */
  todayScored: ScoredSetup;
  swapScored: ScoredSetup;
  /** Yearly differences, from the top swap. */
  swapYear: { usdSaved: number; plasticAvoidedLb: number; landfillAvoidedLb: number; carbonAvoidedKg: number };
  projection: Projection;
}

function amountText(unit: string, units: number): string {
  if (unit === "cubic_ft") return `${units.toFixed(2)} cu ft`;
  if (unit === "square_ft") return `${units.toFixed(2)} sq ft`;
  return String(units);
}

function breakdown(label: string, ev: EvaluatedSetup, data: AppData): SetupBreakdown {
  const index = indexCatalog(data.catalog);
  const parts = ev.usage.map((u): PartRow => {
    const m = index.material(u.component.material);
    const recycleRate = u.component.recycle_rate ?? m?.recycle_rate ?? 0;
    return {
      name: u.component.name,
      materialName: m?.name ?? u.component.material,
      amount: amountText(u.component.unit, u.units),
      grams: u.weight_g,
      recycleRate,
      landfillGrams: u.weight_g * (1 - recycleRate),
      co2eGrams: (u.weight_g / 1000) * lifecycleFactor(m, recycleRate) * 1000,
    };
  });
  return { label, description: describeSetup(ev.parts), parts, evaluated: ev };
}

/** Null if the demo order has no safe swap (not expected with the shipped data). */
export function buildWorkedExample(data: AppData): WorkedExample | null {
  const input = defaultInput(data);
  const setup = currentSetup(input);
  if (!setup) return null;
  const result = rankSwaps(toProducts(input), setup, data.catalog, toContext(input, data));
  const top = result?.swaps[0];
  if (!result || !top) return null;
  const before: ScoredSetup = result.current;
  const after: ScoredSetup = top.option;
  return {
    input,
    ordersPerYear: input.ordersPerYear,
    todayScored: before,
    swapScored: after,
    today: breakdown("Today", before, data),
    swap: breakdown("Top swap", after, data),
    swapYear: {
      usdSaved: top.usd_saved_per_year,
      plasticAvoidedLb: top.plastic_avoided_lb_per_year,
      landfillAvoidedLb: top.landfill_avoided_lb_per_year,
      carbonAvoidedKg: top.carbon_avoided_kg_per_year,
    },
    projection: projectSwap(before, after, input.ordersPerYear, data.usParcelVolume.value_billion * 1e9),
  };
}
