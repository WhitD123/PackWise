// Coverage check against the real data files and the known answers in
// tests/fixtures/demo-answer-key.json. If code and the answer key disagree,
// find out which is wrong before changing either.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { checkCoverage, checkState } from "../src/lib/coverage/checkCoverage.ts";
import { estimateFees } from "../src/lib/coverage/estimateFees.ts";
import type { CoverageInput, FeeSchedule, StateCoverageRule } from "../src/lib/coverage/types.ts";

const readJson = (p: string) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));

const rules: StateCoverageRule[] = readJson("data/rules/state-coverage.json");
const rule = (state: string) => rules.find((r) => r.state === state)!;
const schedules: Record<string, FeeSchedule> = {
  "oregon-2027.json": readJson("data/fees/oregon-2027.json"),
  "colorado-2027.json": readJson("data/fees/colorado-2027.json"),
  "california.json": readJson("data/fees/california.json"),
};

// Answer key basis, 12 oz candle: 9,152 Oregon orders a year (from the old 109,200-order file).
// The fee math is per order, so these checks still hold; the sample file now has 19,188 Oregon orders.
const OR_ORDERS = 9152;
const currentSetup = { corrugated: 303.9, "eps-foam": 50.3013, "pe-film": 8.55 }; // box, fill, wrap (g)
const fittedBox = { corrugated: 215.5 };

const maya = { worldwideRevenueUsd: 8_200_000, californiaSalesUsd: 1_149_616 };

function input(over: Partial<CoverageInput> = {}): CoverageInput {
  return {
    seller: maya,
    ordersPerYearByState: { OR: OR_ORDERS, CO: 5000, CA: 16_000, ME: 5000, MD: 5000, MN: 5000, WA: 5000 },
    packagingGramsPerOrderByMaterial: currentSetup,
    ...over,
  };
}

describe("fee estimate matches the answer key", () => {
  it("12 oz candle, oversized box: $0.0811 per order, about $742 a year in Oregon", () => {
    const fee = estimateFees(schedules["oregon-2027.json"], OR_ORDERS, currentSetup);
    assert.ok(Math.abs(fee.fee_usd_per_year / OR_ORDERS - 0.0811) < 0.0005);
    assert.ok(Math.abs(fee.fee_usd_per_year - 742.14) < 0.5, String(fee.fee_usd_per_year));
  });

  it("fitted jar box: $0.0095 per order, about $87 a year", () => {
    const fee = estimateFees(schedules["oregon-2027.json"], OR_ORDERS, fittedBox);
    assert.ok(Math.abs(fee.fee_usd_per_year / OR_ORDERS - 0.0095) < 0.0005);
    assert.ok(Math.abs(fee.fee_usd_per_year - 86.96) < 0.5, String(fee.fee_usd_per_year));
  });

  it("mailer swap: poly bubble mailer $55.69, padded paper mailer $12.25", () => {
    const orders = 0.0838 * 109_200;
    const poly = estimateFees(schedules["oregon-2027.json"], orders, { "pe-film": 23.0 });
    const paper = estimateFees(schedules["oregon-2027.json"], orders, { "kraft-paper": 30.35 });
    assert.ok(Math.abs(poly.fee_usd_per_year - 55.6878) < 0.1, String(poly.fee_usd_per_year));
    assert.ok(Math.abs(paper.fee_usd_per_year - 12.2473) < 0.1, String(paper.fee_usd_per_year));
  });
});

describe("fee rules", () => {
  it("allows negative rates (Oregon aluminum is a credit)", () => {
    const fee = estimateFees(schedules["oregon-2027.json"], 1000, { aluminum: 100 });
    assert.ok(fee.fee_usd_per_year < 0);
  });

  it("a material with no rate is reported missing, never counted as zero", () => {
    const partial: FeeSchedule = { ...schedules["oregon-2027.json"], rates: { corrugated: schedules["oregon-2027.json"].rates.corrugated } };
    const fee = estimateFees(partial, 1000, { corrugated: 100, "pe-film": 100 });
    assert.deepEqual(fee.missing_materials, ["pe-film"]);
    assert.equal(fee.by_material["pe-film"], undefined);
    assert.ok(fee.warnings.length > 0);
  });

  it("California plastics add the plastic component fees: pe-film 0.24 + 0.03 + 0.26 = $0.53 per lb", () => {
    const fee = estimateFees(schedules["california.json"], 1, { "pe-film": 453.592 });
    assert.ok(Math.abs(fee.fee_usd_per_year - 0.53) < 0.005, String(fee.fee_usd_per_year));
  });
});

