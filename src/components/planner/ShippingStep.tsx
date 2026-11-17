"use client";

import { Field, NumberInput } from "@/components/ui/Field";
import type { AppData } from "@/lib/data";
import type { PlannerInput } from "@/lib/planner/plannerInput";

const STATE_NAMES: Record<string, string> = {
  OR: "Oregon",
  CO: "Colorado",
  CA: "California",
  ME: "Maine",
  MN: "Minnesota",
  MD: "Maryland",
  WA: "Washington",
};

export function ShippingStep({
  data,
  input,
  onChange,
}: {
  data: AppData;
  input: PlannerInput;
  onChange: (patch: Partial<PlannerInput>) => void;
}) {
  const s = data.shipping;
  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-muted">
        How much you ship and where. Order volume turns per-order savings into yearly numbers. State shares
        drive packaging fees in states with packaging laws.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Orders per year">
          <NumberInput value={input.ordersPerYear} step={1} onChange={(ordersPerYear) => onChange({ ordersPerYear })} />
        </Field>
        <div className="text-sm">
          <span className="mb-1 block font-semibold">Shipping</span>
          <p className="text-muted">
            Costs assume {s.carrier} {s.service}, {s.zone_assumption}.
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg text-forest">Share of orders shipped to states with packaging fees</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.feeSchedules.map((f) => (
            <Field key={f.state} label={STATE_NAMES[f.state] ?? f.state} hint={`${f.program_year} rates, ${f.status}`}>
              <NumberInput
                value={input.statePercent[f.state] ?? 0}
                onChange={(pct) => onChange({ statePercent: { ...input.statePercent, [f.state]: pct } })}
                suffix="%"
              />
            </Field>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Tip: a Shopify orders export will fill this in automatically (coming soon).</p>
      </div>
    </div>
  );
}
