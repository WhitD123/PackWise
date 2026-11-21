// Scoring rules from docs/scoring-spec.md, checked on the real data files and the
// known answers in tests/fixtures/demo-answer-key.json.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { fittedInsertFits, indexCatalog } from "../src/lib/catalog.ts";
import { loadData } from "../src/lib/data.ts";
import { evaluateSetup, lifecycleFactor } from "../src/lib/planner/evaluateSetup.ts";
import { planPackaging } from "../src/lib/planner/planPackaging.ts";
import { currentSetup, defaultInput, toContext, toProducts } from "../src/lib/planner/plannerInput.ts";
import { minimumProtection } from "../src/lib/scoring/protection.ts";
import { FACTORS, WEIGHT_PRESETS } from "../src/lib/scoring/weights.ts";
import { rankSwaps } from "../src/lib/swaps/rankSwaps.ts";
import type { Dimensions } from "../src/lib/types.ts";
import { parseShopifyCsv } from "../src/lib/orders/parseShopifyCsv.ts";
import { CATALOG, CANDLE, CONTEXT, POLY_MAILER } from "./fixtures/library.ts";

const readJson = (p: string) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));

const data = loadData();
const index = indexCatalog(data.catalog);
const input = defaultInput(data);
const products = toProducts(input);
const ctx = toContext(input, data);

const FITTED = { outer_id: "box-12oz-straight-jar-shipper", fill_id: null, wrap_id: null, insert_id: null };
const close = (actual: number, expected: number, tol: number, label = "") =>
  assert.ok(Math.abs(actual - expected) <= tol, `${label} expected ${expected}, got ${actual}`);

describe("carbon includes end of life (answer key lifecycle factors)", () => {
  it("pe-film 2.5844 and kraft-paper 2.2932 kg CO2e per kg", () => {
    const pe = index.material("pe-film")!;
    const kraft = index.material("kraft-paper")!;
    close(lifecycleFactor(pe, pe.recycle_rate), 2.5844, 0.0005, "pe-film");
    close(lifecycleFactor(kraft, kraft.recycle_rate), 2.2932, 0.0005, "kraft-paper");
  });

  it("fitted jar box: 0.37 kg CO2e per order (answer key)", () => {
    const ev = evaluateSetup(products, FITTED, index, ctx)!;
    assert.ok(ev);
    close(ev.values.carbon, 0.3718, 0.005, "carbon");
  });
});

describe("fitted jar box (answer key: 215.5 g packaging, no plastic)", () => {
  const ev = evaluateSetup(products, FITTED, index, ctx);

  it("is accepted for Maya's 12 oz jar and rated high", () => {
    assert.ok(ev);
    assert.equal(ev.values.protection, "high");
  });

  it("weighs 215.5 g, has no plastic, and sends 146.5 g to landfill", () => {
    close(ev!.packagingWeight_g, 215.5, 0.5, "packaging g");
    assert.equal(ev!.plasticWeight_g, 0);
    close(ev!.values.waste, 146.5, 0.5, "landfill g");
  });

  it("is not used for a jar it was not made for (8 oz jelly box vs the 12 oz candle)", () => {
    const eightOz = index.component("box-8oz-jelly-jar-shipper")!;
    assert.equal(fittedInsertFits(eightOz, products.map((p) => ({ length: p.length_in, width: p.width_in, height: p.height_in }))), false);
    const ev8 = evaluateSetup(products, { ...FITTED, outer_id: eightOz.id }, index, ctx);
    // The box is big enough to hold the candle loosely, but not with the clearance glass needs.
    assert.equal(ev8, null);
  });

  it("holds no more items than it has cells", () => {
    const box = index.component("box-12oz-straight-jar-shipper")!;
    const jar: Dimensions = { length: 3.25, width: 3.25, height: 3.25 };
    assert.equal(fittedInsertFits(box, [jar]), true);
    assert.equal(fittedInsertFits(box, [jar, jar]), false);
  });
});

describe("fees follow the coverage check", () => {
  it("Maya ($8.2M, over a ton into Oregon) pays an Oregon fee", () => {
    const ev = evaluateSetup(products, FITTED, index, ctx)!;
    assert.ok(ev.values.fees > 0);
  });

  it("the same seller at $2M is exempt, so fees are $0", () => {
    const small = toContext({ ...input, revenueUsd: 2_000_000 }, data);
    const ev = evaluateSetup(products, FITTED, index, small)!;
    assert.equal(ev.values.fees, 0);
  });

  it("without seller information every state with a schedule counts as covered", () => {
    const noSeller = toContext({ ...input, revenueUsd: undefined }, data);
    const ev = evaluateSetup(products, FITTED, index, noSeller)!;
    assert.ok(ev.values.fees > 0);
  });
});

describe("weights and minimums", () => {
  it("each preset's weights sum to 1 and protection is not weighted", () => {
    for (const w of Object.values(WEIGHT_PRESETS)) {
      const total = FACTORS.reduce((s, f) => s + w[f], 0);
      close(total, 1, 1e-9);
      assert.equal(w.protection, 0);
    }
  });

  it("the Default preset is Waste 35, Cost 35, Carbon 15, Fees 15", () => {
    assert.deepEqual(WEIGHT_PRESETS.balanced, { waste: 0.35, cost: 0.35, carbon: 0.15, fees: 0.15, protection: 0 });
  });

  it("glass needs high protection, medium needs medium, low has no minimum", () => {
    assert.equal(minimumProtection("high"), "high");
    assert.equal(minimumProtection("medium"), "medium");
    assert.equal(minimumProtection("low"), "low");
  });
});

