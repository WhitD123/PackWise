// The packaging library page: filters, sorting and wording, on the real library data.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadData } from "../src/lib/data.ts";
import {
  countByType,
  DEFAULT_FILTERS,
  filterComponents,
  filtersFromQuery,
  filtersToQuery,
  priceText,
  sizeText,
  weightText,
} from "../src/lib/library/browse.ts";

const data = loadData();
const { components, materials } = data.catalog;
const comp = (id: string) => components.find((c) => c.id === id)!;
const run = (patch: Partial<typeof DEFAULT_FILTERS>) => filterComponents(components, materials, { ...DEFAULT_FILTERS, ...patch });

describe("library counts (CLAUDE.md section 6: 29 boxes, 16 mailers, 4 fillers, 3 wraps, 3 inserts)", () => {
  it("counts every component by type", () => {
    assert.deepEqual(countByType(components), { all: 55, box: 29, mailer: 16, filler: 4, wrap: 3, insert: 3 });
  });

  it("with no filters, shows all 55", () => {
    assert.equal(run({}).length, 55);
  });
});

describe("filters", () => {
  it("type: only mailers", () => {
    const r = run({ type: "mailer" });
    assert.equal(r.length, 16);
    assert.ok(r.every((c) => c.type === "mailer"));
  });

  it("plastic-free: no component whose material is plastic", () => {
    const plastic = new Set(materials.filter((m) => m.is_plastic).map((m) => m.id));
    const r = run({ plasticFree: true });
    assert.ok(r.length > 0 && r.length < 55);
    assert.ok(r.every((c) => !plastic.has(c.material)));
  });

  it("material: only corrugated", () => {
    assert.ok(run({ material: "corrugated" }).every((c) => c.material === "corrugated"));
  });

  it("search matches words in any order, and size written with x", () => {
    assert.ok(run({ query: "12 x 10 x 8" }).some((c) => c.id === "box-12x10x8-single"));
    assert.ok(run({ query: "jar flush" }).every((c) => c.supplier === "Flush Packaging"));
    assert.equal(run({ query: "nothing-matches-this" }).length, 0);
  });

  it("filters combine: plastic-free mailers", () => {
    const r = run({ type: "mailer", plasticFree: true });
    assert.ok(r.length > 0);
    assert.ok(r.every((c) => c.type === "mailer" && !materials.find((m) => m.id === c.material)!.is_plastic));
  });
});

describe("sorting", () => {
  it("cheapest first and lightest first are ascending", () => {
    const p = run({ sort: "price" }).map((c) => c.price_usd);
    const w = run({ sort: "weight" }).map((c) => c.weight_g);
    assert.deepEqual(p, [...p].sort((a, b) => a - b));
    assert.deepEqual(w, [...w].sort((a, b) => a - b));
  });

  it("smallest first puts the 4 x 4 x 4 box before the 12 x 12 x 12 box", () => {
    const ids = run({ type: "box", sort: "size" }).map((c) => c.id);
    assert.ok(ids.indexOf("box-4x4x4-single") < ids.indexOf("box-12x12x12-single"));
  });
});

describe("wording keeps the unit", () => {
  it("boxes are each, fillers per cubic foot, wraps per square foot", () => {
    assert.equal(priceText(comp("box-12x10x8-single")), "$1.02 each, buying 500");
    assert.equal(priceText(comp("foam-peanuts-fill")), "$1.85 per cubic foot");
    assert.match(priceText(comp("bubble-wrap-3-16")), /per square foot$/);
    assert.equal(weightText(comp("foam-peanuts-fill")), "94 g per cubic foot");
    assert.equal(sizeText(comp("box-12x10x8-single")), "12 x 10 x 8 in inside");
    assert.equal(sizeText(comp("poly-mailer-10x13")), "Flat 13 x 10 in");
    assert.equal(sizeText(comp("foam-peanuts-fill")), "Sold by the cubic foot");
  });

  it("the uncertain paper fillers carry a weight range", () => {
    assert.deepEqual(comp("crinkle-paper-fill").weight_range_g, [660, 1296]);
    assert.ok(comp("crinkle-paper-fill").is_estimate);
  });
});

describe("filters in the page address", () => {
  it("round-trips, and ignores values that are not allowed", () => {
    const f = { ...DEFAULT_FILTERS, type: "box" as const, plasticFree: true, query: "jar", sort: "price" as const };
    assert.deepEqual(filtersFromQuery(new URLSearchParams(filtersToQuery(f)), materials), f);
    assert.deepEqual(filtersFromQuery(new URLSearchParams("type=spaceship&material=gold&sort=hack"), materials), DEFAULT_FILTERS);
    assert.equal(filtersToQuery(DEFAULT_FILTERS), "");
  });
});
