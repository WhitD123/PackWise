import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { planPackaging } from "../src/lib/planner/planPackaging.ts";
import { PROTECTION_RANK } from "../src/lib/scoring/protection.ts";
import { WEIGHT_PRESETS } from "../src/lib/scoring/weights.ts";
import { rankSwaps } from "../src/lib/swaps/rankSwaps.ts";
import type { Product } from "../src/lib/types.ts";
import {
  BOX_12,
  BOX_8,
  BUBBLE_WRAP,
  CANDLE,
  CATALOG,
  CONTEXT,
  KRAFT_FILL,
  POLY_MAILER,
  setup,
  SOAP,
  TSHIRT,
} from "./fixtures/library.ts";

const oneCandle: Product[] = [CANDLE];

describe("planPackaging", () => {
  it("returns three safe picks for a fragile candle", () => {
    const plan = planPackaging(oneCandle, CATALOG, CONTEXT);
    assert.equal(plan.fragility, "high");
    assert.equal(plan.noSafeOption, false);
    assert.ok(plan.picks);
    for (const pick of Object.values(plan.picks)) assert.notEqual(pick.values.protection, "low");
  });

  it("cheapest really is cheapest and lowest-waste really is lowest-waste", () => {
    const plan = planPackaging(oneCandle, CATALOG, CONTEXT);
    assert.ok(plan.picks);
    assert.equal(plan.picks.cheapest.values.cost, Math.min(...plan.options.map((o) => o.values.cost)));
    assert.equal(plan.picks.lowestWaste.values.waste, Math.min(...plan.options.map((o) => o.values.waste)));
  });

  it("drops oversized boxes that a smaller box beats on everything", () => {
    const plan = planPackaging(oneCandle, CATALOG, CONTEXT);
    for (const o of plan.options) assert.notEqual(o.setup.outer_id, BOX_12.id);
  });

  it("returns the section 9 score shape", () => {
    const plan = planPackaging(oneCandle, CATALOG, CONTEXT);
    const s = plan.picks!.bestBalance.score;
    for (const k of ["cost", "protection", "waste", "fees", "carbon"] as const) {
      assert.ok(s[k].score >= 0 && s[k].score <= 10);
    }
    assert.equal(typeof s.cost.usd_per_order, "number");
    assert.equal(typeof s.waste.landfill_g_per_order, "number");
    assert.equal(typeof s.plastic_g_per_order, "number");
  });

  it("allows a plain mailer for a sturdy T-shirt", () => {
    const plan = planPackaging([TSHIRT], CATALOG, CONTEXT);
    assert.ok(plan.picks);
    assert.equal(plan.picks.cheapest.parts.outer.type, "mailer");
  });

  it("handles a multi-product order", () => {
    const plan = planPackaging([{ ...CANDLE, items_per_order: 2 }, { ...SOAP, items_per_order: 2 }], CATALOG, CONTEXT);
    assert.ok(plan.picks);
    assert.ok(plan.options.every((o) => o.parts.outer.type === "box"));
  });

  it("reports when nothing fits", () => {
    const plan = planPackaging([{ ...CANDLE, length_in: 30, width_in: 30, height_in: 30 }], CATALOG, CONTEXT);
    assert.equal(plan.picks, null);
    assert.equal(plan.fittingCount, 0);
  });
});

describe("rankSwaps", () => {
  const current = setup(POLY_MAILER, { wrap: BUBBLE_WRAP });

  it("suggests safer, less-plastic swaps for a candle in a poly mailer", () => {
    const result = rankSwaps(oneCandle, current, CATALOG, CONTEXT);
    assert.ok(result);
    assert.equal(result.current.values.protection, "low");
    assert.ok(result.swaps.length > 0);
    for (const s of result.swaps) {
      assert.ok(PROTECTION_RANK[s.option.values.protection] >= PROTECTION_RANK.medium);
      assert.ok(s.plastic_avoided_lb_per_year > 0 || s.landfill_avoided_lb_per_year > 0);
    }
  });

  it("fills in the section 9 swap shape", () => {
    const result = rankSwaps(oneCandle, current, CATALOG, CONTEXT);
    assert.ok(result);
    const top = result.swaps[0];
    assert.deepEqual(top.from, current);
    assert.equal(top.to, top.option.setup);
    const expectedPlastic = ((result.current.plasticWeight_g - top.option.plasticWeight_g) * CONTEXT.ordersPerYear) / 453.59237;
    assert.ok(Math.abs(top.plastic_avoided_lb_per_year - expectedPlastic) < 1e-9);
    assert.ok(Math.abs(top.score_change - (top.option.score.overall - result.current.score.overall)) < 1e-9);
    assert.ok(Array.isArray(top.tradeoffs));
    assert.match(top.summary, /^Switch Poly mailer 10x13 with bubble wrap to /);
  });

  it("writes trade-offs as sentences", () => {
    const result = rankSwaps(oneCandle, current, CATALOG, CONTEXT);
    assert.ok(result);
    const costlier = result.swaps.find((s) => s.worse_on.includes("cost"));
    if (costlier) assert.match(costlier.tradeoffs[0], /^Costs .* more per order$/);
  });

  it("never lowers protection compared with today", () => {
    const result = rankSwaps(oneCandle, setup(BOX_8, { fill: KRAFT_FILL }), CATALOG, CONTEXT, WEIGHT_PRESETS.waste);
    assert.ok(result);
    for (const s of result.swaps) {
      assert.ok(PROTECTION_RANK[s.option.values.protection] >= PROTECTION_RANK[result.current.values.protection]);
      assert.ok(!s.worse_on.includes("protection"));
    }
  });

  it("still suggests safe swaps when an unsafe setup scores higher on cost", () => {
    const result = rankSwaps(oneCandle, current, CATALOG, CONTEXT, { cost: 1 });
    assert.ok(result);
    assert.equal(result.currentMeetsMinimum, false);
    assert.ok(result.swaps.length > 0);
  });

  it("ranks by plastic avoided, then landfill avoided (not by overall score)", () => {
    const result = rankSwaps(oneCandle, current, CATALOG, CONTEXT, WEIGHT_PRESETS.balanced, 10);
    assert.ok(result);
    assert.ok(result.swaps.length > 1);
    for (let i = 1; i < result.swaps.length; i++) {
      const a = result.swaps[i - 1];
      const b = result.swaps[i];
      assert.ok(
        a.plastic_avoided_lb_per_year > b.plastic_avoided_lb_per_year - 1e-9 ||
          (Math.abs(a.plastic_avoided_lb_per_year - b.plastic_avoided_lb_per_year) < 1e-9 &&
            a.landfill_avoided_lb_per_year >= b.landfill_avoided_lb_per_year - 1e-9),
      );
    }
  });

  it("every swap removes plastic or landfill weight", () => {
    const result = rankSwaps(oneCandle, current, CATALOG, CONTEXT);
    assert.ok(result);
    for (const s of result.swaps) {
      assert.ok(s.plastic_avoided_lb_per_year > 1e-9 || s.landfill_avoided_lb_per_year > 1e-9);
    }
  });

  it("returns at most one swap per outer", () => {
    const result = rankSwaps(oneCandle, current, CATALOG, CONTEXT, WEIGHT_PRESETS.balanced, 10);
    assert.ok(result);
    const ids = result.swaps.map((s) => s.to.outer_id);
    assert.equal(new Set(ids).size, ids.length);
  });
});
