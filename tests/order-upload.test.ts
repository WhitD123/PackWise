// Turning a seller's own Shopify export into planner answers (ordersFromParsedFile).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { indexCatalog } from "../src/lib/catalog.ts";
import { loadData } from "../src/lib/data.ts";
import { parseShopifyCsv } from "../src/lib/orders/parseShopifyCsv.ts";
import { evaluateSetup } from "../src/lib/planner/evaluateSetup.ts";
import { defaultInput, ordersFromParsedFile, ordersFromSample, toContext, toProducts } from "../src/lib/planner/plannerInput.ts";

const data = loadData();
const HEADER = "Name,Created at,Shipping Province,Lineitem name,Lineitem quantity,Subtotal";
const csv = (rows: string[]) => [HEADER, ...rows].join("\n");

describe("an uploaded file fills in the planner like the sample does", () => {
  it("uploading the sample file gives the same answers as the sample button", () => {
    const text = readFileSync(new URL("../data/samples/shopify-orders.csv", import.meta.url), "utf8");
    const up = ordersFromParsedFile(parseShopifyCsv(text), data).patch;
    const sample = ordersFromSample(data);
    assert.equal(up.ordersPerYear, sample.ordersPerYear);
    assert.equal(up.ordersPerYear, 233_116);
    assert.ok(Math.abs(up.revenueUsd! - sample.revenueUsd!) <= 1);
    assert.ok(Math.abs(up.californiaSalesUsd! - sample.californiaSalesUsd!) <= 1);
    assert.deepEqual(Object.keys(up.statePercent).sort(), ["CA", "CO", "OR"]);
    for (const s of Object.keys(up.statePercent)) assert.ok(Math.abs(up.statePercent[s] - sample.statePercent[s]) < 1e-9, s);
  });

  it("a one-week file scales by 52 and a two-week file by 26 (52 weeks a year)", () => {
    const week = parseShopifyCsv(csv(["#1,2026-10-05,OR,A,1,10", "#2,2026-10-11,TX,A,1,10"]));
    assert.equal(ordersFromParsedFile(week, data).patch.ordersPerYear, 104);
    const fortnight = parseShopifyCsv(csv(["#1,2026-10-05,OR,A,1,10", "#2,2026-10-18,TX,A,1,10"]));
    assert.equal(ordersFromParsedFile(fortnight, data).patch.ordersPerYear, 52);
  });

  it("state shares, revenue and California sales come from the file", () => {
    const text = csv(["#1,2026-10-05,CA,A,1,100", "#2,2026-10-06,CA,A,1,100", "#3,2026-10-07,OR,A,1,50", "#4,2026-10-11,TX,A,1,50"]);
    const { patch } = ordersFromParsedFile(parseShopifyCsv(text), data);
    assert.equal(patch.statePercent.CA, 50);
    assert.equal(patch.statePercent.OR, 25);
    assert.equal(patch.statePercent.CO, 0);
    assert.equal(patch.orderStatePercent!.TX, 25);
    assert.equal(patch.revenueUsd, 300 * 52);
    assert.equal(patch.californiaSalesUsd, 200 * 52);
  });

  it("says what the file covered and how it was scaled", () => {
    const r = ordersFromParsedFile(parseShopifyCsv(csv(["#1,2026-10-05,OR,A,1,10", "#2,2026-10-11,TX,A,1,10"])), data);
    assert.match(r.summary, /2 orders over 7 days \(2026-10-05 to 2026-10-11\), scaled by 52 to a year/);
    assert.match(r.patch.ordersNote!, /Your order file: 2 orders from 2026-10-05 to 2026-10-11/);
  });
});

describe("warnings the seller should see", () => {
  it("multi-item orders: results assume the products described in the planner", () => {
    const r = ordersFromParsedFile(parseShopifyCsv(csv(["#1,2026-10-05,OR,A,3,90", "#2,2026-10-05,OR,A,1,30"])), data);
    assert.ok(r.warnings.some((w) => /50% of orders have more than one item/.test(w)));
  });

  it("orders outside the 50 states and DC are counted but flagged", () => {
    const r = ordersFromParsedFile(parseShopifyCsv(csv(["#1,2026-10-05,ON,A,1,30", "#2,2026-10-05,OR,A,1,30"])), data);
    assert.ok(r.warnings.some((w) => /1 order\(s\) ship outside the 50 states and DC \(ON\)/.test(w)));
    assert.equal(r.patch.ordersPerYear, 2 * 364);
  });

  it("keeps the parser's own warnings, such as a very short file", () => {
    const r = ordersFromParsedFile(parseShopifyCsv(csv(["#1,2026-10-05,OR,A,1,30"])), data);
    assert.ok(r.warnings.some((w) => /only 1 day/.test(w)));
  });

  it("a clean one-item, in-US, one-week file has no warnings", () => {
    const rows = ["#1,2026-10-05,OR,A,1,30", "#2,2026-10-11,TX,A,1,30"];
    assert.deepEqual(ordersFromParsedFile(parseShopifyCsv(csv(rows)), data).warnings, []);
  });
});

describe("an uploaded file drives the engine", () => {
  const index = indexCatalog(data.catalog);
  const FITTED = { outer_id: "box-12oz-straight-jar-shipper", fill_id: null, wrap_id: null, insert_id: null };

  it("a small seller's file ($1.3M a year) is exempt from Oregon, Colorado and California, so fees are $0", () => {
    // 28 days x 52/4 weeks = x13. 99 orders of $1,000: $1.287M a year, about a third to each of OR, CA and TX.
    const rows: string[] = [];
    for (let i = 0; i < 99; i++) {
      const state = ["OR", "CA", "TX"][i % 3];
      const day = String(1 + (i % 28)).padStart(2, "0");
      rows.push(`#${i + 1},2026-10-${day},${state},Mug,1,1000`);
    }
    const { patch } = ordersFromParsedFile(parseShopifyCsv(csv(rows)), data);
    assert.equal(patch.revenueUsd, 99 * 1000 * 13);
    const input = { ...defaultInput(data), ...patch };
    const ev = evaluateSetup(toProducts(input), FITTED, index, toContext(input, data))!;
    assert.equal(ev.values.fees, 0);
    assert.equal(ev.zoneLabel, "exact"); // default ship-from is Portland
  });

  it("the same file with a bigger revenue is covered in Oregon and pays fees", () => {
    const rows = ["#1,2026-10-05,OR,Mug,1,40000", "#2,2026-10-06,TX,Mug,1,40000"]; // week: x52
    const { patch } = ordersFromParsedFile(parseShopifyCsv(csv(rows)), data);
    assert.ok(patch.revenueUsd! > 5_000_000);
    const input = { ...defaultInput(data), ...patch, ordersPerYear: 233_116 };
    const ev = evaluateSetup(toProducts(input), FITTED, index, toContext(input, data))!;
    assert.ok(ev.values.fees > 0);
  });
});