describe("Oregon", () => {
  it("Maya ($8.2M, over 1 metric ton into Oregon) is covered, with a final fee", () => {
    const r = checkState(rule("OR"), input(), schedules);
    assert.equal(r.result, "covered");
    assert.equal(r.fee_status, "final");
    assert.ok(r.weight_lb_per_year > 2204.6);
    assert.ok(Math.abs(r.fee_usd_per_year! - 742.14) < 0.5);
    assert.match(r.reason, /over the \$5M limit/);
  });

  it("a $2M seller is exempt on revenue, with no fee", () => {
    const r = checkState(rule("OR"), input({ seller: { ...maya, worldwideRevenueUsd: 2_000_000 } }), schedules);
    assert.equal(r.result, "exempt");
    assert.equal(r.fee_usd_per_year, null);
    assert.equal(r.fee_status, "none");
    assert.match(r.reason, /under the \$5M limit/);
  });

  it("an $8M seller with under 1 metric ton into Oregon is exempt on weight", () => {
    const r = checkState(rule("OR"), input({ ordersPerYearByState: { OR: 1000 } }), schedules);
    assert.equal(r.result, "exempt");
    assert.match(r.reason, /under the 2,205 lb limit/);
  });
});

describe("California", () => {
  it("Maya's sales (about $1.15M) are close to the line: covered, hedged, proposed fee", () => {
    const r = checkState(rule("CA"), input(), schedules);
    assert.equal(r.result, "covered");
    assert.equal(r.close_to_line, true);
    assert.match(r.reason, /Close to the line/);
    assert.equal(r.fee_status, "proposed");
  });

  it("clearly under $1M must apply for the exemption", () => {
    const r = checkState(rule("CA"), input({ seller: { ...maya, californiaSalesUsd: 500_000 } }), schedules);
    assert.equal(r.result, "apply_for_exemption");
    assert.equal(r.close_to_line, false);
    assert.equal(r.fee_usd_per_year, null);
  });

  it("clearly over $1M is covered, not close", () => {
    const r = checkState(rule("CA"), input({ seller: { ...maya, californiaSalesUsd: 2_000_000 } }), schedules);
    assert.equal(r.result, "covered");
    assert.equal(r.close_to_line, false);
  });

  it("exactly $1M is not under the limit", () => {
    const r = checkState(rule("CA"), input({ seller: { ...maya, californiaSalesUsd: 1_000_000 } }), schedules);
    assert.equal(r.result, "covered");
  });

  it("unknown California sales asks for input instead of guessing", () => {
    const r = checkState(rule("CA"), input({ seller: { ...maya, californiaSalesUsd: null } }), schedules);
    assert.ok(r.needs_input);
    assert.equal(r.result, "covered");
  });
});

describe("Colorado", () => {
  it("Maya is covered, with a fee in the schedule's status", () => {
    const r = checkState(rule("CO"), input(), schedules);
    assert.equal(r.result, "covered");
    assert.equal(r.fee_status, schedules["colorado-2027.json"].status);
    assert.ok(r.fee_usd_per_year !== null && r.fee_usd_per_year > 0);
  });

  it("under 1 ton into Colorado is exempt even at $8.2M", () => {
    const r = checkState(rule("CO"), input({ ordersPerYearByState: { CO: 1000 } }), schedules);
    assert.equal(r.result, "exempt");
  });
});

describe("states with a law but no published fees", () => {
  for (const st of ["ME", "MD", "MN", "WA"]) {
    it(`${st}: covered at $8.2M, no fee, "No fees yet"`, () => {
      const r = checkState(rule(st), input(), schedules);
      assert.equal(r.result, "covered");
      assert.equal(r.fee_usd_per_year, null);
      assert.equal(r.fee_status, "none");
      assert.match(r.reason, /No fees yet/);
    });
  }
});

describe("checkCoverage", () => {
  it("returns one result for each of the 7 states with a law, and none for the 44 without", () => {
    const results = checkCoverage(rules, input(), schedules);
    assert.deepEqual(results.map((r) => r.state).sort(), ["CA", "CO", "MD", "ME", "MN", "OR", "WA"]);
  });

  it("a no-law state returns no_law", () => {
    const r = checkState(rule("TX"), input(), schedules);
    assert.equal(r.result, "no_law");
  });
});
