// Turns raw factor values into 0..10 scores and an overall score (brief section 13).
//
// Step 2: within the options being compared, best = 10, worst = 0:
//     score = 10 * (worst - this) / (worst - best)
//   If every option ties on a factor, they all get 10 (nothing to choose between).
//   Protection maps directly: low = 2, medium = 6, high = 9.
// Step 3: drop options that are beaten or tied on every factor and beaten on at least one.
// Step 4: overall = sum(weight * score) / sum(weights).

import type { FactorKey, FactorScores, FactorValues, ScoreResult, Weights } from "../types.ts";
import { FACTORS } from "./weights.ts";

export const PROTECTION_SCORE = { low: 2, medium: 6, high: 9 } as const;

const EPS = 1e-9;

/** Scale "lower is better" numbers to 0..10. */
export function scaleLowerIsBetter(values: number[]): number[] {
  const best = Math.min(...values);
  const worst = Math.max(...values);
  if (worst - best < EPS) return values.map(() => 10);
  return values.map((v) => (10 * (worst - v)) / (worst - best));
}

/** Higher is better for every key in the result. */
function comparable(v: FactorValues): Record<FactorKey, number> {
  return {
    cost: -v.cost,
    protection: PROTECTION_SCORE[v.protection],
    waste: -v.waste,
    fees: -v.fees,
    carbon: -v.carbon,
  };
}

/** True when a is at least as good as b on every factor and better on one. */
export function dominates(a: FactorValues, b: FactorValues): boolean {
  const ca = comparable(a);
  const cb = comparable(b);
  let strictlyBetter = false;
  for (const f of FACTORS) {
    if (ca[f] < cb[f] - EPS) return false;
    if (ca[f] > cb[f] + EPS) strictlyBetter = true;
  }
  return strictlyBetter;
}

/** Step 3: keep only options no other option beats outright. */
export function paretoFilter<T extends { values: FactorValues }>(options: T[]): T[] {
  return options.filter((o) => !options.some((other) => other !== o && dominates(other.values, o.values)));
}

export function overallScore(scores: FactorScores, weights: Weights): number {
  let total = 0;
  let weightSum = 0;
  for (const f of FACTORS) {
    const w = weights[f] ?? 0;
    total += w * scores[f];
    weightSum += w;
  }
  return weightSum > 0 ? total / weightSum : 0;
}

/** Steps 2 and 4 for a set of options describing the same order. */
export function scoreOptions<T extends { values: FactorValues; plasticWeight_g?: number }>(
  options: T[],
  weights: Weights,
): (T & { score: ScoreResult })[] {
  if (options.length === 0) return [];
  const scaled = {
    cost: scaleLowerIsBetter(options.map((o) => o.values.cost)),
    waste: scaleLowerIsBetter(options.map((o) => o.values.waste)),
    fees: scaleLowerIsBetter(options.map((o) => o.values.fees)),
    carbon: scaleLowerIsBetter(options.map((o) => o.values.carbon)),
  };
  return options.map((o, i) => {
    const v = o.values;
    const s: FactorScores = {
      cost: scaled.cost[i],
      protection: PROTECTION_SCORE[v.protection],
      waste: scaled.waste[i],
      fees: scaled.fees[i],
      carbon: scaled.carbon[i],
    };
    const score: ScoreResult = {
      cost: { usd_per_order: v.cost, score: s.cost },
      protection: { level: v.protection, score: s.protection },
      waste: { landfill_g_per_order: v.waste, score: s.waste },
      fees: { usd_per_year: v.fees, score: s.fees },
      carbon: { kg_co2e_per_order: v.carbon, score: s.carbon },
      plastic_g_per_order: o.plasticWeight_g ?? 0,
      overall: overallScore(s, weights),
    };
    return { ...o, score };
  });
}
