// Ship-from ZIP and USPS zones (getZone, estimateZone). The estimate is checked against real USPS
// zone charts for origins 972, 100 and 770 (tests/fixtures/usps-zone-charts.json, copied 2026-11-17).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { indexCatalog } from "../src/lib/catalog.ts";
import { loadData } from "../src/lib/data.ts";
import { evaluateSetup } from "../src/lib/planner/evaluateSetup.ts";
import { defaultInput, DEFAULT_SHIP_FROM_ZIP, shipFromZipOf, toContext, toProducts } from "../src/lib/planner/plannerInput.ts";
import { estimateZone } from "../src/lib/shipping/estimateZone.ts";
import { getZone, isValidZip, zip3Of, zoneMixFromStates } from "../src/lib/shipping/getZone.ts";
import { zoneShareFromStates } from "../src/lib/shipping/price.ts";
import type { ShippingRules } from "../src/lib/types.ts";

const readJson = (p: string) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const charts: Record<string, [string, string, number, string][]> = readJson("tests/fixtures/usps-zone-charts.json");
const centroids: Record<string, unknown> = readJson("data/rules/zip3-centroids.json");
const rules: ShippingRules = readJson("data/rules/shipping.json");

/** The USPS zone for one destination ZIP3 from a chart, or undefined if the chart does not list it. */
function chartZone(origin: string, zip3: string): number | undefined {
  for (const [from, to, zone] of charts[origin]) {
    if (from.length !== 3) continue; // ignore 5-digit entries such as 96700
    if (from <= zip3 && zip3 <= to) return zone;
  }
  return undefined;
}

describe("estimateZone against real USPS charts", () => {
  const MIN_EXACT: Record<string, number> = { "972": 0.97, "770": 0.97, "100": 0.93 };

  for (const origin of Object.keys(charts)) {
    it(`origin ${origin}: at least ${MIN_EXACT[origin] * 100}% exact and never more than 2 zones off`, () => {
      let compared = 0;
      let exact = 0;
      let worst = 0;
      for (const dest of Object.keys(centroids)) {
        const real = chartZone(origin, dest);
        if (real === undefined || real === 9) continue; // not in the chart, or Zone 9 (not modelled)
        const est = estimateZone(origin, dest);
        assert.ok(est, `no estimate for ${origin} to ${dest}`);
        compared++;
        if (est.zone === real) exact++;
        worst = Math.max(worst, Math.abs(est.zone - real));
      }
      assert.ok(compared > 500, `only compared ${compared} areas`);
      assert.ok(exact / compared >= MIN_EXACT[origin], `${origin}: ${((exact / compared) * 100).toFixed(1)}% exact of ${compared}`);
      assert.ok(worst <= 2, `${origin}: worst miss is ${worst} zones`);
    });
  }

  it("never returns Zone 9", () => {
    for (const dest of Object.keys(centroids)) assert.ok(estimateZone("770", dest)!.zone <= 8);
  });

  it("spot checks: 303 to 900 is Zone 8, 750 to 606 is Zone 5, 122 to 100 is Zone 2", () => {
    assert.equal(estimateZone("30303", "90001")!.zone, 8);
    assert.equal(estimateZone("75001", "60601")!.zone, 5);
    assert.equal(estimateZone("12207", "10001")!.zone, 2);
  });

  it("the same ZIP3 area is Zone 1, and unknown areas return null", () => {
    assert.equal(estimateZone("30303", "30399")!.zone, 1);
    assert.equal(estimateZone("30303", "00000"), null);
  });
});

