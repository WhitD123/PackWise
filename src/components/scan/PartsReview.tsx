"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select, TextInput } from "@/components/ui/Field";
import { Warning } from "@/components/ui/Warning";
import { fillSetup, matchPart, type ScanSetup } from "@/lib/scan/parseScan";
import { PART_TYPES, type PartType, type ScanPart } from "@/lib/scan/schema";
import type { Catalog } from "@/lib/types";

interface Row {
  id: number;
  part: ScanPart;
  /** undefined = use the automatic match; null = no library item; string = the user's choice. */
  override: string | null | undefined;
}

const TYPE_LABELS: Record<PartType, string> = {
  box: "Box",
  mailer: "Mailer",
  filler: "Loose fill",
  wrap: "Wrap",
  insert: "Insert",
  product_packaging: "Product packaging (jar, lid)",
};

let nextId = 1;
const toRows = (parts: ScanPart[]): Row[] => parts.map((part) => ({ id: nextId++, part, override: undefined }));

export function PartsReview({
  catalog,
  initial,
  notes,
  onConfirm,
  onStartOver,
}: {
  catalog: Catalog;
  initial: ScanPart[];
  notes: string;
  onConfirm: (setup: ScanSetup) => void;
  onStartOver: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(initial));
  const patch = (id: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const patchPart = (id: number, p: Partial<ScanPart>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, part: { ...r.part, ...p }, override: undefined } : r)));

  // Re-match after every edit. The user's own choices win over the automatic match.
  const resolved = useMemo(() => {
    const matches = rows.map((r) => {
      const auto = matchPart(r.part, catalog);
      if (r.override === undefined) return auto;
      return { ...auto, component_id: r.override, ambiguous: false, reason: r.override ? "Your choice." : "Not in our library." };
    });
    return fillSetup(matches, catalog);
  }, [rows, catalog]);

  const optionsFor = (type: PartType) =>
    catalog.components.filter((c) => c.type === type).map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-muted">
        This is what we think we see. Fix anything that&rsquo;s wrong, then continue. Parts marked &ldquo;Check this&rdquo;
        are the ones we were least sure about.
      </p>
      {notes && <p className="text-sm text-bark">Note from the scan: {notes}</p>}

      <div className="space-y-4">
        {rows.map((r, i) => {
          const m = resolved.matches[i];
          const isProduct = r.part.type === "product_packaging";
          const check = !isProduct && (m.ambiguous || r.part.confidence === "low");
          return (
            <Card key={r.id}>
              <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold">Part</span>
                  <TextInput value={r.part.part_name} onChange={(v) => patchPart(r.id, { part_name: v })} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold">Kind</span>
                  <Select<PartType>
                    value={r.part.type}
                    onChange={(v) => patchPart(r.id, { type: v })}
                    options={PART_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold">Material</span>
                  <Select
                    value={r.part.material}
                    onChange={(v) => patchPart(r.id, { material: v as ScanPart["material"] })}
                    options={catalog.materials.map((mat) => ({ value: mat.id, label: mat.name }))}
                  />
                </label>
              </div>

              {!isProduct && (
                <label className="mt-3 block text-sm">
                  <span className="mb-1 block font-semibold">Library item</span>
                  <Select
                    value={m.component_id ?? ""}
                    onChange={(v) => patch(r.id, { override: v === "" ? null : v })}
                    options={[{ value: "", label: "Not in our library" }, ...optionsFor(r.part.type)]}
                  />
                </label>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="flex flex-wrap items-center gap-2 text-muted">
                  {check && <Badge tone="ochre">Check this</Badge>}
                  {m.reason}
                </span>
                <Button variant="ghost" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}>
                  Remove
                </Button>
              </div>
            </Card>
          );
        })}
        {rows.length === 0 && <Card>No packaging parts were found. Add one below, or start over with another photo.</Card>}
      </div>

      <Button
        variant="secondary"
        onClick={() =>
          setRows((rs) => [
            ...rs,
            ...toRows([{ part_name: "Corrugated box", type: "box", material: "corrugated", approx_dims_in: null, confidence: "medium" }]),
          ])
        }
      >
        Add a part
      </Button>

      {resolved.warnings.length > 0 && (
        <div className="space-y-2">
          {resolved.warnings.map((w) => (
            <Warning key={w}>{w}</Warning>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button onClick={() => onConfirm(resolved.setup)} disabled={resolved.setup.outer_id === null}>
          Use this packaging
        </Button>
        <Button variant="ghost" onClick={onStartOver}>
          Scan a different photo
        </Button>
      </div>
    </div>
  );
}
