"use client";

import { Button } from "@/components/ui/Button";
import { Field, NumberInput, Select, TextInput } from "@/components/ui/Field";
import { EXAMPLE_PRODUCTS } from "@/lib/planner/examples";
import { lineFromExample, type ProductLineInput } from "@/lib/planner/plannerInput";
import type { Fragility } from "@/lib/types";

const FRAGILITY: { value: Fragility; label: string }[] = [
  { value: "low", label: "Sturdy (clothing, books, soap)" },
  { value: "medium", label: "Some care (electronics, cosmetics)" },
  { value: "high", label: "Fragile (glass, ceramic)" },
];

export function ProductStep({
  lines,
  onChange,
}: {
  lines: ProductLineInput[];
  onChange: (lines: ProductLineInput[]) => void;
}) {
  const update = (i: number, patch: Partial<ProductLineInput>) =>
    onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-muted">
        What goes into one typical order? Start from an example or enter your own sizes. Add a line for each
        different product in the box.
      </p>

      {lines.map((l, i) => (
        <fieldset key={l.key} className="rounded-sm border border-line bg-surface p-5">
          <legend className="px-1 font-serif text-lg text-forest">Product {i + 1}</legend>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Field label="Name">
                <TextInput value={l.name} onChange={(name) => update(i, { name })} />
              </Field>
            </div>
            <Field label="How fragile?">
              <Select value={l.fragility} onChange={(fragility) => update(i, { fragility })} options={FRAGILITY} />
            </Field>
            <Field label="Items per order">
              <NumberInput
                value={l.items_per_order}
                min={1}
                step={1}
                onChange={(items_per_order) => update(i, { items_per_order })}
              />
            </Field>
            <Field label="Length">
              <NumberInput value={l.length_in} onChange={(length_in) => update(i, { length_in })} suffix="in" />
            </Field>
            <Field label="Width">
              <NumberInput value={l.width_in} onChange={(width_in) => update(i, { width_in })} suffix="in" />
            </Field>
            <Field label="Height">
              <NumberInput value={l.height_in} onChange={(height_in) => update(i, { height_in })} suffix="in" />
            </Field>
            <Field label="Weight">
              <NumberInput value={l.weight_oz} onChange={(weight_oz) => update(i, { weight_oz })} suffix="oz" />
            </Field>
          </div>
          {lines.length > 1 && (
            <Button variant="ghost" className="mt-3 px-0" onClick={() => onChange(lines.filter((_, j) => j !== i))}>
              Remove this product
            </Button>
          )}
        </fieldset>
      ))}

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Add an example product">
          <Select
            value=""
            onChange={(id) => {
              const p = EXAMPLE_PRODUCTS.find((x) => x.id === id);
              if (p) onChange([...lines, lineFromExample(p, `${p.id}-${Date.now()}`)]);
            }}
            options={[{ value: "", label: "Choose..." }, ...EXAMPLE_PRODUCTS.map((p) => ({ value: p.id, label: p.name }))]}
          />
        </Field>
        <Button
          variant="secondary"
          onClick={() =>
            onChange([
              ...lines,
              {
                key: `custom-${Date.now()}`,
                name: "My product",
                length_in: NaN,
                width_in: NaN,
                height_in: NaN,
                weight_oz: NaN,
                fragility: "low",
                items_per_order: 1,
              },
            ])
          }
        >
          Add a blank product
        </Button>
      </div>
    </div>
  );
}
