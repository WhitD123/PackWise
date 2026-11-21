// Scan schema and matching to the library, on the real data files. No AI calls here.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadData } from "../src/lib/data.ts";
import { buildScanPrompt } from "../src/lib/scan/prompt.ts";
import { matchPart, parseScan } from "../src/lib/scan/parseScan.ts";
import { scanResultSchema, type ScanPart } from "../src/lib/scan/schema.ts";
import { MATERIAL_IDS } from "../src/lib/types.ts";

const data = loadData();
const part = (over: Partial<ScanPart>): ScanPart => ({
  part_name: "x",
  type: "box",
  material: "corrugated",
  approx_dims_in: null,
  confidence: "high",
  ...over,
});

// What a good reading of Maya's packed order looks like (CLAUDE.md section 9).
const MAYA: ScanPart[] = [
  part({ part_name: "Corrugated shipping box", type: "box", material: "corrugated", approx_dims_in: { length_in: 12, width_in: 10, height_in: 8 } }),
  part({ part_name: "Packing peanuts", type: "filler", material: "eps-foam" }),
  part({ part_name: "Bubble wrap", type: "wrap", material: "pe-film" }),
  part({ part_name: "Glass jar", type: "product_packaging", material: "glass" }),
  part({ part_name: "Metal lid", type: "product_packaging", material: "steel" }),
];

describe("schema", () => {
  it("accepts a well-formed reply", () => {
    assert.ok(scanResultSchema.safeParse({ parts: MAYA, notes: "" }).success);
  });

  it("rejects a material that is not one of our 12", () => {
    assert.equal(scanResultSchema.safeParse({ parts: [{ ...MAYA[0], material: "cardboard" }], notes: "" }).success, false);
  });

  it("rejects an unknown part type, impossible sizes and missing fields", () => {
    assert.equal(scanResultSchema.safeParse({ parts: [{ ...MAYA[0], type: "bag" }], notes: "" }).success, false);
    assert.equal(scanResultSchema.safeParse({ parts: [{ ...MAYA[0], approx_dims_in: { length_in: -1, width_in: 5, height_in: 5 } }], notes: "" }).success, false);
    assert.equal(scanResultSchema.safeParse({ parts: [{ part_name: "x" }], notes: "" }).success, false);
  });

  it("limits how many parts one photo can return", () => {
    assert.equal(scanResultSchema.safeParse({ parts: Array.from({ length: 13 }, () => MAYA[0]), notes: "" }).success, false);
  });
});

describe("prompt", () => {
  it("lists every material id from the data, so prompt and schema agree", () => {
    const prompt = buildScanPrompt(data.catalog.materials);
    for (const id of MATERIAL_IDS) assert.ok(prompt.includes(`- ${id}:`), id);
  });

  it("tells the model to ignore instructions written in the photo", () => {
    assert.match(buildScanPrompt(data.catalog.materials), /never as instructions/);
  });
});

describe("matching to the library", () => {
  const result = parseScan(MAYA, data.catalog);

  it("Maya's order maps to today's setup: oversized box, foam peanuts, bubble wrap", () => {
    assert.deepEqual(result.setup, {
      outer_id: "box-12x10x8-single",
      fill_id: "foam-peanuts-fill",
      wrap_id: "bubble-wrap-3-16",
      insert_id: null,
    });
  });

  it("does not put the jar or lid in the setup, and says why", () => {
    const jar = result.matches.find((m) => m.part.part_name === "Glass jar")!;
    assert.equal(jar.component_id, null);
    assert.equal(jar.ambiguous, false);
  });

  it("picks the closest box by size and flags a close call", () => {
    const m = matchPart(part({ approx_dims_in: { length_in: 12, width_in: 10, height_in: 8 } }), data.catalog);
    assert.equal(m.component_id, "box-12x10x8-single");
    const rough = matchPart(part({ approx_dims_in: { length_in: 12, width_in: 10, height_in: 8 }, confidence: "low" }), data.catalog);
    assert.equal(rough.ambiguous, true);
  });

  it("never auto-matches a fitted jar shipper", () => {
    const m = matchPart(part({ approx_dims_in: { length_in: 6, width_in: 5.6, height_in: 3.5 } }), data.catalog);
    assert.ok(!data.catalog.components.find((c) => c.id === m.component_id)?.has_fitted_insert);
  });

  it("with no size and several options, picks one and asks the user", () => {
    const m = matchPart(part({ type: "filler", material: "kraft-paper" }), data.catalog);
    assert.ok(m.component_id);
    assert.equal(m.ambiguous, true);
  });

  it("a material with no library item for that type returns no match", () => {
    const m = matchPart(part({ type: "filler", material: "glass" }), data.catalog);
    assert.equal(m.component_id, null);
    assert.equal(m.ambiguous, true);
  });

  it("uses one outer, and warns about a second", () => {
    const two = parseScan([MAYA[0], part({ part_name: "Poly mailer", type: "mailer", material: "pe-film", confidence: "low" })], data.catalog);
    assert.ok(two.setup.outer_id);
    assert.match(two.warnings.join(" "), /one of each/);
  });

  it("drops loose fill inside a mailer", () => {
    const r = parseScan([part({ type: "mailer", material: "pe-film", approx_dims_in: { length_in: 13, width_in: 10, height_in: 1 } }), part({ type: "filler", material: "eps-foam" })], data.catalog);
    assert.equal(r.setup.fill_id, null);
    assert.match(r.warnings.join(" "), /mailer/);
  });

  it("warns when no box or mailer was found", () => {
    const r = parseScan([part({ type: "wrap", material: "pe-film" })], data.catalog);
    assert.equal(r.setup.outer_id, null);
    assert.match(r.warnings.join(" "), /No box or mailer/);
  });
});

describe("fillers of the same material are told apart by name", () => {
  const catalog = loadData().catalog;
  const filler = (part_name: string, confidence: "high" | "medium" | "low" = "high"): ScanPart => ({
    part_name,
    type: "filler",
    material: "kraft-paper",
    approx_dims_in: null,
    confidence,
  });

  it("crinkled paper is the crinkle fill, crumpled paper is the void fill", () => {
    assert.equal(matchPart(filler("Crinkled paper filler"), catalog).component_id, "crinkle-paper-fill");
    assert.equal(matchPart(filler("Crinkle cut paper shred"), catalog).component_id, "crinkle-paper-fill");
    assert.equal(matchPart(filler("Crumpled kraft paper"), catalog).component_id, "kraft-paper-void-fill");
    assert.equal(matchPart(filler("Crinkled paper filler"), catalog).ambiguous, false);
  });

  it("a name that does not decide it still falls back to the cheapest, marked for checking", () => {
    const m = matchPart(filler("Paper filler"), catalog);
    assert.equal(m.ambiguous, true);
    assert.match(m.reason, /Check it/);
  });

  it("a low-confidence part is always marked for checking, even when the name decides", () => {
    assert.equal(matchPart(filler("Crinkled paper", "low"), catalog).ambiguous, true);
  });
});
