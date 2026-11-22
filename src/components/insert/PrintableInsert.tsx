"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AppData } from "@/lib/data";
import { buildDisposalCard, setupFromKey, type ExtraPart } from "@/lib/insert/disposalCard";
import { defaultInput, productPackagingOf } from "@/lib/planner/plannerInput";
import { loadPlannerInput } from "@/lib/planner/storage";

import { DisposalInsert } from "./DisposalInsert";

/** The card on its own page. Printing hides the site header, footer and these controls, so the sheet is just the card. */
export function PrintableInsert({ data, setupKey, shopName }: { data: AppData; setupKey: string; shopName: string }) {
  const [extras, setExtras] = useState<ExtraPart[] | null>(null);

  useEffect(() => {
    // The product's own packaging (the demo candle's jar and lid) comes from the planner answers in this browser.
    const input = loadPlannerInput() ?? defaultInput(data);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read from browser storage
    setExtras(productPackagingOf(input).map((p) => ({ label: p.label, material: p.material })));
  }, [data]);

  const parts = setupFromKey(setupKey, data.catalog.components);
  if (!parts) {
    return (
      <Card>
        <p className="mb-4">We couldn&rsquo;t find that packaging setup. Make a card from your results page.</p>
        <ButtonLink href="/results#insert">Back to your results</ButtonLink>
      </Card>
    );
  }
  if (!extras) return <p className="text-muted">Preparing your card…</p>;

  const card = buildDisposalCard(parts, data.catalog.materials, extras);
  return (
    <div className="space-y-8">
      <div className="print:hidden">
        <h1 className="text-4xl font-semibold text-forest">Your customer insert</h1>
        <p className="mt-2 max-w-2xl text-lg text-muted">
          Print it, cut along the green border, and put one in each box. It prints about 6 inches wide, the size of a
          postcard.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button onClick={() => window.print()}>Print the card</Button>
          <Link href="/results#insert" className="font-semibold text-forest underline underline-offset-4">
            Back to your results
          </Link>
        </div>
      </div>
      <DisposalInsert card={card} shopName={shopName} />
    </div>
  );
}
