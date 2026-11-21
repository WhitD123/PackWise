import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { indexCatalog } from "../src/lib/catalog.ts";
import { evaluateSetup } from "../src/lib/planner/evaluateSetup.ts";
import { billableWeight, shippingQuote } from "../src/lib/rightsizing/dimWeight.ts";
import { CLEARANCE_IN, fitMailer, packIntoBox } from "../src/lib/rightsizing/packItems.ts";
import { rightSize } from "../src/lib/rightsizing/rightSize.ts";
import { rateProtection } from "../src/lib/scoring/protection.ts";
import type { Dimensions, Placement, Product } from "../src/lib/types.ts";
import {
  BOX_12,
  BOX_12x8x8,
  BOX_6,
  BOX_8,
  BUBBLE_WRAP,
  CANDLE,
  CATALOG,
  CONTEXT,
  JAR_INSERT,
  KRAFT_FILL,
  PADDED_KRAFT_MAILER,
  POLY_MAILER,
  setup,
  TSHIRT,
  UPS_LIKE,
  USPS_LIKE,
} from "./fixtures/library.ts";

const dims = (length: number, width: number, height: number): Dimensions => ({ length, width, height });
const NO_PAD = { wall: 0, gap: 0 };
const INDEX = indexCatalog(CATALOG);
const MAILER_10x13 = { length: 13, width: 10, maxThickness: 5 };
const oneCandle = [CANDLE];

function assertValidPacking(placements: Placement[], inner: Dimensions, wall: number, gap: number) {
  for (const p of placements) {
    assert.ok(p.x >= wall - 1e-9 && p.y >= wall - 1e-9 && p.z >= wall - 1e-9, "inside wall padding");
    assert.ok(p.x + p.dims.length <= inner.length - wall + 1e-9, "fits length");
    assert.ok(p.y + p.dims.width <= inner.width - wall + 1e-9, "fits width");
    assert.ok(p.z + p.dims.height <= inner.height - wall + 1e-9, "fits height");
  }
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i];
      const b = placements[j];
      const apart =
        a.x + a.dims.length + gap <= b.x + 1e-9 || b.x + b.dims.length + gap <= a.x + 1e-9 ||
        a.y + a.dims.width + gap <= b.y + 1e-9 || b.y + b.dims.width + gap <= a.y + 1e-9 ||
        a.z + a.dims.height + gap <= b.z + 1e-9 || b.z + b.dims.height + gap <= a.z + 1e-9;
      assert.ok(apart, `items ${i} and ${j} overlap or are closer than the gap`);
    }
  }
}

describe("dimensional weight (data-format section 7)", () => {
  it("ignores dim weight at or under the USPS 1 cubic foot threshold", () => {
    // 12 x 12 x 12 = 1728, not above 1728. 2 lb actual -> 2 lb.
    const bw = billableWeight(dims(12, 12, 12), 2 * 453.59237, USPS_LIKE);
    assert.equal(bw.dim_lb, 0);
    assert.equal(bw.billable_lb, 2);
  });

  it("charges dim weight above the threshold", () => {
    // 13^3 = 2197 / 166 = 13.23 -> 14 lb billable even though it weighs 2 lb.
    assert.equal(billableWeight(dims(13, 13, 13), 2 * 453.59237, USPS_LIKE).billable_lb, 14);
    assert.equal(shippingQuote(dims(13, 13, 13), 900, USPS_LIKE)?.price_usd, 20);
  });

  it("always applies dim weight when the threshold is null", () => {
    // 10 x 8 x 6 = 480 / 139 = 3.45 -> 4 lb, though it weighs under 1 lb.
    assert.equal(billableWeight(dims(10, 8, 6), 400, UPS_LIKE).billable_lb, 4);
  });

  it("uses exact sides, no rounding of dimensions", () => {
    assert.equal(billableWeight(dims(9.2, 8, 6), 400, UPS_LIKE).volume_in3, 9.2 * 8 * 6);
  });

  it("bills at least 1 lb", () => {
    assert.equal(billableWeight(dims(4, 4, 1), 50, USPS_LIKE).billable_lb, 1);
  });

  it("returns null when heavier than the rate table", () => {
    assert.equal(shippingQuote(dims(6, 6, 6), 25 * 453.6, USPS_LIKE), null);
  });
});

