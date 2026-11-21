"use client";

import { Field, NumberInput, TextInput } from "@/components/ui/Field";
import type { AppData } from "@/lib/data";
import { ordersFromSample, shipFromZipOf, zonesFor, type PlannerInput } from "@/lib/planner/plannerInput";
import { isValidZip, ZONE_LABEL_TEXT } from "@/lib/shipping/getZone";
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
  const zip = shipFromZipOf(input);
  const zoneLabel = zonesFor(input, data)?.label ?? "assumed";
  // A bad ZIP never blocks the flow: it just means zones are assumed until it is fixed.
  const zipProblem = zip !== "" && !isValidZip(zip) ? "Use a five-digit ZIP code, like 30303." : null;
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
        <Field
          label="Ship-from ZIP code"
          hint={zipProblem ?? "Optional. We use the first three digits to work out USPS shipping zones."}
        >
          <TextInput value={zip} onChange={(v) => onChange({ shipFromZip: v.replace(/\D/g, "").slice(0, 5) })} />
        </Field>
      </div>
      <div className="text-sm">
        <span className="mb-1 block font-semibold">Shipping</span>
        <p className="max-w-2xl text-muted">
          Prices are {s.carrier} {s.service} (commercial rates).{" "}
          {!input.orderStatePercent
            ? "No order mix yet, so every order is priced as Zone 5 (assumed). Load the sample orders to price by where orders go."
            : zoneLabel === "assumed"
              ? `${ZONE_LABEL_TEXT.assumed}. Every order is priced as Zone 5.`
              : `${ZONE_LABEL_TEXT[zoneLabel]}. Zones are measured from ZIP ${zip.slice(0, 3)} to where your orders go.`}{" "}
          Shipping estimates cover the 50 states and DC, USPS Ground Advantage only.
        </p>
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
