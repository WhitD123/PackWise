// Order file reader against the sample file and small made-up files.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { OrderFileError, parseCsv, parseShopifyCsv } from "../src/lib/orders/parseShopifyCsv.ts";

const sample = readFileSync(new URL("../data/samples/shopify-orders.csv", import.meta.url), "utf8");
const HEADER = "Name,Created at,Shipping Province,Lineitem name,Lineitem quantity,Subtotal";

describe("sample file (Maya's store)", () => {
  const p = parseShopifyCsv(sample);

  it("has 4,483 one-candle orders over 7 days, scaled by 52", () => {
    assert.equal(p.orders.length, 4483);
    assert.equal(p.periodDays, 7);
    assert.equal(p.annualizationFactor, 52);
    assert.equal(p.ordersPerYear, 233_116);
  });

  it("counts Oregon: 369 orders, 19,188 a year", () => {
    assert.equal(p.orderCountByState.OR, 369);
    assert.equal(p.ordersPerYearByState.OR, 19_188);
  });

  it("annual revenue is about $8.2M and California sales about $1.15M", () => {
    assert.ok(Math.abs(p.revenuePerYear_usd - 8_162_960) < 1);
    assert.ok(Math.abs(p.salesPerYearByState_usd.CA - 1_149_616) < 1);
  });

  it("covers 50 states and DC; shares add to 1", () => {
    assert.equal(Object.keys(p.orderCountByState).length, 51);
    const total = Object.values(p.stateShare).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(total - 1) < 1e-9);
  });

  it("every order is one candle, so units equal orders", () => {
    assert.deepEqual(p.orderSizeCounts, { 1: 4483 });
    assert.equal(p.multiItemShare, 0);
    assert.equal(p.unitsPerYear, p.ordersPerYear);
  });

  it("has no warnings", () => {
    assert.deepEqual(p.warnings, []);
  });
});

describe("real Shopify export quirks", () => {
  it("groups line items by order and counts the subtotal once", () => {
    const csv = [HEADER, "#1,2026-10-05,OR,Candle A,1,40.00", "#1,2026-10-05,OR,Candle B,2,", "#2,2026-10-06,CA,Candle A,1,30.00"].join("\n");
    const p = parseShopifyCsv(csv);
    assert.equal(p.orders.length, 2);
    assert.equal(p.orders[0].units, 3);
    assert.equal(p.orders[0].subtotal_usd, 40);
    assert.equal(p.revenuePerYear_usd, 70 * p.annualizationFactor);
  });

  it("handles quotes, commas in names, CRLF line endings and a BOM", () => {
    const csv = `﻿${HEADER}\r\n#1,2026-10-05,or,"Candle, 8 oz ""Cedar""",1,"$1,040.50"\r\n`;
    const p = parseShopifyCsv(csv);
    assert.equal(p.orders[0].state, "OR");
    assert.equal(p.orders[0].lines[0].product, 'Candle, 8 oz "Cedar"');
    assert.equal(p.orders[0].subtotal_usd, 1040.5);
  });

  it("accepts a date with a time and zone", () => {
    const p = parseShopifyCsv([HEADER, "#1,2026-10-05 14:22:10 -0400,OR,A,1,10"].join("\n"));
    assert.equal(p.firstDate, "2026-10-05");
  });

  it("ignores extra columns and column order", () => {
    const csv = ["Email,Subtotal,Name,Created at,Lineitem quantity,Lineitem name,Shipping Province", "a@b.c,10,#1,2026-10-05,1,A,TX"].join("\n");
    assert.equal(parseShopifyCsv(csv).orders[0].state, "TX");
  });
});

describe("multi-item orders", () => {
  it("counts items and flags the share of orders with more than one", () => {
    const p = parseShopifyCsv([HEADER, "#1,2026-10-05,OR,A,3,90", "#2,2026-10-05,OR,A,1,30"].join("\n"));
    assert.equal(p.orders.length, 2);
    assert.equal(p.multiItemShare, 0.5);
    assert.ok(Math.abs(p.unitsPerYear - 4 * p.annualizationFactor / 1) < 1e-9);
  });
});

describe("bad input", () => {
  it("names the missing columns", () => {
    assert.throws(() => parseShopifyCsv("Name,Total\n#1,5"), (e: unknown) => e instanceof OrderFileError && /Created at/.test(e.message));
  });

  it("an empty file is an error", () => {
    assert.throws(() => parseShopifyCsv(""), OrderFileError);
  });

  it("skips rows with no usable state and says so", () => {
    const p = parseShopifyCsv([HEADER, "#1,2026-10-05,Oregon,A,1,10", "#2,2026-10-05,OR,A,1,10"].join("\n"));
    assert.equal(p.orders.length, 1);
    assert.match(p.warnings.join(" "), /no two-letter US state/);
  });

  it("warns when the file covers under a week", () => {
    const p = parseShopifyCsv([HEADER, "#1,2026-10-05,OR,A,1,10"].join("\n"));
    assert.equal(p.periodDays, 1);
    assert.match(p.warnings.join(" "), /very short sample/);
  });

  it("a period override changes the scaling", () => {
    const p = parseShopifyCsv([HEADER, "#1,2026-10-05,OR,A,1,10"].join("\n"), { periodDays: 14 });
    assert.equal(p.annualizationFactor, 26);
  });
});

describe("parseCsv", () => {
  it("keeps a newline inside quotes", () => {
    assert.deepEqual(parseCsv('a,"b\nc",d\n'), [["a", "b\nc", "d"]]);
  });
});
