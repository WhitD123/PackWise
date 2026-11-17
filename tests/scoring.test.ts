import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { dominates, paretoFilter, scaleLowerIsBetter, scoreOptions } from "../src/lib/scoring/fiveFactor.ts";
import type { FactorValues } from "../src/lib/types.ts";

const close = (actual: number, expected: number, tol = 0.05) =>
  assert.ok(Math.abs(actual - expected) <= tol, `expected ${expected}, got ${actual}`);

// Worked example from the project brief, section 13.
// Fees and carbon are equal for all three, so they do not change anything.
const A: FactorValues = { cost: 8.2, protection: "low", waste: 27, fees: 0, carbon: 0 };
const B: FactorValues = { cost: 8.4, protection: "medium", waste: 15, fees: 0, carbon: 0 };
const C: FactorValues = { cost: 8.6, protection: "high", waste: 9.5, fees: 0, carbon: 0 };
const example = [{ values: A }, { values: B }, { values: C }];

describe("brief section 13 worked example", () => {
  it("scales waste and cost", () => {
    const waste = scaleLowerIsBetter([27, 15, 9.5]);
    close(waste[0], 0);
    close(waste[1], 6.9);
    close(waste[2], 10);
    const cost = scaleLowerIsBetter([8.2, 8.4, 8.6]);
    close(cost[0], 10);
    close(cost[1], 5);
    close(cost[2], 0);
  });

  it("default weights: B wins narrowly", () => {
    const [a, b, c] = scoreOptions(example, { cost: 0.4, protection: 0.3, waste: 0.3 });
    close(a.score.overall, 4.6);
    close(b.score.overall, 5.9);
    close(c.score.overall, 5.7);
  });

  it("waste matters most: C wins", () => {
    const [a, b, c] = scoreOptions(example, { cost: 0.2, protection: 0.3, waste: 0.5 });
    close(a.score.overall, 2.6);
    // The brief says 6.3; the correct value is 1 + 1.8 + 3.43 = 6.23.
    close(b.score.overall, 6.23, 0.01);
    close(c.score.overall, 7.7);
  });
});

describe("edge cases", () => {
  it("gives everyone 10 when all options tie", () => {
    assert.deepEqual(scaleLowerIsBetter([3, 3, 3]), [10, 10, 10]);
  });

  it("handles a single option", () => {
    assert.deepEqual(scaleLowerIsBetter([5]), [10]);
  });
});

describe("Pareto filter", () => {
  it("keeps the three worked-example options (none beats another on everything)", () => {
    assert.equal(paretoFilter(example).length, 3);
  });

  it("drops an option that is worse on every factor", () => {
    const D: FactorValues = { cost: 9, protection: "low", waste: 30, fees: 1, carbon: 1 };
    assert.ok(dominates(A, D));
    const kept = paretoFilter([...example, { values: D }]);
    assert.equal(kept.length, 3);
  });

  it("keeps exact ties", () => {
    assert.equal(paretoFilter([{ values: A }, { values: { ...A } }]).length, 2);
  });
});
