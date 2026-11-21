// How much each factor counts in the overall score (docs/scoring-spec.md section 5).
// Protection is a minimum requirement, not a weight, so its weight is 0.
// The four weights in each preset sum to 1.

import type { FactorKey, Weights } from "../types.ts";

export const FACTORS: FactorKey[] = ["cost", "protection", "waste", "fees", "carbon"];

/** "balanced" is the spec's Default preset; the key stays so the UI keeps working. */
export type PresetName = "balanced" | "cost" | "waste";

export const WEIGHT_PRESETS: Record<PresetName, Required<Weights>> = {
  balanced: { waste: 0.35, cost: 0.35, carbon: 0.15, fees: 0.15, protection: 0 },
  cost: { waste: 0.2, cost: 0.55, carbon: 0.1, fees: 0.15, protection: 0 },
  waste: { waste: 0.5, cost: 0.2, carbon: 0.2, fees: 0.1, protection: 0 },
};

export const PRESET_LABELS: Record<PresetName, string> = {
  balanced: "Default",
  cost: "Cost matters most",
  waste: "Waste matters most",
};
