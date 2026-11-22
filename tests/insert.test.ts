// The disposal insert: every line must come from materials.json, and the bin wording must follow curbside_recyclable.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { indexCatalog, resolveSetup, setupKey } from "../src/lib/catalog.ts";
import { loadData } from "../src/lib/data.ts";
import { buildDisposalCard, setupFromKey } from "../src/lib/insert/disposalCard.ts";
import type { Setup } from "../src/lib/types.ts";

const data = loadData();
const { components, materials } = data.catalog;
const index = indexCatalog(data.catalog);
const mat = (id: string) => materials.find((m) => m.id === id)!;

// The demo answer key's oversized setup: 12 x 10 x 8 box, foam peanuts, bubble wrap.
const oversized = components.find((c) => c.type === "box" && c.length_in === 12 && c.width_in === 10 && c.height_in === 8)!;
const peanuts = components.find((c) => c.type === "filler" && c.material === "eps-foam")!;
const bubble = components.find((c) => c.type === "wrap" && c.material === "pe-film")!;
const fitted = index.component("box-12oz-straight-jar-shipper")!;

const todaySetup: Setup = { outer_id: oversized.id, fill_id: peanuts.id, wrap_id: bubble.id, insert_id: null };
const jarLid = [
  { label: "Glass jar", material: "glass" },
  { label: "Metal lid", material: "steel" },
];

describe("disposal insert", () => {
  it("lists the box first, then what was inside it, then the product's own packaging", () => {
    const card = buildDisposalCard(resolveSetup(todaySetup, index)!, materials, jarLid);
    assert.deepEqual(
      card.lines.map((l) => l.part),
      ["Box", "Bubble wrap", "Foam packing peanuts", "Glass jar", "Metal lid"],
    );
    assert.deepEqual(card.unknown, []);
  });

  it("uses the materials.json sentence and curbside flag for every line", () => {
    const card = buildDisposalCard(resolveSetup(todaySetup, index)!, materials, jarLid);
    for (const l of card.lines) {
      assert.equal(l.text, mat(l.materialId).disposal_text);
      assert.equal(l.bin, mat(l.materialId).curbside_recyclable ? "curbside" : "not-curbside");
    }
    // Corrugated, glass and steel are curbside; foam peanuts and bubble wrap are not.
    assert.equal(card.curbsideCount, 3);
  });

  it("the fitted jar box is curbside recyclable end to end", () => {
    const card = buildDisposalCard(resolveSetup({ outer_id: fitted.id, fill_id: null, wrap_id: null, insert_id: null }, index)!, materials, jarLid);
    assert.equal(card.lines[0].part, "Box and its built-in insert");
    assert.equal(card.curbsideCount, card.lines.length);
  });

  it("flags a part whose material is not in the list instead of inventing an instruction", () => {
    const card = buildDisposalCard(resolveSetup(todaySetup, index)!, materials, [{ label: "Wick tab", material: "not-a-material" }]);
    assert.deepEqual(card.unknown, ["Wick tab"]);
    assert.ok(card.lines.every((l) => l.part !== "Wick tab"));
  });

  it("rebuilds a setup from its key, whatever order the ids are in", () => {
    const parts = setupFromKey(setupKey(todaySetup), components)!;
    assert.equal(parts.outer.id, oversized.id);
    assert.equal(parts.fill?.id, peanuts.id);
    assert.equal(parts.wrap?.id, bubble.id);
    assert.equal(setupFromKey(`${peanuts.id}+${oversized.id}`, components)?.outer.id, oversized.id);
  });

  it("rejects unknown ids and keys with no box or mailer", () => {
    assert.equal(setupFromKey("no-such-box", components), null);
    assert.equal(setupFromKey(peanuts.id, components), null);
    assert.equal(setupFromKey(`${oversized.id}+${fitted.id}`, components), null);
  });
});
