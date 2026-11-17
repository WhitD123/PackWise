// Protection rating from each part's own `protection` level (data-format section 4).
// Placeholder points until docs/scoring-spec.md fixes the final values.
//
//   points = outer points + cushion points of fill, wrap and insert
//   needed = depends on how fragile the product is
//   high if points >= needed + 1, medium if points >= needed, else low

import type { Fragility, Level, ProtectionLevel, ResolvedSetup } from "../types.ts";

/** What the box or mailer itself is worth. */
export const OUTER_POINTS: Record<Level, number> = { low: 0, medium: 1, high: 2 };

/** What each fill, wrap or insert adds. */
export const CUSHION_POINTS: Record<Level, number> = { low: 1, medium: 2, high: 3 };

export const POINTS_NEEDED: Record<Fragility, number> = { low: 1, medium: 3, high: 4 };

export const PROTECTION_RANK: Record<ProtectionLevel, number> = { low: 0, medium: 1, high: 2 };

export function protectionPoints(parts: ResolvedSetup): number {
  let pts = OUTER_POINTS[parts.outer.protection];
  for (const p of [parts.fill, parts.wrap, parts.insert]) if (p) pts += CUSHION_POINTS[p.protection];
  return pts;
}

export function rateProtection(parts: ResolvedSetup, fragility: Fragility): ProtectionLevel {
  const pts = protectionPoints(parts);
  const need = POINTS_NEEDED[fragility];
  if (pts >= need + 1) return "high";
  if (pts >= need) return "medium";
  return "low";
}

/** Lowest protection we will ever recommend for a product of this fragility. */
export function minimumProtection(fragility: Fragility): ProtectionLevel {
  return fragility === "low" ? "low" : "medium";
}

export function meetsMinimum(level: ProtectionLevel, fragility: Fragility): boolean {
  return PROTECTION_RANK[level] >= PROTECTION_RANK[minimumProtection(fragility)];
}
