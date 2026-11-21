// The numbers on the "How we calculate this" page: the worked example and the impact projection.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { loadData } from "../src/lib/data.ts";
import { PROJECTION_SELLERS, projectSwap } from "../src/lib/impact/projection.ts";
import { buildWorkedExample } from "../src/lib/method/workedExample.ts";

const data = loadData();
const key = JSON.parse(readFileSync(new URL("../tests/fixtures/demo-answer-key.json", import.meta.url), "utf8")).demo_B_right_size_12oz_candle.per_order;
const close = (actual: number, expected: number, tol: number, label = "") =>
  assert.ok(Math.abs(actual - expected) <= tol, `${label} expected ${expected}, got ${actual}`);
const ex = buildWorkedExample(data)!;

describe("worked example", () => {
  it("compares Maya's oversized box with the fitted jar box", () => {
    assert.ok(ex);
    assert.equal(ex.today.evaluated.setup.outer_id, "box-12x10x8-single");
    assert.equal(ex.swap.evaluated.setup.outer_id, "box-12oz-straight-jar-shipper");
    assert.equal(ex.ordersPerYear, 233_116);
  });

  it("each part's grams add up to the setup's packaging weight, landfill and carbon", () => {
    for (const s of [ex.today, ex.swap]) {
      const grams = s.parts.reduce((a, p) => a + p.grams, 0);
      const landfill = s.parts.reduce((a, p) => a + p.landfillGrams, 0);
      const co2e = s.parts.reduce((a, p) => a + p.co2eGrams, 0) / 1000;
      close(grams, s.evaluated.packagingWeight_g, 1e-9, `${s.label} grams`);
      close(landfill, s.evaluated.values.waste, 1e-9, `${s.label} landfill`);
      close(co2e, s.evaluated.values.carbon, 1e-9, `${s.label} carbon`);
    }
  });

  it("matches the answer key: 215.5 g and 146.5 g landfilled for the fitted box", () => {
    close(ex.swap.evaluated.packagingWeight_g, key["Packaging weight (g)"].right_sized, 0.5);
    close(ex.swap.evaluated.values.waste, key["Unrecycled packaging (g)"].right_sized, 0.5);
  });

  it("amounts read as units, cubic feet and square feet", () => {
    const amounts = ex.today.parts.map((p) => p.amount);
    assert.ok(amounts.includes("1"));
    assert.ok(amounts.some((a) => /cu ft$/.test(a)));
    assert.ok(amounts.some((a) => /sq ft$/.test(a)));
  });
});

describe("impact projection", () => {
  it("is one seller's plastic avoided times the number of sellers", () => {
    const p = ex.projection;
    assert.equal(p.sellers, PROJECTION_SELLERS);
    close(p.plasticAvoidedLb, p.plasticAvoidedLbPerSeller * PROJECTION_SELLERS, 1e-6);
    close(p.plasticAvoidedLbPerSeller, ex.swapYear.plasticAvoidedLb, 0.01, "same as the swap's own figure");
    close(p.plasticAvoidedUsTons, p.plasticAvoidedLb / 2000, 1e-9);
  });

  it("parcel share = sellers x orders / US parcels, from the data file", () => {
    assert.equal(data.usParcelVolume.value_billion, 23.1);
    close(ex.projection.parcelShare, (PROJECTION_SELLERS * 233_116) / 23.1e9, 1e-12);
  });

  it("non-plastic packaging goes down for the fitted box (it is lighter than box + peanuts + wrap)", () => {
    assert.ok(ex.projection.nonPlasticAddedLb < 0);
  });

  it("projectSwap with explicit inputs: 2 sellers", () => {
    const p = projectSwap(ex.today.evaluated, ex.swap.evaluated, 1000, 1e9, 2);
    close(p.parcelShare, 2000 / 1e9, 1e-15);
    close(p.plasticAvoidedLb, (2 * 1000 * ex.today.evaluated.plasticWeight_g) / 453.59237, 1e-6);
  });
});