describe("planner and swaps on Maya's candle (real data)", () => {
  it("never picks a setup below the minimum", () => {
    const plan = planPackaging(products, data.catalog, ctx);
    assert.ok(plan.picks);
    for (const o of plan.options) assert.equal(o.values.protection, "high");
  });

  it("returns no picks, not unsafe ones, when only an unsafe setup fits", () => {
    const onlyPoly = { components: [POLY_MAILER], materials: CATALOG.materials };
    const plan = planPackaging([CANDLE], onlyPoly, CONTEXT);
    assert.equal(plan.noSafeOption, true);
    assert.equal(plan.picks, null);
    assert.equal(plan.options.length, 0);
  });

  it("the top swap from the oversized box is the fitted jar box, removing all plastic", () => {
    const result = rankSwaps(products, currentSetup(input)!, data.catalog, ctx)!;
    assert.ok(result);
    const top = result.swaps[0];
    assert.equal(top.to.outer_id, "box-12oz-straight-jar-shipper");
    assert.ok(top.plastic_avoided_lb_per_year > 0);
    assert.ok(top.landfill_avoided_lb_per_year > 0);
  });
});

describe("the default demo uses the sample order file", () => {
  it("takes volume, revenue and the full state mix from the CSV, not typed numbers", () => {
    assert.equal(input.ordersPerYear, 233_116);
    assert.ok(input.orderStatePercent && Object.keys(input.orderStatePercent).length === 51);
    assert.ok(Math.abs(input.revenueUsd! - 8_162_960) < 1);
    assert.ok(Math.abs(input.statePercent.OR - (369 / 4483) * 100) < 1e-9);
  });

  it("so shipping zones are exact by default", () => {
    const ev = evaluateSetup(products, FITTED, index, ctx)!;
    assert.equal(ev.zoneLabel, "exact");
    assert.equal(ev.shippingMethod, "cubic");
  });
});

describe("shipping in the engine (answer key: $12.17 oversized, $9.96 fitted, averaged over zones)", () => {
  const csv = readFileSync(new URL("../data/samples/shopify-orders.csv", import.meta.url), "utf8");
  const mix = parseShopifyCsv(csv).stateShare;
  const withZones = toContext(
    { ...input, orderStatePercent: Object.fromEntries(Object.entries(mix).map(([s, v]) => [s, v * 100])) },
    data,
  );
  const OVERSIZED = { outer_id: "box-12x10x8-single", fill_id: "foam-peanuts-fill", wrap_id: "bubble-wrap-3-16", insert_id: null };

  // The answer key's zone shares come from the original 2,100-order file; the sample file was
  // later split into one-candle orders, which moved the mix slightly (Oregon 8.38% -> 8.23%).
  const keyZones: Record<string, number> = {};
  for (const z of readJson("tests/fixtures/demo-answer-key.json").demo_B_right_size_12oz_candle.shipping_by_zone) {
    keyZones[String(z.zone)] = z.share_of_orders;
  }
  const withKeyZones = { ...ctx, zoneShare: keyZones };

  it("oversized box averages $12.17 across the answer key's zone mix", () => {
    const ev = evaluateSetup(products, OVERSIZED, index, withKeyZones, { strictClearance: false })!;
    close(ev.shippingCost_usd, 12.1709, 0.01, "oversized shipping");
    assert.equal(ev.zoneLabel, "exact");
    assert.equal(ev.shippingMethod, "weight");
  });

  it("fitted jar box averages $9.96 across the answer key's zone mix, priced by Cubic", () => {
    const ev = evaluateSetup(products, FITTED, index, withKeyZones)!;
    close(ev.shippingCost_usd, 9.9642, 0.01, "fitted shipping");
    assert.equal(ev.shippingMethod, "cubic");
  });

  it("the current order file's zone mix gives nearly the same prices (within 5 cents)", () => {
    const a = evaluateSetup(products, OVERSIZED, index, withZones, { strictClearance: false })!;
    const b = evaluateSetup(products, FITTED, index, withZones)!;
    close(a.shippingCost_usd, 12.1709, 0.05, "oversized");
    close(b.shippingCost_usd, 9.9642, 0.05, "fitted");
  });

  it("the swap now saves money: shipping falls more than the box costs", () => {
    const result = rankSwaps(products, currentSetup(input)!, data.catalog, withZones)!;
    const top = result.swaps[0];
    assert.equal(top.to.outer_id, "box-12oz-straight-jar-shipper");
    assert.ok(top.usd_saved_per_year > 0);
  });

  it("with no order mix, shipping assumes Zone 5 and says so", () => {
    const noMix = toContext({ ...input, orderStatePercent: undefined }, data);
    const ev = evaluateSetup(products, FITTED, index, noMix)!;
    assert.equal(ev.zoneLabel, "assumed");
    close(ev.shippingCost_usd, 9.04, 0.01, "zone 5 fitted");
  });
});
