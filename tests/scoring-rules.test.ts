// Scoring rules from docs/scoring-spec.md, checked on the real data files and the
// known answers in tests/fixtures/demo-answer-key.json.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { fittedInsertFits, indexCatalog } from "../src/lib/catalog.ts";
import { coverageForSetup } from "../src/lib/coverage/forSetup.ts";
import { loadData } from "../src/lib/data.ts";
import { evaluateSetup, lifecycleFactor } from "../src/lib/planner/evaluateSetup.ts";
import { planPackaging } from "../src/lib/planner/planPackaging.ts";
import {
  currentSetup,
  defaultInput,
  productPackagingGramsPerOrder,
  productPackagingOf,
  toContext,
  toProducts,
} from "../src/lib/planner/plannerInput.ts";
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

describe("oversized box (answer key: 362.8 g packaging, 58.9 g plastic, 0.69 kg CO2e)", () => {
  const OVERSIZED = { outer_id: "box-12x10x8-single", fill_id: "foam-peanuts-fill", wrap_id: "bubble-wrap-3-16", insert_id: null };
  const key = readJson("tests/fixtures/demo-answer-key.json").demo_B_right_size_12oz_candle.per_order;
  const ev = evaluateSetup(products, OVERSIZED, index, ctx, { strictClearance: false })!;

  it("fills 0.5357 cu ft of empty space: box inside volume minus the jar's bounding box", () => {
    const fill = ev.usage.find((u) => u.component.type === "filler")!;
    close(fill.units, key["Fill volume (cu ft)"].current, 0.0005, "fill cu ft");
    close(fill.weight_g, key["Fill weight (g)"].current, 0.1, "fill g");
  });

  it("uses about 0.88 sq ft of wrap (two layers); the key rounds this to 1.0 sq ft, 1 g heavier", () => {
    const wrap = ev.usage.find((u) => u.component.type === "wrap")!;
    close(wrap.units, 0.88, 0.005, "wrap sq ft");
    close(wrap.weight_g, key["Wrap weight (g)"].current, 1.1, "wrap g");
  });

  it("totals match the key within the 1 g wrap rounding", () => {
    close(ev.packagingWeight_g, key["Packaging weight (g)"].current, 1.5, "packaging g");
    close(ev.plasticWeight_g, key["Plastic weight (g)"].current, 1.5, "plastic g");
    close(ev.values.waste, key["Unrecycled packaging (g)"].current, 1.5, "landfill g");
    close(ev.values.carbon, key["CO2e, production + end of life (kg)"].current, 0.005, "carbon");
  });
});

describe("fees follow the coverage check", () => {
  it("Maya ($8.2M, over a ton into Oregon) pays an Oregon fee", () => {
    const ev = evaluateSetup(products, FITTED, index, ctx)!;
    assert.ok(ev.values.fees > 0);
  });

  it("the same seller at $2M is exempt, so fees are $0 (California sales shrink with revenue, as on the coverage card)", () => {
    const scale = 2_000_000 / input.revenueUsd!;
    const small = toContext({ ...input, revenueUsd: 2_000_000, californiaSalesUsd: input.californiaSalesUsd! * scale }, data);
    const ev = evaluateSetup(products, FITTED, index, small)!;
    assert.equal(ev.values.fees, 0);
  });

  it("California counts in the Fees score: Maya's $1.15M of California sales is over the $1M line", () => {
    const withCa = evaluateSetup(products, FITTED, index, ctx)!;
    const noCaCtx = { ...ctx, feeSchedules: ctx.feeSchedules.filter((f) => f.state !== "CA") };
    const noCa = evaluateSetup(products, FITTED, index, noCaCtx)!;
    assert.ok(data.feeSchedules.some((f) => f.state === "CA"));
    assert.ok(withCa.values.fees > noCa.values.fees);
  });

  it("California adds nothing under the $1M line (the seller applies for the exemption)", () => {
    const under = toContext({ ...input, californiaSalesUsd: 500_000 }, data);
    const underNoCa = { ...under, feeSchedules: under.feeSchedules.filter((f) => f.state !== "CA") };
    const a = evaluateSetup(products, FITTED, index, under)!;
    const b = evaluateSetup(products, FITTED, index, underNoCa)!;
    assert.equal(a.values.fees, b.values.fees);
  });

  it("without seller information every state with a schedule counts as covered", () => {
    const noSeller = toContext({ ...input, revenueUsd: undefined }, data);
    const ev = evaluateSetup(products, FITTED, index, noSeller)!;
    assert.ok(ev.values.fees > 0);
  });
});

