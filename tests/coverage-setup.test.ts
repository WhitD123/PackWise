// Coverage for a whole setup, as the results page runs it (real data, Maya's defaults).

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { indexCatalog } from "../src/lib/catalog.ts";
import { coverageForSetup, gramsPerOrderByMaterial } from "../src/lib/coverage/forSetup.ts";
import { loadData } from "../src/lib/data.ts";
import { evaluateSetup } from "../src/lib/planner/evaluateSetup.ts";
import { currentSetup, defaultInput, toContext, toProducts } from "../src/lib/planner/plannerInput.ts";

const data = loadData();
const input = defaultInput(data);
const index = indexCatalog(data.catalog);
const ctx = toContext(input, data);
const products = toProducts(input);
const current = evaluateSetup(products, currentSetup(input)!, index, ctx, { strictClearance: false })!;
const fitted = evaluateSetup(products, { outer_id: "box-12oz-straight-jar-shipper", fill_id: null, wrap_id: null, insert_id: null }, index, ctx)!;
const byState = (rs: ReturnType<typeof coverageForSetup>) => Object.fromEntries(rs.map((r) => [r.state, r]));

describe("product packaging", () => {
  it("Maya's jar and lid come from demo-products.json: 204.1 g glass, 18.1 g steel", () => {
    assert.deepEqual(
      data.demoProductPackaging.map((p) => [p.material, p.weight_g]),
      [["glass", 204.1], ["steel", 18.1]],
    );
  });

  it("is added to the setup's packaging, and left out by the toggle", () => {
    const withJar = gramsPerOrderByMaterial(fitted, input, true);
    const without = gramsPerOrderByMaterial(fitted, input, false);
    assert.equal(withJar.glass, 204.1);
    assert.equal(without.glass, undefined);
    assert.ok(Math.abs(without.corrugated - 215.5) < 0.01);
  });
});

describe("Maya (sample orders, $8.2M)", () => {
  const before = byState(coverageForSetup(current, input, data, { includeCandleContainer: true }));
  const after = byState(coverageForSetup(fitted, input, data, { includeCandleContainer: true }));

  it("is covered in Oregon, and the swap lowers the Oregon fee", () => {
    assert.equal(before.OR.result, "covered");
    assert.ok(before.OR.fee_usd_per_year! > after.OR.fee_usd_per_year!);
  });

  it("California is covered but close to the line, with a proposed fee", () => {
    assert.equal(before.CA.result, "covered");
    assert.equal(before.CA.close_to_line, true);
    assert.equal(before.CA.fee_status, "proposed");
  });

  it("returns the 7 states with a law", () => {
    assert.equal(Object.keys(before).length, 7);
  });

  it("without the jar, the Oregon fee is the shipping packaging alone (answer key: $0.0095 per order)", () => {
    const r = byState(coverageForSetup(fitted, input, data, { includeCandleContainer: false }));
    const perOrder = r.OR.fee_usd_per_year! / ((input.orderStatePercent!.OR / 100) * input.ordersPerYear);
    assert.ok(Math.abs(perOrder - 0.0095) < 0.0005, String(perOrder));
  });
});

describe("a smaller seller ($2M)", () => {
  const r = byState(coverageForSetup(current, input, data, { includeCandleContainer: true, revenueOverrideUsd: 2_000_000 }));

  it("is exempt in Oregon on revenue", () => {
    assert.equal(r.OR.result, "exempt");
    assert.equal(r.OR.fee_usd_per_year, null);
  });

  it("must apply in California, since its California sales scale down too", () => {
    assert.equal(r.CA.result, "apply_for_exemption");
  });
});

describe("missing revenue", () => {
  it("asks for it instead of guessing", () => {
    const r = byState(coverageForSetup(current, { ...input, revenueUsd: undefined }, data, { includeCandleContainer: true }));
    assert.ok(r.OR.needs_input);
  });
});