describe("packIntoBox", () => {
  it("packs 8 unit cubes into a 2x2x2 box exactly", () => {
    const p = packIntoBox(Array.from({ length: 8 }, () => dims(1, 1, 1)), dims(2, 2, 2), NO_PAD);
    assert.ok(p);
    assert.equal(p.length, 8);
    assertValidPacking(p, dims(2, 2, 2), 0, 0);
  });

  it("rejects 9 unit cubes in a 2x2x2 box", () => {
    assert.equal(packIntoBox(Array.from({ length: 9 }, () => dims(1, 1, 1)), dims(2, 2, 2), NO_PAD), null);
  });

  it("rotates a long item to fit", () => {
    const p = packIntoBox([dims(10, 2, 2)], dims(2, 2, 10), NO_PAD);
    assert.ok(p);
    assert.equal(p[0].dims.height, 10);
  });

  it("keeps 2 in of padding around a fragile candle", () => {
    // Candle 3.5 x 3.5 x 4 needs 7.5 x 7.5 x 8 inside.
    const jar = dims(3.5, 3.5, 4);
    assert.ok(packIntoBox([jar], dims(8, 8, 8), CLEARANCE_IN.high));
    assert.equal(packIntoBox([jar], dims(6, 6, 6), CLEARANCE_IN.high), null);
  });

  it("fits two fragile candles side by side with a 1 in gap", () => {
    // Length: 2 + 3.5 + 1 + 3.5 + 2 = 12. Width 7.5, height 8 -> fits 12 x 8 x 8 exactly.
    const two = [dims(3.5, 3.5, 4), dims(3.5, 3.5, 4)];
    const p = packIntoBox(two, dims(12, 8, 8), CLEARANCE_IN.high);
    assert.ok(p);
    assertValidPacking(p, dims(12, 8, 8), CLEARANCE_IN.high.wall, CLEARANCE_IN.high.gap);
    assert.equal(packIntoBox(two, dims(11, 8, 8), CLEARANCE_IN.high), null);
  });

  it("only returns valid packings for a mixed order", () => {
    // With 1 in walls and 0.5 in gaps these need ~210 in3 of usable space; 10x10x8 has 425.
    const items = [dims(5, 4, 3), dims(3, 3, 3), dims(6, 2, 2), dims(2, 2, 1), dims(4, 4, 1)];
    const p = packIntoBox(items, dims(10, 10, 8), CLEARANCE_IN.medium);
    assert.ok(p);
    assertValidPacking(p, dims(10, 10, 8), CLEARANCE_IN.medium.wall, CLEARANCE_IN.medium.gap);
  });
});

describe("fitMailer", () => {
  it("fits a folded T-shirt in a 10 x 13 mailer", () => {
    // 10 x 8 x 1 flat: 10 + 1 <= 13 and 8 + 1 <= 10.
    assert.ok(fitMailer([dims(10, 8, 1)], MAILER_10x13, 0));
  });

  it("stacks two T-shirts when they will not fit side by side", () => {
    const fit = fitMailer([dims(10, 8, 1), dims(10, 8, 1)], MAILER_10x13, 0);
    assert.ok(fit);
    assert.equal(fit.bundle.height, 2);
  });

  it("rejects contents thicker than the mailer's height_in", () => {
    assert.equal(fitMailer([dims(6, 6, 6)], MAILER_10x13, 0), null);
  });
});