describe("getZone", () => {
  it("origin 972 uses the exact USPS chart, by destination ZIP and by state", () => {
    const byZip = getZone("97201", { zip: "90001" }, rules);
    assert.deepEqual([byZip.zone, byZip.label], [chartZone("972", "900"), "exact"]);
    const byState = getZone("97201", { state: "OR" }, rules);
    assert.deepEqual([byState.zone, byState.label], [1, "exact"]);
    assert.equal(getZone("97201", { zip: "10001" }, rules).zone, 8);
  });

  it("every state from 972 matches the chart row stored in shipping.json (never the estimate)", () => {
    for (const [state, s] of Object.entries(rules.zones_from_origin!.states)) {
      const r = getZone("97201", { state }, rules);
      assert.equal(r.zone, s.zone === 9 ? 8 : s.zone, state);
      assert.equal(r.label, "exact");
    }
  });

  it("Zone 9 is priced as Zone 8 from Portland", () => {
    const r = getZone("97201", { zip: "96910" }, rules);
    assert.deepEqual([r.zone, r.label], [8, "exact"]);
  });

  it("any other origin is estimated, by ZIP or by the state's anchor ZIP3", () => {
    const r = getZone("30303", { zip: "90001" }, rules);
    assert.deepEqual([r.zone, r.label], [8, "estimated"]);
    assert.ok(r.miles && r.miles > 1800);
    const byState = getZone("30303", { state: "NY" }, rules);
    assert.deepEqual([byState.zone, byState.label], [5, "estimated"]);
  });

  it("a blank, short or unknown origin falls back to Zone 5, labelled assumed", () => {
    for (const origin of [undefined, "", "  ", "12", "00000"]) {
      const r = getZone(origin, { state: "NY" }, rules);
      assert.deepEqual([r.zone, r.label], [5, "assumed"], String(origin));
    }
  });

  it("an unknown destination falls back to Zone 5, labelled assumed", () => {
    assert.equal(getZone("30303", { state: "ZZ" }, rules).label, "assumed");
    assert.equal(getZone("97201", { state: "ZZ" }, rules).label, "assumed");
  });

  it("only the first three digits of a ZIP matter", () => {
    assert.equal(zip3Of("97201"), "972");
    assert.equal(zip3Of("972"), "972");
    assert.equal(zip3Of("97"), null);
    assert.equal(getZone("30301", { state: "CA" }, rules).zone, getZone("30399", { state: "CA" }, rules).zone);
  });

  it("validates a ZIP as exactly five digits", () => {
    assert.equal(isValidZip("30303"), true);
    for (const bad of ["3030", "303033", "3030a", "", "30 303"]) assert.equal(isValidZip(bad), false, bad);
  });
});

describe("zones for an order mix", () => {
  const mix = { OR: 0.25, CA: 0.25, TX: 0.25, NY: 0.25 };

  it("shares sum to 1; Portland is exact and any other origin is estimated", () => {
    for (const [origin, label] of [["97201", "exact"], ["30303", "estimated"], ["77001", "estimated"]] as const) {
      const z = zoneMixFromStates(mix, origin, rules)!;
      assert.equal(z.label, label, origin);
      assert.ok(Math.abs(Object.values(z.share).reduce((a, b) => a + b, 0) - 1) < 1e-9, origin);
    }
  });

  it("a blank or unusable origin gives no mix, so the caller assumes Zone 5", () => {
    assert.equal(zoneMixFromStates(mix, "", rules), null);
    assert.equal(zoneMixFromStates(mix, undefined, rules), null);
    assert.equal(zoneMixFromStates({ ZZ: 1 }, "30303", rules), null);
  });

  it("the older zoneShareFromStates still defaults to the Portland chart", () => {
    const z = zoneShareFromStates({ OR: 0.5, TX: 0.5 }, rules)!;
    assert.equal(z["1"], 0.5);
  });
});

describe("ship-from ZIP in the planner and the engine", () => {
  const data = loadData();
  const index = indexCatalog(data.catalog);
  const input = defaultInput(data);
  const products = toProducts(input);
  const FITTED = { outer_id: "box-12oz-straight-jar-shipper", fill_id: null, wrap_id: null, insert_id: null };
  const price = (patch: Partial<typeof input>) => evaluateSetup(products, FITTED, index, toContext({ ...input, ...patch }, data))!;

  it("Maya's example is preset to Portland and keeps the exact zones and the answer-key price", () => {
    assert.equal(input.shipFromZip, DEFAULT_SHIP_FROM_ZIP);
    assert.equal(zip3Of(DEFAULT_SHIP_FROM_ZIP), rules.zones_from_origin!.origin_zip3);
    const ev = price({});
    assert.equal(ev.zoneLabel, "exact");
    assert.ok(Math.abs(ev.shippingCost_usd - 9.9642) < 0.05);
  });

  it("saved answers from before this field existed still mean Portland", () => {
    const { shipFromZip, ...old } = input;
    void shipFromZip;
    assert.equal(shipFromZipOf(old as typeof input), DEFAULT_SHIP_FROM_ZIP);
  });

  it("an Atlanta seller gets estimated zones and a different price than Portland", () => {
    const atlanta = price({ shipFromZip: "30303" });
    assert.equal(atlanta.zoneLabel, "estimated");
    assert.notEqual(atlanta.shippingCost_usd.toFixed(2), price({}).shippingCost_usd.toFixed(2));
    assert.ok(atlanta.shippingCost_usd > 0);
  });

  it("a cleared ZIP prices every order as Zone 5 and says so", () => {
    const blank = price({ shipFromZip: "" });
    assert.equal(blank.zoneLabel, "assumed");
    assert.ok(Math.abs(blank.shippingCost_usd - 9.04) < 0.01); // fitted box, Zone 5 (answer key)
  });
});
