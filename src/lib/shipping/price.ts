// USPS Ground Advantage (commercial) price for one package, from
// data/rules/shipping.json. Follows CLAUDE.md section 7 "Shipping price":
//
//   1. Dimensional weight: only above 1,728 cu in. Each side rounded UP to a whole
//      inch, volume / 139 rounded UP to a whole pound; billable = the larger weight.
//   2. Weight price: the first row of weight_rates_by_zone whose max_lb >= billable.
//   3. Cubic price (when eligible): each side rounded DOWN to 1/4 in, volume / 1,728 cu ft,
//      lowest 0.1 cu ft tier that fits. Soft packs (mailers) use length + width instead.
//   4. Paid = the lower of the weight price and the Cubic price.
//   5. Surcharges for a long side or a large volume.
//   6. Average over the seller's destination zones, weighted by share of orders.

import type { Dimensions, ShippingRules } from "../types.ts";

const EPS = 1e-6;
const CUBIC_FT_IN3 = 1728;

export interface ShippablePackage {
  /** Outside size, inches. */
  dims: Dimensions;
  /** Everything in the package: product plus packaging, pounds. */
  weight_lb: number;
  /** Soft packs and padded envelopes are priced by length + width (DMM 283.1.3.4). */
  softPack?: { length_in: number; width_in: number };
}

export interface ZoneQuote {
  zone: number;
  price_usd: number;
  method: "weight" | "cubic";
  weight_price_usd: number;
  /** null when the package is not Cubic-eligible. */
  cubic_price_usd: number | null;
  cubic_tier_cu_ft: number | null;
  /** Volume with each side rounded down to 1/4 in (boxes only). */
  cubic_volume_in3: number | null;
  billable_lb: number;
  surcharge_usd: number;
}

export interface AverageQuote {
  price_usd: number;
  /** "mixed" when the cheaper method differs between zones. */
  method: "weight" | "cubic" | "mixed";
  billable_lb: number;
  zones: ZoneQuote[];
}

const roundDownQuarter = (n: number) => Math.floor(n * 4 + EPS) / 4;

function weightPrice(billable_lb: number, zone: number, rules: ShippingRules): number | null {
  const row = rules.weight_rates_by_zone?.find((r) => billable_lb <= r.max_lb + EPS);
  return row?.prices_by_zone[String(zone)] ?? null;
}

function cubicTier(pkg: ShippablePackage, rules: ShippingRules): number | null {
  const cubic = rules.cubic;
  if (!cubic || pkg.weight_lb > cubic.max_weight_lb + EPS) return null;

  if (pkg.softPack) {
    const sum = roundDownQuarter(pkg.softPack.length_in) + roundDownQuarter(pkg.softPack.width_in);
    if (sum > 36 + EPS) return null;
    // Exhibit 1.3.4: up to 21 in = 0.1, to 27 = 0.2, to 31 = 0.3, to 34 = 0.4, to 36 = 0.5.
    const tier = sum <= 21 + EPS ? 0.1 : sum <= 27 + EPS ? 0.2 : sum <= 31 + EPS ? 0.3 : sum <= 34 + EPS ? 0.4 : 0.5;
    return tier;
  }

  const l = roundDownQuarter(pkg.dims.length);
  const w = roundDownQuarter(pkg.dims.width);
  const h = roundDownQuarter(pkg.dims.height);
  if (Math.max(l, w, h) > cubic.max_longest_dimension_in + EPS) return null;
  const cuFt = (l * w * h) / CUBIC_FT_IN3;
  if (cuFt > cubic.max_cubic_ft + EPS) return null;
  return Math.max(0.1, Math.round(Math.ceil(cuFt / 0.1 - EPS)) / 10);
}

function surcharge(dims: Dimensions, rules: ShippingRules): number {
  const s = rules.surcharges_usd;
  if (!s) return 0;
  const longest = Math.max(dims.length, dims.width, dims.height);
  let total = 0;
  if (longest > 30) total += s.length_over_30_in;
  else if (longest > 22) total += s.length_over_22_in_up_to_30_in;
  if ((dims.length * dims.width * dims.height) / CUBIC_FT_IN3 > 2) total += s.volume_over_2_cubic_ft;
  return total;
}

