"use client";

import { Field, NumberInput } from "@/components/ui/Field";
import type { AppData } from "@/lib/data";
import { ordersFromSample, type PlannerInput } from "@/lib/planner/plannerInput";
import { Button } from "@/components/ui/Button";

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
            Prices are {s.carrier} {s.service} (commercial rates).{" "}
            {input.orderStatePercent
              ? `Zones are measured from Portland, OR (ZIP ${s.zones_from_origin?.origin_zip3}) to where your orders go.`
              : "No order mix yet, so every order is priced as Zone 5. Load the sample orders for exact zones."}
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
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => onChange(ordersFromSample(data))}>
            Use the sample orders
          </Button>
          <span className="text-xs text-muted">
            {data.sampleOrders.label}. Fills in order volume, revenue and where orders go. A Shopify export upload is
            coming.
          </span>
        </div>
      </div>
    </div>
  );
}
