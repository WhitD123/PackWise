// The home page "try it" calculator: three choices give an instant estimate from the real engine.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadData } from "../src/lib/data.ts";
import { GLOSSARY } from "../src/lib/glossary.ts";
import { evaluateSetup } from "../src/lib/planner/evaluateSetup.ts";
import { toContext, toProducts } from "../src/lib/planner/plannerInput.ts";
import { indexCatalog } from "../src/lib/catalog.ts";
import { PACKAGING_PRESETS, QUICK_PRODUCTS, quickEstimate, quickInput } from "../src/lib/tryit/quickEstimate.ts";

const data = loadData();
const index = indexCatalog(data.catalog);

describe("quick estimate inputs", () => {
  it("every preset uses components that exist in the library", () => {
    for (const p of PACKAGING_PRESETS) {
      for (const id of Object.values(p.setup).filter(Boolean)) assert.ok(index.component(id), `${p.id}: ${id}`);
    }
  });

  it("orders a month become orders a year, spread across the US by population", () => {
    const input = quickInput(data, "candle-12oz", "big-box-foam", 500);
    assert.equal(input.ordersPerYear, 6000);
    const total = Object.values(input.orderStatePercent!).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(total - 100) < 1e-9);
    assert.ok(input.orderStatePercent!.CA > input.orderStatePercent!.WY, "more people, more orders");
    assert.deepEqual(Object.keys(input.statePercent).sort(), ["CA", "CO", "OR"]);
  });

  it("ships from Portland by default (exact zones) and from any other ZIP with estimated zones", () => {
    const portland = toContext(quickInput(data, "candle-12oz", "big-box-foam", 500), data);
    const atlanta = toContext(quickInput(data, "candle-12oz", "big-box-foam", 500, "30303"), data);
    assert.equal(portland.zoneLabel, "exact");
    assert.equal(atlanta.zoneLabel, "estimated");
  });
});

describe("quick estimate results", () => {
  it("default: the candle in a big box with foam and wrap gets the box made for its jar", () => {
    const r = quickEstimate(data, quickInput(data, "candle-12oz", "big-box-foam", 500));
    assert.equal(r.status, "ok");
    if (r.status !== "ok") return;
    assert.equal(r.best?.to.outer_id, "box-12oz-straight-jar-shipper");
    assert.ok(Math.round((r.current.emptySpaceRatio ?? 0) * 100) === 96);
    assert.ok(r.best!.plastic_avoided_lb_per_year > 0);
    assert.ok(r.best!.usd_saved_per_year > 0);
  });

  it("glass in a plain poly mailer is flagged as not protected enough", () => {
    const r = quickEstimate(data, quickInput(data, "candle-12oz", "poly-mailer", 500));
    assert.equal(r.status, "ok");
    if (r.status !== "ok") return;
    assert.equal(r.currentMeetsMinimum, false);
    assert.ok(r.best, "a safe option is offered");
    assert.equal(r.best!.option.values.protection, "high");
  });

  it("every product and preset gives an answer or a clear no-fit, never an error", () => {
    let ok = 0;
    for (const product of QUICK_PRODUCTS) {
      for (const preset of PACKAGING_PRESETS) {
        const r = quickEstimate(data, quickInput(data, product.id, preset.id, 300));
        assert.ok(r.status === "ok" || r.status === "no-fit");
        if (r.status === "ok") ok++;
      }
    }
    assert.ok(ok >= QUICK_PRODUCTS.length * 2, `only ${ok} combinations worked`);
  });

  it("a no-fit combination really does not fit: the paperback in the small bubble mailer", () => {
    const input = quickInput(data, "paperback-book", "bubble-mailer", 300);
    const loose = evaluateSetup(toProducts(input), { ...input.current, fill_id: null, wrap_id: null, insert_id: null }, index, toContext(input, data), {
      strictClearance: false,
    });
    const r = quickEstimate(data, input);
    assert.equal(r.status === "no-fit", loose === null);
  });
});

describe("the better setup is a sensible one", () => {
  it("a ceramic mug in a big box with foam is not sent a wine-bottle tray", () => {
    const r = quickEstimate(data, quickInput(data, "ceramic-mug", "big-box-foam", 500));
    assert.equal(r.status, "ok");
    if (r.status !== "ok" || !r.best) return;
    assert.ok(!r.best.option.parts.insert?.id.includes("bottle"), r.best.option.parts.insert?.id);
    assert.ok(r.best.score_change >= 0, "the better setup does not score worse than today");
  });

  it("the 8 oz candle (sourced size) gets the Flush box made for 8 oz jars", () => {
    const r = quickEstimate(data, quickInput(data, "candle-8oz", "big-box-foam", 500));
    assert.equal(r.status, "ok");
    if (r.status !== "ok") return;
    assert.equal(r.best?.to.outer_id, "box-8oz-jelly-jar-shipper");
  });
});

describe("example candles match the sourced demo candles", () => {
  it("size and packed weight equal data/samples/demo-products.json", async () => {
    const { readFileSync } = await import("node:fs");
    const demo = JSON.parse(readFileSync(new URL("../data/samples/demo-products.json", import.meta.url), "utf8")).demo_candles;
    for (const [key, id] of [["8oz", "candle-8oz"], ["12oz", "candle-12oz"]] as const) {
      const ex = QUICK_PRODUCTS.find((p) => p.id === id)!;
      assert.equal(ex.length_in, demo[key].diameter_in, `${id} diameter`);
      assert.equal(ex.height_in, demo[key].height_in, `${id} height`);
      assert.ok(Math.abs(ex.weight_g - demo[key].packed_weight_lb * 453.59237) < 1, `${id} weight`);
    }
  });
});

describe("glossary", () => {
  it("every entry has a term and a plain definition with no em dashes", () => {
    for (const [k, v] of Object.entries(GLOSSARY)) {
      assert.ok(v.term.length > 0 && v.def.length > 20, k);
      assert.ok(!v.def.includes("—"), `${k} has an em dash`);
    }
  });
});
