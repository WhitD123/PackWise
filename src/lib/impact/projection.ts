// The "N similar sellers" projection (data/rules/environment.json, projection).
// One seller's own swap, scaled linearly by N. It does NOT predict that N sellers will switch.
//
//   plastic_avoided_lb = N x orders per year x (plastic g before - plastic g after) / 453.592
//   material_added_lb  = N x orders per year x (non-plastic g after - non-plastic g before) / 453.592
//   parcel_share       = N x orders per year / US parcels per year

import { GRAMS_PER_LB } from "../rightsizing/dimWeight.ts";
import type { EvaluatedSetup } from "../types.ts";

/**
 * How many "similar sellers" the projection scales to. A presentation choice, not research data.
 * Open decision: at Maya's volume 1,000 sellers is about 0.5% of US parcels, which is aggressive for a
 * small-seller pitch (CLAUDE.md section 10). Both the results page and the method page read this one value.
 */
export const PROJECTION_SELLERS = 1000;

export interface Projection {
  sellers: number;
  ordersPerSeller: number;
  /** One seller's plastic avoided per year, lb. */
  plasticAvoidedLbPerSeller: number;
  plasticAvoidedLb: number;
  plasticAvoidedUsTons: number;
  /** Non-plastic packaging added (positive) or saved (negative) across all sellers, lb. */
  nonPlasticAddedLb: number;
  /** Share of all US parcels these orders would be, 0 to 1. */
  parcelShare: number;
}

const nonPlastic_g = (s: EvaluatedSetup) => s.packagingWeight_g - s.plasticWeight_g;

export function projectSwap(
  before: EvaluatedSetup,
  after: EvaluatedSetup,
  ordersPerYear: number,
  usParcelsPerYear: number,
  sellers: number = PROJECTION_SELLERS,
): Projection {
  const plasticAvoidedLbPerSeller = ((before.plasticWeight_g - after.plasticWeight_g) * ordersPerYear) / GRAMS_PER_LB;
  const plasticAvoidedLb = plasticAvoidedLbPerSeller * sellers;
  return {
    sellers,
    ordersPerSeller: ordersPerYear,
    plasticAvoidedLbPerSeller,
    plasticAvoidedLb,
    plasticAvoidedUsTons: plasticAvoidedLb / 2000,
    nonPlasticAddedLb: (((nonPlastic_g(after) - nonPlastic_g(before)) * ordersPerYear) / GRAMS_PER_LB) * sellers,
    parcelShare: (sellers * ordersPerYear) / usParcelsPerYear,
  };
}
