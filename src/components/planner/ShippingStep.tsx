"use client";

import { useRef, useState } from "react";

import { Field, NumberInput, TextInput } from "@/components/ui/Field";
import type { AppData } from "@/lib/data";
import { OrderFileError, parseShopifyCsv } from "@/lib/orders/parseShopifyCsv";
import { ordersFromParsedFile, ordersFromSample, shipFromZipOf, zonesFor, type PlannerInput } from "@/lib/planner/plannerInput";
import { isValidZip, ZONE_LABEL_TEXT } from "@/lib/shipping/getZone";
import { Button } from "@/components/ui/Button";

/** A year of Shopify orders is a few megabytes; a cap keeps the browser responsive. */
const MAX_ORDER_FILE_BYTES = 25 * 1024 * 1024;

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
  const fileInput = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<{ summary: string; warnings: string[] } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // The file is read here in the browser and never sent anywhere.
  async function readOrderFile(file: File) {
    setUploadError(null);
    if (file.size > MAX_ORDER_FILE_BYTES) {
      setUpload(null);
      setUploadError("That file is over 25 MB. Export a shorter date range from Shopify.");
      return;
    }
    try {
      const result = ordersFromParsedFile(parseShopifyCsv(await file.text()), data);
      onChange(result.patch);
      setUpload({ summary: result.summary, warnings: result.warnings });
    } catch (e) {
      setUpload(null);
      setUploadError(
        e instanceof OrderFileError ? e.message : "We couldn't read that file. Export your orders from Shopify as a CSV and try again.",
      );
    }
  }

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
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label="Upload a Shopify orders CSV"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readOrderFile(f);
              e.target.value = "";
            }}
          />
          <Button onClick={() => fileInput.current?.click()}>Upload your Shopify orders</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setUpload(null);
              setUploadError(null);
              onChange(ordersFromSample(data));
            }}
          >
            Use the sample orders
          </Button>
        </div>
        <p className="mt-2 max-w-2xl text-xs text-muted">
          Fills in order volume, revenue and where orders go. In Shopify, open Orders, choose Export and pick a CSV. The
          file is read in your browser and is not uploaded. We read only order number, date, state, product, quantity and
          subtotal.
        </p>
        {input.ordersNote && <p className="mt-2 text-sm">Using: {input.ordersNote}.</p>}
        {upload && <p className="mt-1 text-sm text-muted">{upload.summary}</p>}
        {upload?.warnings.map((w) => (
          <p key={w} className="mt-1 text-sm text-ochre">
            {w}
          </p>
        ))}
        {uploadError && (
          <p role="alert" className="mt-2 text-sm text-brick">
            {uploadError}
          </p>
        )}
      </div>
    </div>
  );
}
