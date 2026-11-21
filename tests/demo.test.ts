// Runs the demo seller from the brief against the real files in data/.
// If a data change breaks the video walkthrough, this fails.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { indexCatalog, resolveSetup } from "../src/lib/catalog.ts";
import { loadData } from "../src/lib/data.ts";
import { planPackaging } from "../src/lib/planner/planPackaging.ts";
import { currentSetup, defaultInput, toContext, toProducts, validateInput } from "../src/lib/planner/plannerInput.ts";
import { rightSize } from "../src/lib/rightsizing/rightSize.ts";
import { rankSwaps } from "../src/lib/swaps/rankSwaps.ts";
import { MATERIAL_IDS } from "../src/lib/types.ts";

const data = loadData();
const input = defaultInput(data);
const products = toProducts(input);
const ctx = toContext(input, data);

describe("data files follow docs/data-format.md", () => {
  it("every component uses an allowed material, type, unit and protection", () => {
    const materials = new Set<string>(MATERIAL_IDS);
    for (const c of data.catalog.components) {
      assert.ok(materials.has(c.material), `${c.id}: unknown material ${c.material}`);
      assert.ok(["box", "mailer", "filler", "wrap", "insert"].includes(c.type), `${c.id}: bad type`);
      assert.ok(["low", "medium", "high"].includes(c.protection), `${c.id}: bad protection`);
      const expectedUnit = c.type === "filler" ? "cubic_ft" : c.type === "wrap" ? "square_ft" : "each";
      assert.equal(c.unit, expectedUnit, `${c.id}: unit`);
      if (["box", "mailer", "insert"].includes(c.type)) {
        assert.ok(c.length_in! > 0 && c.width_in! > 0 && c.height_in! > 0, `${c.id}: needs a size`);
      }
    }
  });

  it("ids are unique", () => {
    const ids = data.catalog.components.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("every material id is in the allowed list", () => {
    for (const m of data.catalog.materials) assert.ok((MATERIAL_IDS as readonly string[]).includes(m.id), m.id);
  });

  it("fee rates use our material ids", () => {
    for (const f of data.feeSchedules) {
      for (const m of Object.keys(f.rates)) assert.ok((MATERIAL_IDS as readonly string[]).includes(m), `${f.state}: ${m}`);
    }
  });
});

describe("demo seller on real data", () => {
  it("has a valid default input", () => {
    assert.deepEqual(validateInput(input), []);
  });

  it("finds three safe picks", () => {
    const plan = planPackaging(products, data.catalog, ctx);
    assert.ok(plan.picks);
    assert.equal(plan.noSafeOption, false);
  });

  it("can measure the demo seller's current packaging", () => {
    const current = currentSetup(input);
    assert.ok(current);
    assert.ok(resolveSetup(current, indexCatalog(data.catalog)), "current ids must exist and go together");
    assert.ok(rightSize(products, current, data.catalog, ctx), "the candle must fit today's packaging");
  });

  it("suggests at least one swap that avoids plastic", () => {
    const swaps = rankSwaps(products, currentSetup(input)!, data.catalog, ctx);
    assert.ok(swaps);
    assert.ok(swaps.swaps.length > 0);
    assert.ok(swaps.swaps[0].plastic_avoided_lb_per_year > 0);
  });
});
