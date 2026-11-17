// Saves the planner answers in the browser so the results page can read them.
// No accounts: the brief says browser storage covers the demo.

import type { PlannerInput } from "./plannerInput.ts";

// v2: the shape changed to match docs/data-format.md; v1 answers are ignored.
const KEY = "packwise.planner.v2";

export function savePlannerInput(input: PlannerInput): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(input));
  } catch {
    // Private mode or storage blocked: results fall back to the demo seller.
  }
}

export function loadPlannerInput(): PlannerInput | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PlannerInput) : null;
  } catch {
    return null;
  }
}
