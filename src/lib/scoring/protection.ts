// Protection rating of a whole setup (docs/scoring-spec.md section 3).
//
// Rated from the packing rules in data/rules/packing-rules.json, not from each
// part's own `protection` field (27 of 29 library boxes are just "medium").
//
// Clearance (R1, R2) is checked when the order is packed: a setup that does not
// fit with the required clearance never reaches this function, except the
// seller's current packaging, which is measured without it.
//
//   Mailer: glass never rates above low (R1). Otherwise the mailer's own level,
//           raised from low to medium by a wrap or insert.
//   Box:    starts at high, then
//             - over 30 lb: low (R7, 32 ECT single wall is the limit)
//             - glass with no individual wrap, protective insert or fitted insert: low (R3)
//             - glass with crumpled-paper fill: one level down (R5, guidance)
//             - empty space left unfilled (fails the shake test): one level down

import type { Fragility, ProtectionLevel, ResolvedSetup } from "../types.ts";

export const PROTECTION_RANK: Record<ProtectionLevel, number> = { low: 0, medium: 1, high: 2 };
const BY_RANK: ProtectionLevel[] = ["low", "medium", "high"];

/** R7: heaviest package a 32 ECT single-wall box is rated for. */
export const MAX_SINGLE_WALL_LB = 30;

export interface ProtectionFacts {
  /** The box has a fitted insert and every item sits in a cell of it. */
  fitted?: boolean;
  /** Empty space in the box, cubic inches. */
  voidVolume_in3?: number;
  /** Product plus packaging, pounds. */
  shippedWeight_lb?: number;
}

export function rateProtection(parts: ResolvedSetup, fragility: Fragility, facts: ProtectionFacts = {}): ProtectionLevel {
  const { outer, fill, wrap, insert } = parts;
  const glass = fragility === "high";

  if (outer.type === "mailer") {
    if (glass) return "low";
    const raised = outer.protection === "low" && (wrap || insert) ? "medium" : outer.protection;
    return raised;
  }

  const fitted = facts.fitted === true;
  if ((facts.shippedWeight_lb ?? 0) > MAX_SINGLE_WALL_LB) return "low";

  const protectiveInsert = insert !== null && insert.protection !== "low";
  if (glass && !(wrap || protectiveInsert || fitted)) return "low";

  let rank = PROTECTION_RANK.high;
  if (glass && fill && fill.material === "kraft-paper") rank -= 1;
  const unfilledVoid = (facts.voidVolume_in3 ?? 0) > 0 && !fill && !fitted && !protectiveInsert;
  if (fragility !== "low" && unfilledVoid) rank -= 1;
  return BY_RANK[Math.max(rank, 0)];
}

/** Lowest protection we will ever recommend for a product of this fragility. */
export function minimumProtection(fragility: Fragility): ProtectionLevel {
  return fragility;
}

export function meetsMinimum(level: ProtectionLevel, fragility: Fragility): boolean {
  return PROTECTION_RANK[level] >= PROTECTION_RANK[minimumProtection(fragility)];
}
