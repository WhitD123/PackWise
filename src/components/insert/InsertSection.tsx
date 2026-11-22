"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { Card, SectionHeading } from "@/components/ui/Card";
import { describeSetup } from "@/lib/catalog";
import { buildDisposalCard, type ExtraPart } from "@/lib/insert/disposalCard";
import type { EvaluatedSetup, Material } from "@/lib/types";

import { DisposalInsert } from "./DisposalInsert";

export interface InsertOption {
  title: string;
  setup: EvaluatedSetup;
}

/** Link to the print page for one setup; the shop name rides along only if the seller typed one. */
export function insertHref(key: string, shopName: string): string {
  const q = new URLSearchParams({ setup: key });
  if (shopName.trim()) q.set("shop", shopName.trim());
  return `/insert?${q.toString()}`;
}

/**
 * Results-page step: the seller picks which setup the card is for, adds their shop name, and sees the card as the
 * customer will. Printing happens on its own page so the sheet holds the card and nothing else.
 */
export function InsertSection({ options, materials, extras }: { options: InsertOption[]; materials: Material[]; extras: ExtraPart[] }) {
  // Several picks can be the same setup; offer each setup once, under its first title.
  const unique = useMemo(() => options.filter((o, i) => options.findIndex((p) => p.setup.key === o.setup.key) === i), [options]);
  const [key, setKey] = useState(unique[0]?.setup.key);
  const [shopName, setShopName] = useState("");
  const ids = useId();
  const chosen = unique.find((o) => o.setup.key === key) ?? unique[0];
  if (!chosen) return null;
  const card = buildDisposalCard(chosen.setup.parts, materials, extras);

  return (
    <section id="insert" className="scroll-mt-6">
      <SectionHeading
        title="Customer insert"
        lead="A small card for the box that tells your customer what to do with each part. Clear instructions help the right parts reach the recycling bin and keep the wrong ones out."
      />
      <Card>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,18rem)_1fr]">
          <div className="space-y-5">
            {unique.length > 1 && (
              <fieldset>
                <legend className="font-semibold">Make the card for</legend>
                <div className="mt-2 space-y-2">
                  {unique.map((o) => (
                    <label key={o.setup.key} className="flex cursor-pointer gap-2 text-sm">
                      <input
                        type="radio"
                        name={`${ids}-setup`}
                        value={o.setup.key}
                        checked={o.setup.key === chosen.setup.key}
                        onChange={() => setKey(o.setup.key)}
                        className="mt-1 accent-forest"
                      />
                      <span>
                        <span className="font-semibold">{o.title}</span>
                        <span className="block text-muted">{describeSetup(o.setup.parts)}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div>
              <label htmlFor={`${ids}-shop`} className="font-semibold">
                Your shop name <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id={`${ids}-shop`}
                type="text"
                value={shopName}
                maxLength={60}
                onChange={(e) => setShopName(e.target.value)}
                className="mt-1 w-full rounded-sm border border-line bg-paper px-3 py-2"
              />
            </div>
            <Link
              href={insertHref(chosen.setup.key, shopName)}
              className="inline-flex rounded-sm bg-forest px-4 py-2 text-sm font-semibold text-paper hover:bg-moss"
            >
              Open the printable card
            </Link>
            <p className="text-xs text-muted">
              Every instruction comes from our materials list. We say &ldquo;curbside recycling&rdquo; only for materials
              that most US homes can recycle at the curb, and the card asks customers to check their local rules. We
              don&rsquo;t print How2Recycle labels: those are licensed to member brands.
            </p>
          </div>
          <div>
            <DisposalInsert card={card} shopName={shopName} />
          </div>
        </div>
      </Card>
    </section>
  );
}