describe("evaluateSetup", () => {
  it("computes fees per year from weight, rate and state share", () => {
    // Empty 6x6x6 box for a sturdy 5 in cube, nothing inside.
    // 150 g corrugated = 0.3307 lb x $0.08 x 10% x 10,000 orders = $26.46. Waste: 150 g x 0.1 = 15 g.
    const cube: Product = { name: "cube", length_in: 5, width_in: 5, height_in: 5, weight_g: 100, fragility: "low", items_per_order: 1 };
    const ev = evaluateSetup([cube], setup(BOX_6), INDEX, CONTEXT);
    assert.ok(ev);
    assert.ok(Math.abs(ev.values.fees - (150 / 453.59237) * 0.08 * 0.1 * 10000) < 1e-9);
    assert.ok(Math.abs(ev.values.waste - 15) < 1e-9);
    assert.deepEqual(ev.warnings, []);
  });

  it("uses filler per cubic foot of empty space", () => {
    // 8 in cube = 512 in3, candle 49 in3 -> 463 in3 = 0.268 ft3 x 200 g = 53.6 g of kraft fill.
    const ev = evaluateSetup(oneCandle, setup(BOX_8, { fill: KRAFT_FILL }), INDEX, CONTEXT);
    assert.ok(ev);
    const fill = ev.usage.find((u) => u.component.id === KRAFT_FILL.id);
    assert.ok(fill);
    assert.ok(Math.abs(fill.units - 463 / 1728) < 1e-9);
    assert.ok(Math.abs(fill.weight_g - (463 / 1728) * 200) < 1e-9);
  });

  it("uses wrap per square foot of item surface", () => {
    // Candle surface: 2 x (12.25 + 14 + 14) = 80.5 in2 = 0.559 ft2.
    const ev = evaluateSetup(oneCandle, setup(POLY_MAILER, { wrap: BUBBLE_WRAP }), INDEX, CONTEXT);
    assert.ok(ev);
    const wrap = ev.usage.find((u) => u.component.id === BUBBLE_WRAP.id);
    assert.ok(wrap);
    assert.ok(Math.abs(wrap.units - 80.5 / 144) < 1e-9);
  });

  it("lets an insert replace the padding, so a smaller box fits", () => {
    // Without the insert the candle needs 7.5 in inside; the 4 in insert (4.25 outside) fits a 6 in box.
    assert.equal(evaluateSetup(oneCandle, setup(BOX_6, { fill: KRAFT_FILL }), INDEX, CONTEXT), null);
    assert.ok(evaluateSetup(oneCandle, setup(BOX_6, { insert: JAR_INSERT, fill: KRAFT_FILL }), INDEX, CONTEXT));
  });

  it("refuses loose fill in a mailer and unknown ids", () => {
    assert.equal(evaluateSetup([TSHIRT], setup(POLY_MAILER, { fill: KRAFT_FILL }), INDEX, CONTEXT), null);
    assert.equal(
      evaluateSetup([TSHIRT], { outer_id: "nope", fill_id: null, wrap_id: null, insert_id: null }, INDEX, CONTEXT),
      null,
    );
  });

  it("warns instead of silently charging $0 when a fee rate is missing", () => {
    const noPaperRate = {
      ...CONTEXT,
      feeSchedules: [{ ...CONTEXT.feeSchedules[0], rates: { corrugated: CONTEXT.feeSchedules[0].rates.corrugated } }],
    };
    const ev = evaluateSetup([TSHIRT], setup(PADDED_KRAFT_MAILER), INDEX, noPaperRate);
    assert.ok(ev);
    assert.equal(ev.values.fees, 0);
    assert.match(ev.warnings.join(" "), /No OR fee rate found for: kraft-paper/);
  });

  it("rates the whole setup with the packing rules (scoring-spec.md section 3)", () => {
    const rate = (s: ReturnType<typeof setup>) => evaluateSetup(oneCandle, s, INDEX, CONTEXT)!.values.protection;
    // Glass in a soft mailer is never better than low (R1).
    assert.equal(rate(setup(POLY_MAILER, { wrap: BUBBLE_WRAP })), "low");
    // Glass in a box with fill but no individual wrap fails R3.
    assert.equal(rate(setup(BOX_8, { fill: KRAFT_FILL })), "low");
    // Wrapped glass with its empty space filled passes everything, but crumpled paper is
    // "non-fragile only" for glass (R5), so it drops one level.
    assert.equal(rate(setup(BOX_8, { wrap: BUBBLE_WRAP, fill: KRAFT_FILL })), "medium");
    // Wrapped glass with the empty space left unfilled fails the shake test: one level down.
    assert.equal(rate(setup(BOX_8, { wrap: BUBBLE_WRAP })), "medium");
    // A sturdy item in a box that fits is high.
    assert.equal(rateProtection({ outer: BOX_8, fill: null, wrap: null, insert: null }, "low"), "high");
  });
});

describe("rightSize", () => {
  it("moves one candle from a 12 in cube to the 8 in cube and saves on shipping", () => {
    const result = rightSize(oneCandle, setup(BOX_12, { fill: KRAFT_FILL }), CATALOG, CONTEXT);
    assert.ok(result);
    assert.equal(result.recommended?.setup.outer_id, BOX_8.id);
    // 12.25^3 = 1838 in3 > 1728 -> 11.07 -> 12 lb -> $20. 8.25^3 = 562 in3, under threshold -> 2 lb -> $6.50.
    assert.equal(result.current.shippingCost_usd, 20);
    assert.equal(result.recommended?.shippingCost_usd, 6.5);
    assert.equal(result.shippingSavingsPerOrder_usd, 13.5);
    assert.ok(result.voidReduction_in3 > 0);
    assert.ok(result.totalSavingsPerYear_usd > 100000);
  });

  it("returns no recommendation when already right-sized", () => {
    const result = rightSize(oneCandle, setup(BOX_8, { fill: KRAFT_FILL }), CATALOG, CONTEXT);
    assert.ok(result);
    assert.equal(result.recommended, null);
    assert.equal(result.totalSavingsPerOrder_usd, 0);
  });

  it("keeps the seller's insert when right-sizing", () => {
    const result = rightSize(oneCandle, setup(BOX_12x8x8, { insert: JAR_INSERT, fill: KRAFT_FILL }), CATALOG, CONTEXT);
    assert.ok(result?.recommended);
    assert.equal(result.recommended.setup.insert_id, JAR_INSERT.id);
    assert.equal(result.recommended.setup.outer_id, BOX_6.id);
  });
});
