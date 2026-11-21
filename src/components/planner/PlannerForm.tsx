"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import type { AppData } from "@/lib/data";
import { defaultInput, validateInput, type PlannerInput } from "@/lib/planner/plannerInput";
import { loadPlannerInput, savePlannerInput } from "@/lib/planner/storage";

import { CurrentPackagingStep } from "./CurrentPackagingStep";
import { ProductStep } from "./ProductStep";
import { ShippingStep } from "./ShippingStep";

const STEPS = ["Products", "Shipping", "Today's packaging"];

export function PlannerForm({ data }: { data: AppData }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<PlannerInput>(() => defaultInput(data));
  const [showErrors, setShowErrors] = useState(false);

  // Pick up earlier answers after the page loads (localStorage is browser-only).
  useEffect(() => {
    const saved = loadPlannerInput();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from browser storage
    if (saved) setInput(saved);
  }, []);

  const patch = (p: Partial<PlannerInput>) => setInput((prev) => ({ ...prev, ...p }));
  const errors = validateInput(input);
  const last = step === STEPS.length - 1;

  const next = () => {
    if (!last) return setStep(step + 1);
    if (errors.length) return setShowErrors(true);
    savePlannerInput(input);
    router.push("/results");
  };

  return (
    <div>
      <Stepper steps={STEPS} current={step} onSelect={setStep} />

      {step === 0 && <ProductStep lines={input.lines} onChange={(lines) => patch({ lines })} />}
      {step === 1 && <ShippingStep data={data} input={input} onChange={patch} />}
      {step === 2 && <CurrentPackagingStep data={data} input={input} onChange={patch} />}

      {showErrors && errors.length > 0 && (
        <ul className="mt-6 space-y-1 rounded-sm border border-brick/40 bg-brick/5 p-4 text-sm text-brick" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        <Button onClick={next}>{last ? "See my options" : "Next"}</Button>
        <Button
          variant="ghost"
          className="ml-auto"
          onClick={() => {
            setInput(defaultInput(data));
            setStep(0);
            setShowErrors(false);
          }}
        >
          Reset to demo seller
        </Button>
      </div>
    </div>
  );
}
