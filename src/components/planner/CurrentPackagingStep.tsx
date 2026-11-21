"use client";

import { Field, Select } from "@/components/ui/Field";
import type { AppData } from "@/lib/data";
import type { PlannerInput } from "@/lib/planner/plannerInput";
import { PRESET_LABELS, type PresetName } from "@/lib/scoring/weights";
import type { ComponentType } from "@/lib/types";

export function CurrentPackagingStep({
  data,
  input,
  onChange,
}: {
  data: AppData;
  input: PlannerInput;
  onChange: (patch: Partial<PlannerInput>) => void;
}) {
  const list = (...types: ComponentType[]) =>
    data.catalog.components.filter((c) => types.includes(c.type)).map((c) => ({ value: c.id, label: c.name }));
  const setCurrent = (patch: Partial<PlannerInput["current"]>) => onChange({ current: { ...input.current, ...patch } });

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-muted">
        What do you ship in today? This is what we compare against for right-sizing and swaps. Skip it to see
        only the recommended options.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Box or mailer">
          <Select
            value={input.current.outer_id}
            onChange={(outer_id) => setCurrent({ outer_id })}
            options={[{ value: "", label: "I'm not sure / skip" }, ...list("box", "mailer")]}
          />
        </Field>
        <Field label="Wrap around the product">
          <Select
            value={input.current.wrap_id}
            onChange={(wrap_id) => setCurrent({ wrap_id })}
            options={[{ value: "", label: "None" }, ...list("wrap")]}
          />
        </Field>
        <Field label="Loose fill" hint="Boxes only">
          <Select
            value={input.current.fill_id}
            onChange={(fill_id) => setCurrent({ fill_id })}
            options={[{ value: "", label: "None" }, ...list("filler")]}
          />
        </Field>
        <Field label="Insert">
          <Select
            value={input.current.insert_id}
            onChange={(insert_id) => setCurrent({ insert_id })}
            options={[{ value: "", label: "None" }, ...list("insert")]}
          />
        </Field>
      </div>

      <div>
        <h2 className="mb-3 text-lg text-forest">What matters most?</h2>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(PRESET_LABELS) as PresetName[]).map((p) => (
            <label
              key={p}
              className={`cursor-pointer rounded-sm border px-4 py-2 text-sm ${
                input.priority === p ? "border-forest bg-forest text-paper" : "border-line bg-surface hover:border-forest"
              }`}
            >
              <input
                type="radio"
                name="priority"
                value={p}
                className="sr-only"
                checked={input.priority === p}
                onChange={() => onChange({ priority: p })}
              />
              {PRESET_LABELS[p]}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
