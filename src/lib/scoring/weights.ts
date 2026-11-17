// How much each factor counts in the overall score. Placeholders until
// docs/scoring-spec.md sets the final presets. Each preset sums to 1.

import type { FactorKey, Weights } from "../types.ts";

export const FACTORS: FactorKey[] = ["cost", "protection", "waste", "fees", "carbon"];

export type PresetName = "balanced" | "cost" | "waste";

export const WEIGHT_PRESETS: Record<PresetName, Required<Weights>> = {
  balanced: { cost: 0.3, protection: 0.25, waste: 0.25, fees: 0.1, carbon: 0.1 },
  cost: { cost: 0.45, protection: 0.25, waste: 0.15, fees: 0.1, carbon: 0.05 },
  waste: { cost: 0.15, protection: 0.25, waste: 0.4, fees: 0.05, carbon: 0.15 },
};

export const PRESET_LABELS: Record<PresetName, string> = {
  balanced: "Balanced",
  cost: "Cost matters most",
  waste: "Waste matters most",
};
