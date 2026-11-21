// The one place that decides a USPS zone. Every shipping price goes through here, so no other
// module has its own zone logic.
//
//   exact      origin is the ZIP3 in shipping.json (972, Portland): the real USPS chart.
//   estimated  any other origin: distance between ZIP3 centers, see estimateZone.ts.
//   assumed    no usable origin ZIP, or no destination: Zone 5. This is NOT a typical zone;
//              from Portland, 56% of the sample orders are Zone 8 and about 20% are Zone 5.
//
// Zone 9 (Guam and nearby) is priced as Zone 8: the price table gives them the same price.

import type { ShippingRules } from "../types.ts";
import { estimateZone } from "./estimateZone.ts";

export type ZoneLabel = "exact" | "estimated" | "assumed";

/** Zone used when we cannot work one out. */
export const ASSUMED_ZONE = 5;

/** Short text shown next to a shipping price. */
export const ZONE_LABEL_TEXT: Record<ZoneLabel, string> = {
  exact: "Exact USPS zone",
  estimated: "Estimated zone, typically within one zone of USPS's chart",
  assumed: "Zone assumed (add your ship-from ZIP for a better estimate)",
};

/** Very short form, for a line of detail beside a price. */
export const ZONE_SHORT: Record<ZoneLabel, string> = {
  exact: "exact zones",
  estimated: "estimated zones",
  assumed: "Zone 5 assumed",
};

export interface ZoneResult {
  zone: number;
  label: ZoneLabel;
  originZip3?: string;
  destZip3?: string;
  /** Straight-line distance between the two ZIP3 centers, for estimated zones. */
  miles?: number;
}

/** The first three digits of a ZIP code, or null if there are fewer than three digits. */
export function zip3Of(zip: string | undefined | null): string | null {
  const m = /^\s*(\d{3})/.exec(zip ?? "");
  return m ? m[1] : null;
}

/** A ZIP the form accepts: exactly five digits. */
export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip.trim());
}

const assumed = (): ZoneResult => ({ zone: ASSUMED_ZONE, label: "assumed" });

/** Zone from the exact chart in shipping.json, by destination ZIP3 or, failing that, destination state. */
function exactZone(destZip3: string | null, state: string | undefined, rules: ShippingRules): number | undefined {
  const chart = rules.zones_from_origin;
  if (!chart) return undefined;
  if (destZip3) {
    const row = chart.zip3_ranges?.find((r) => r.from_zip3.length === 3 && r.from_zip3 <= destZip3 && destZip3 <= r.to_zip3);
    if (row) return row.zone;
  }
  return state ? chart.states[state]?.zone : undefined;
}

/**
 * Zone from `originZip` to a destination known by ZIP and/or state (the Shopify file only has the state).
 * A state stands in for its anchor ZIP3 (the largest metro), as recorded in shipping.json.
 */
export function getZone(
  originZip: string | undefined | null,
  dest: { zip?: string; state?: string },
  rules: ShippingRules,
): ZoneResult {
  const o = zip3Of(originZip);
  if (!o) return assumed();
  const state = dest.state?.toUpperCase();
  const chart = rules.zones_from_origin;
  const destZip3 = zip3Of(dest.zip) ?? (state ? (chart?.states[state]?.dest_zip3 ?? null) : null);

  if (chart && o === chart.origin_zip3) {
    const zone = exactZone(zip3Of(dest.zip), state, rules);
    if (zone === undefined) return assumed();
    return { zone: zone === 9 ? 8 : zone, label: "exact", originZip3: o, destZip3: destZip3 ?? undefined };
  }

  if (!destZip3) return assumed();
  const est = estimateZone(o, destZip3);
  if (!est) return assumed();
  return { zone: est.zone, label: "estimated", originZip3: o, destZip3, miles: est.miles };
}

export interface ZoneMix {
  /** Share of orders by zone ("1".."8"), summing to 1. */
  share: Record<string, number>;
  /** "exact" only if every counted state used the real chart; otherwise "estimated". */
  label: Exclude<ZoneLabel, "assumed">;
}

/**
 * Share of orders by zone, from share of orders by destination state. States we cannot place are left out
 * and the rest rescaled. Null when the origin ZIP is unusable or no state could be placed: the caller then
 * prices every order as Zone 5 and labels it "assumed".
 */
export function zoneMixFromStates(
  stateShare: Record<string, number>,
  originZip: string | undefined | null,
  rules: ShippingRules,
): ZoneMix | null {
  if (!zip3Of(originZip)) return null;
  const share: Record<string, number> = {};
  let total = 0;
  let allExact = true;
  for (const [state, s] of Object.entries(stateShare)) {
    if (!(s > 0)) continue;
    const r = getZone(originZip, { state }, rules);
    if (r.label === "assumed") continue;
    if (r.label !== "exact") allExact = false;
    share[String(r.zone)] = (share[String(r.zone)] ?? 0) + s;
    total += s;
  }
  if (total <= 0) return null;
  for (const z of Object.keys(share)) share[z] /= total;
  return { share, label: allExact ? "exact" : "estimated" };
}