/** Price for one zone. null if the package is heavier than our rate table or the zone has no price. */
export function priceForZone(pkg: ShippablePackage, zone: number, rules: ShippingRules): ZoneQuote | null {
  const z = zone === 9 ? 8 : zone; // Zone 9 (Guam and nearby) has the Zone 8 price
  const { length, width, height } = pkg.dims;

  // Dimensional weight (box size, rounded up), only above 1,728 cu in.
  const volumeUp = Math.ceil(length - EPS) * Math.ceil(width - EPS) * Math.ceil(height - EPS);
  const threshold = rules.dim_applies_above_cubic_in;
  const dimLb = threshold === null || volumeUp > threshold ? Math.ceil(volumeUp / rules.dim_divisor - EPS) : 0;
  const billable_lb = Math.max(pkg.weight_lb, dimLb);

  const weight_price_usd = weightPrice(billable_lb, z, rules);
  if (weight_price_usd === null) return null;

  const tier = cubicTier(pkg, rules);
  const tierRow = tier === null ? undefined : rules.cubic?.tiers.find((t) => Math.abs(t.tier_cu_ft - tier) < 1e-9);
  const cubic_price_usd = tierRow?.prices_by_zone[String(z)] ?? null;

  const useCubic = cubic_price_usd !== null && cubic_price_usd < weight_price_usd;
  const base = useCubic ? cubic_price_usd : weight_price_usd;
  const extra = surcharge(pkg.dims, rules);

  return {
    zone: z,
    price_usd: base + extra,
    method: useCubic ? "cubic" : "weight",
    weight_price_usd,
    cubic_price_usd,
    cubic_tier_cu_ft: cubic_price_usd === null ? null : tier,
    cubic_volume_in3:
      pkg.softPack || tier === null
        ? null
        : roundDownQuarter(length) * roundDownQuarter(width) * roundDownQuarter(height),
    billable_lb,
    surcharge_usd: extra,
  };
}

/** Average price over destination zones. `zoneShare` maps zone ("1".."9") to share of orders (sums to 1). */
export function averagePrice(
  pkg: ShippablePackage,
  zoneShare: Record<string, number>,
  rules: ShippingRules,
): AverageQuote | null {
  const zones: ZoneQuote[] = [];
  let price = 0;
  let cubicShare = 0;
  let total = 0;
  for (const [zone, share] of Object.entries(zoneShare)) {
    if (!(share > 0)) continue;
    const q = priceForZone(pkg, Number(zone), rules);
    if (!q) return null;
    zones.push(q);
    price += share * q.price_usd;
    total += share;
    if (q.method === "cubic") cubicShare += share;
  }
  if (zones.length === 0 || total <= 0) return null;
  return {
    price_usd: price / total,
    method: cubicShare < EPS ? "weight" : Math.abs(cubicShare - total) < EPS ? "cubic" : "mixed",
    billable_lb: Math.max(...zones.map((z) => z.billable_lb)),
    zones,
  };
}

/**
 * Share of orders by USPS zone, from share of orders by state, using the zone chart for
 * the ship-from ZIP in shipping.json (zones_from_origin). States missing from the chart are
 * left out and the rest rescaled; null if none are found.
 */
export function zoneShareFromStates(
  stateShare: Record<string, number>,
  rules: ShippingRules,
): Record<string, number> | null {
  const states = rules.zones_from_origin?.states;
  if (!states) return null;
  const zones: Record<string, number> = {};
  let total = 0;
  for (const [state, share] of Object.entries(stateShare)) {
    const zone = states[state.toUpperCase()]?.zone;
    if (!(share > 0) || zone === undefined) continue;
    const z = String(zone === 9 ? 8 : zone);
    zones[z] = (zones[z] ?? 0) + share;
    total += share;
  }
  if (total <= 0) return null;
  for (const z of Object.keys(zones)) zones[z] /= total;
  return zones;
}
