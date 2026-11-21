// USPS Ground Advantage pricing against data/rules/shipping.json and the known
// answers in tests/fixtures/demo-answer-key.json (12 oz candle, origin ZIP3 972).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { GRAMS_PER_LB } from "../src/lib/rightsizing/dimWeight.ts";
import { averagePrice, priceForZone, zoneShareFromStates } from "../src/lib/shipping/price.ts";
import type { ShippingRules } from "../src/lib/types.ts";

const readJson = (p: string) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const rules: ShippingRules = readJson("data/rules/shipping.json");
const key = readJson("tests/fixtures/demo-answer-key.json").demo_B_right_size_12oz_candle;

const close = (actual: number, expected: number, tol: number, label = "") =>
  assert.ok(Math.abs(actual - expected) <= tol, `${label} expected ${expected}, got ${actual}`);

// Answer key packages: outside sizes and shipped weights.
const OVERSIZED = { dims: { length: 12.25, width: 10.25, height: 8.25 }, weight_lb: 1.8207 };
const FITTED = { dims: { length: 7.44, width: 6, height: 3.81 }, weight_lb: 1.4961 };

describe("one package, one zone (answer key)", () => {
  it("oversized box, Zone 8: weight price $13.42 beats Cubic 0.6 tier $21.41", () => {
    const q = priceForZone(OVERSIZED, 8, rules)!;
    close(q.weight_price_usd, 13.42, 0.005);
    assert.equal(q.cubic_tier_cu_ft, 0.6);
    close(q.cubic_price_usd!, 21.41, 0.005);
    close(q.price_usd, 13.42, 0.005);
    assert.equal(q.method, "weight");
  });

  it("oversized box, Zone 5: $10.50, weight price wins", () => {
    const q = priceForZone(OVERSIZED, 5, rules)!;
    close(q.price_usd, 10.5, 0.005);
    assert.equal(q.method, "weight");
  });

  it("fitted jar box, Zone 8: Cubic 0.1 tier $10.68 beats weight price $13.42", () => {
    const q = priceForZone(FITTED, 8, rules)!;
    close(q.weight_price_usd, 13.42, 0.005);
    assert.equal(q.cubic_tier_cu_ft, 0.1);
    close(q.price_usd, 10.68, 0.005);
    assert.equal(q.method, "cubic");
  });

  it("fitted jar box, Zone 5: $9.04", () => {
    close(priceForZone(FITTED, 5, rules)!.price_usd, 9.04, 0.005);
  });

  it("Cubic volume rounds each side DOWN to 1/4 in: 163.125 cu in for the fitted box", () => {
    close(priceForZone(FITTED, 8, rules)!.cubic_volume_in3!, 163.125, 0.001);
    close(priceForZone(OVERSIZED, 8, rules)!.cubic_volume_in3!, 1035.8906, 0.001);
  });
});

describe("averaged over the sample's zones (answer key)", () => {
  const shares: Record<string, number> = {};
  for (const z of key.shipping_by_zone) shares[String(z.zone)] = z.share_of_orders;

  it("oversized box averages $12.17", () => {
    close(averagePrice(OVERSIZED, shares, rules)!.price_usd, 12.1709, 0.01);
  });

  it("fitted jar box averages $9.96", () => {
    const q = averagePrice(FITTED, shares, rules)!;
    close(q.price_usd, 9.9642, 0.01);
    assert.equal(q.method, "cubic");
  });

  it("each zone matches the answer key's per-zone prices", () => {
    for (const z of key.shipping_by_zone) {
      close(priceForZone(OVERSIZED, z.zone, rules)!.price_usd, z.current_price_usd, 0.01, `oversized zone ${z.zone}`);
      close(priceForZone(FITTED, z.zone, rules)!.price_usd, z.right_sized_price_usd, 0.01, `fitted zone ${z.zone}`);
    }
  });
});

describe("zones from the order mix", () => {
  it("groups state shares into zones using the 972 chart", () => {
    const zones = zoneShareFromStates({ OR: 0.5, TX: 0.25, CA: 0.25 }, rules)!;
    const sum = Object.values(zones).reduce((a, b) => a + b, 0);
    close(sum, 1, 1e-9);
    assert.equal(zones["1"], 0.5); // Portland, OR is zone 1
  });

  it("returns null when no state is in the chart", () => {
    assert.equal(zoneShareFromStates({ ZZ: 1 }, rules), null);
  });
});

describe("weight pricing rules", () => {
  it("under 1 lb uses the ounce tiers; exactly 1 lb is the 1 lb row; 1.01 lb prices as 2 lb", () => {
    const small = { dims: { length: 6, width: 4, height: 2 }, weight_lb: 0.9 };
    close(priceForZone(small, 5, rules)!.weight_price_usd, 8.24, 0.005);
    close(priceForZone({ ...small, weight_lb: 1 }, 5, rules)!.weight_price_usd, 9.29, 0.005);
    close(priceForZone({ ...small, weight_lb: 1.01 }, 5, rules)!.weight_price_usd, 10.5, 0.005);
  });

  it("dimensional weight applies only above 1,728 cu in and rounds up (divisor 139)", () => {
    // 14 x 14 x 10 = 1,960 cu in -> 14.1 -> 15 lb, though the box weighs 2 lb.
    const big = { dims: { length: 14, width: 14, height: 10 }, weight_lb: 2 };
    const q = priceForZone(big, 5, rules)!;
    assert.equal(q.billable_lb, 15);
    close(q.weight_price_usd, 22.9, 0.005);
    // 12 x 12 x 12 = 1,728 is not above the threshold: actual weight only.
    const edge = priceForZone({ dims: { length: 12, width: 12, height: 12 }, weight_lb: 2 }, 5, rules)!;
    assert.equal(edge.billable_lb, 2);
  });

  it("returns null above the last rate row (20 lb in our table)", () => {
    assert.equal(priceForZone({ dims: { length: 6, width: 6, height: 6 }, weight_lb: 25 }, 5, rules), null);
  });
});

describe("Cubic and surcharges", () => {
  it("soft packs use length + width: a 10 x 13 poly mailer (23 in) is the 0.2 tier", () => {
    const q = priceForZone({ dims: { length: 13, width: 10, height: 1 }, weight_lb: 0.3, softPack: { length_in: 13, width_in: 10 } }, 5, rules)!;
    assert.equal(q.cubic_tier_cu_ft, 0.2);
    close(q.cubic_price_usd!, 9.92, 0.005);
  });

  it("a longest side over 22 in is not Cubic-eligible and adds the $4.50 length surcharge", () => {
    const long = { dims: { length: 24, width: 6, height: 6 }, weight_lb: 3 };
    const q = priceForZone(long, 5, rules)!;
    assert.equal(q.cubic_price_usd, null);
    close(q.surcharge_usd, 4.5, 0.005);
    close(q.price_usd, 12.12 + 4.5, 0.005);
  });

  it("over 20 lb is not Cubic-eligible", () => {
    const q = priceForZone({ dims: { length: 6, width: 6, height: 6 }, weight_lb: 19 }, 5, rules)!;
    assert.ok(q.cubic_price_usd !== null); // 19 lb is allowed
    assert.equal(priceForZone({ dims: { length: 6, width: 6, height: 6 }, weight_lb: 20.5 }, 5, rules), null);
  });
});

describe("units", () => {
  it("shares one grams-per-pound constant with the rest of the engine", () => {
    close(1 * GRAMS_PER_LB, 453.59237, 1e-9);
  });
});
