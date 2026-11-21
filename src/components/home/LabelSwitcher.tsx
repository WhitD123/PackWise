"use client";

import { useState } from "react";

import { FiveFactorLabel } from "@/components/label/FiveFactorLabel";
import type { ScoredSetup } from "@/lib/types";

/** The same Packaging Facts label for two setups, one tap apart, so a beginner sees what changes. */
export function LabelSwitcher({ today, better }: { today: ScoredSetup; better: ScoredSetup }) {
  const [show, setShow] = useState<"today" | "better">("today");
  const options = [
    { id: "today" as const, label: "Today's box" },
    { id: "better" as const, label: "The better box" },
  ];
  return (
    <div>
      <div role="group" aria-label="Show the label for" className="mb-3 inline-flex border border-forest">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={show === o.id}
            onClick={() => setShow(o.id)}
            className={`px-3 py-1.5 text-sm font-medium ${show === o.id ? "bg-forest text-paper" : "text-forest hover:bg-forest/10"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div key={show} className="pw-fade">
        <FiveFactorLabel option={show === "today" ? today : better} />
      </div>
    </div>
  );
}