describe("the Fees score and the coverage card agree", () => {
  it("one setup's yearly fee is the same number on the label and on the state cards (jar and lid counted)", () => {
    const ev = evaluateSetup(products, FITTED, index, ctx)!;
    const cards = coverageForSetup(ev, input, data, { includeCandleContainer: true });
    const cardTotal = cards.reduce((s, c) => s + (c.fee_usd_per_year ?? 0), 0);
    close(ev.values.fees, cardTotal, 0.01, "label vs cards");
    assert.ok(ev.values.fees > 0);
  });
});

describe("the jar and lid belong to Maya's candle only", () => {
  it("counted for her unchanged candle: glass and steel", () => {
    assert.equal(productPackagingOf(input).length, 2);
    const g = productPackagingGramsPerOrder(input, true);
    assert.ok(g.glass > 0 && g.steel > 0);
  });

  it("not counted once the product is changed, so another seller's fees exclude her jar", () => {
    const mug = { ...input, lines: [{ ...input.lines[0], name: "Ceramic mug", weight_oz: 12 }] };
    assert.deepEqual(productPackagingOf(mug), []);
    assert.deepEqual(productPackagingGramsPerOrder(mug, true), {});
    const two = { ...input, lines: [input.lines[0], { ...input.lines[0], key: "second" }] };
    assert.deepEqual(productPackagingOf(two), []);
  });

  it("the Fees score drops the jar and lid for another product", () => {
    const mug = { ...input, lines: [{ ...input.lines[0], name: "Ceramic mug" }] };
    const withJar = evaluateSetup(products, FITTED, index, ctx)!;
    const without = evaluateSetup(toProducts(mug), FITTED, index, toContext(mug, data))!;
    assert.ok(without.values.fees < withJar.values.fees);
  });
});

describe("yearly swap totals (answer key per-order values x orders per year)", () => {
  const key = readJson("tests/fixtures/demo-answer-key.json").demo_B_right_size_12oz_candle.per_order;
  const N = input.ordersPerYear;
  const G = 453.59237;
  const diff = (name: string) => key[name].current - key[name].right_sized;
  const top = rankSwaps(products, currentSetup(input)!, data.catalog, ctx)!.swaps[0];
  const within = (actual: number, expected: number, pct: number, label: string) =>
    assert.ok(Math.abs(actual - expected) <= expected * pct, `${label}: expected about ${Math.round(expected)}, got ${Math.round(actual)}`);

  // The key rounds wrap to 1.0 sq ft; the engine uses 0.88 (two layers), about 1 g less plastic per order: under 2% a year.
  it("plastic avoided, landfill avoided and CO2e avoided match within 2%", () => {
    within(top.plastic_avoided_lb_per_year, (diff("Plastic weight (g)") * N) / G, 0.02, "plastic lb");
    within(top.landfill_avoided_lb_per_year, (diff("Unrecycled packaging (g)") * N) / G, 0.02, "landfill lb");
    within(top.carbon_avoided_kg_per_year, diff("CO2e, production + end of life (kg)") * N, 0.02, "CO2e kg");
  });

  it("net dollars saved = shipping saved minus the extra packaging cost, within 1%", () => {
    const shipping = diff("Shipping price paid ($, lower of the two, averaged over destination zones)");
    const packaging = -diff("Packaging material cost ($)");
    within(top.usd_saved_per_year, (shipping - packaging) * N, 0.01, "net dollars");
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
