"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PartsReview } from "@/components/scan/PartsReview";
import { PhotoDrop } from "@/components/scan/PhotoDrop";
import { Card } from "@/components/ui/Card";
import type { AppData } from "@/lib/data";
import { defaultInput } from "@/lib/planner/plannerInput";
import { loadPlannerInput, savePlannerInput } from "@/lib/planner/storage";
import type { ParsedScan, ScanSetup } from "@/lib/scan/parseScan";
import { resizeForScan } from "@/lib/scan/resizeImage";
import type { ScanResult } from "@/lib/scan/schema";

type State =
  | { step: "pick" }
  | { step: "scanning" }
  | { step: "review"; scan: ScanResult; parsed: ParsedScan };

export function ScanFlow({ data, samplePhotoUrl }: { data: AppData; samplePhotoUrl: string | null }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ step: "pick" });
  const [error, setError] = useState<string | null>(null);

  async function scan(photo: Blob) {
    setError(null);
    setState({ step: "scanning" });
    try {
      const resized = await resizeForScan(photo);
      const form = new FormData();
      form.append("image", resized, "photo.jpg");
      const res = await fetch("/api/scan", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "The scan failed.");
      setState({ step: "review", scan: json.scan, parsed: json.parsed });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The scan failed.");
      setState({ step: "pick" });
    }
  }

  async function useSample() {
    if (!samplePhotoUrl) return;
    try {
      const res = await fetch(samplePhotoUrl);
      if (!res.ok) throw new Error();
      await scan(await res.blob());
    } catch {
      setError("The example photo couldn't be loaded.");
    }
  }

  // The scan answers one planner question: "what do you ship in today?" Keep every other answer.
  function confirm(setup: ScanSetup) {
    const base = loadPlannerInput() ?? defaultInput(data);
    savePlannerInput({
      ...base,
      current: {
        outer_id: setup.outer_id ?? "",
        fill_id: setup.fill_id ?? "",
        wrap_id: setup.wrap_id ?? "",
        insert_id: setup.insert_id ?? "",
      },
    });
    router.push("/results");
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-sm border border-brick/40 bg-brick/5 p-3 text-sm text-brick">
          {error}
        </p>
      )}
      {state.step === "scanning" && <Card>Reading your photo… this takes a few seconds.</Card>}
      {state.step === "pick" && (
        <PhotoDrop busy={false} samplePhotoUrl={samplePhotoUrl} onPhoto={scan} onSample={useSample} />
      )}
      {state.step === "review" && (
        <PartsReview
          catalog={data.catalog}
          initial={state.scan.parts}
          notes={state.scan.notes}
          onConfirm={confirm}
          onStartOver={() => setState({ step: "pick" })}
        />
      )}
    </div>
  );
}
