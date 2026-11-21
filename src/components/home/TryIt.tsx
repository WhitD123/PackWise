"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CartonCompare } from "@/components/home/CartonCompare";
import { Button } from "@/components/ui/Button";
import { Term } from "@/components/ui/Term";
import { Warning } from "@/components/ui/Warning";
import { describeSetup } from "@/lib/catalog";
import type { AppData } from "@/lib/data";
import { grams, pounds, usd, usdWhole } from "@/lib/format";
import { DEFAULT_SHIP_FROM_ZIP } from "@/lib/planner/plannerInput";
import { savePlannerInput } from "@/lib/planner/storage";
import { isValidZip } from "@/lib/shipping/getZone";
import { PACKAGING_PRESETS, QUICK_PRODUCTS, quickEstimate, quickInput } from "@/lib/tryit/quickEstimate";

/** The engine runs at this volume; yearly figures scale linearly with orders, so the slider only rescales them. */
const BASE_PER_MONTH = 1000;
const pct = (x: number | undefined) => (x === undefined ? "n/a" : `${Math.round(x * 100)}%`);

export function TryIt({ data }: { data: AppData }) {
  const router = useRouter();
  const [productId, setProductId] = useState("candle-12oz");
  const [presetId, setPresetId] = useState("big-box-foam");
  const [perMonth, setPerMonth] = useState(500);
  const [zip, setZip] = useState(DEFAULT_SHIP_FROM_ZIP);
  const origin = isValidZip(zip) ? zip : DEFAULT_SHIP_FROM_ZIP;
  const product = QUICK_PRODUCTS.find((p) => p.id === productId)!;

  // Which of today's setups this product fits in (the others are shown, but disabled).
  const fits = useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const p of PACKAGING_PRESETS) out[p.id] = quickEstimate(data, quickInput(data, productId, p.id, BASE_PER_MONTH, origin)).status === "ok";
    return out;
  }, [data, productId, origin]);
  const activePreset = fits[presetId] ? presetId : (PACKAGING_PRESETS.find((p) => fits[p.id])?.id ?? presetId);

  const estimate = useMemo(
    () => quickEstimate(data, quickInput(data, productId, activePreset, BASE_PER_MONTH, origin)),
    [data, productId, activePreset, origin],
  );
  const scale = perMonth / BASE_PER_MONTH;

  function carryOn(to: "/results" | "/planner") {
    savePlannerInput(quickInput(data, productId, activePreset, perMonth, origin));
    router.push(to);
  }

  return (
    <div className="border border-ink bg-surface p-5 sm:p-6">
      <h2 className="text-2xl font-bold text-forest">Try it on your own shop</h2>
      <p className="mt-1 text-sm text-muted">Three choices. The numbers update as you change them.</p>

      <fieldset className="mt-5">
        <legend className="mb-2 font-semibold">What do you sell?</legend>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRODUCTS.map((p) => (
            <label key={p.id} className="cursor-pointer">
              <input
                type="radio"
                name="product"
                value={p.id}
                checked={productId === p.id}
                onChange={() => setProductId(p.id)}
                className="peer sr-only"
              />
              <span className="block rounded-sm border border-forest px-3 py-1.5 text-sm text-forest peer-checked:bg-forest peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest hover:bg-forest/10 peer-checked:hover:bg-forest">
                {p.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="mb-2 font-semibold">How do you pack it today?</legend>
        <div className="grid gap-1.5">
          {PACKAGING_PRESETS.map((p) => (
            <label
              key={p.id}
              className={`flex items-center gap-2.5 text-sm ${fits[p.id] ? "cursor-pointer" : "cursor-not-allowed text-muted"}`}
            >
              <input
                type="radio"
                name="packaging"
                value={p.id}
                checked={activePreset === p.id}
                disabled={!fits[p.id]}
                onChange={() => setPresetId(p.id)}
                className="h-4 w-4 accent-[var(--forest)]"
              />
              <span>
                {p.label}
                {!fits[p.id] && ` (too small for a ${product.name.toLowerCase()})`}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor="per-month" className="flex items-baseline justify-between font-semibold">
          <span>Orders a month</span>
          <span className="tabular font-serif text-xl text-forest">{perMonth.toLocaleString("en-US")}</span>
        </label>
        <input
          id="per-month"
          type="range"
          min={25}
          max={5000}
          step={25}
          value={perMonth}
          onChange={(e) => setPerMonth(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--forest)]"
        />
      </div>

      <div aria-live="polite" className="mt-6 border-t border-ink pt-5">
        {estimate.status === "no-fit" ? (
          <p>That packaging does not fit this product. Pick another way to pack it.</p>
        ) : (
          <>
            {!estimate.currentMeetsMinimum && (
              <Warning className="mb-4">
                That packaging gives a {product.name.toLowerCase()} less <Term id="protection">protection</Term> than it
                needs. The better option below protects it properly, even where it costs more.
              </Warning>
            )}
            {estimate.best ? (
              <>
                <div key={`${productId}-${activePreset}`} className="pw-fade">
                  <CartonCompare today={estimate.current} swap={estimate.best.option} look={product.look} />
                </div>
                <p className="mt-3 text-sm">
                  <span className="font-semibold text-forest">Better: </span>
                  {describeSetup(estimate.best.option.parts)}
                  {estimate.best.option.parts.outer.has_fitted_insert && (
                    <>
                      , a <Term id="fitted-box">box made for this product</Term>
                    </>
                  )}
                  .
                </p>
                <table className="mt-3 w-full text-sm">
                  <caption className="sr-only">Today compared with the better setup, per order</caption>
                  <thead>
                    <tr className="border-b border-ink text-left">
                      <th className="py-1.5 pr-2 font-semibold">Per order</th>
                      <th className="py-1.5 pr-2 font-semibold">Today</th>
                      <th className="py-1.5 font-semibold">Better</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [<Term key="e" id="empty-space" />, pct(estimate.current.emptySpaceRatio), pct(estimate.best.option.emptySpaceRatio)],
                      ["Plastic", grams(estimate.current.plasticWeight_g), grams(estimate.best.option.plasticWeight_g)],
                      [
                        <Term key="l" id="landfill-waste" />,
                        grams(estimate.current.values.waste),
                        grams(estimate.best.option.values.waste),
                      ],
                      ["Shipping", usd(estimate.current.shippingCost_usd), usd(estimate.best.option.shippingCost_usd)],
                      ["Packaging", usd(estimate.current.packagingCost_usd), usd(estimate.best.option.packagingCost_usd)],
                    ].map(([label, a, b], i) => (
                      <tr key={i} className="border-b border-line">
                        <th scope="row" className="py-1.5 pr-2 text-left font-normal text-muted">
                          {label}
                        </th>
                        <td className="py-1.5 pr-2">{a}</td>
                        <td className="py-1.5 font-semibold text-forest">{b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-4 text-base">
                  At {perMonth.toLocaleString("en-US")} orders a month, switching{" "}
                  <strong>
                    {estimate.best.usd_saved_per_year >= 0
                      ? `saves about ${usdWhole(estimate.best.usd_saved_per_year * scale)}`
                      : `costs about ${usdWhole(-estimate.best.usd_saved_per_year * scale)} more`}
                  </strong>{" "}
                  a year and uses <strong>{pounds(estimate.best.plastic_avoided_lb_per_year * scale)} less plastic</strong>.
                </p>
              </>
            ) : (
              <>
                <CartonCompare today={estimate.current} look={product.look} />
                <p className="mt-3">
                  That is already as good as anything in our library for this product. The full results show how it scores.
                </p>
              </>
            )}
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={() => carryOn("/results")} disabled={estimate.status !== "ok"}>
          See my full results
        </Button>
        <Button variant="secondary" onClick={() => carryOn("/planner")}>
          Fine-tune in the planner
        </Button>
      </div>

      <p className="mt-4 text-xs text-muted">
        An estimate. Ships from ZIP{" "}
        <input
          aria-label="Ship-from ZIP code"
          inputMode="numeric"
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
          className="w-[4.5rem] border-b border-ink bg-transparent px-1 text-ink"
        />{" "}
        {!isValidZip(zip) && "(using Portland until the ZIP has five digits) "}
        by USPS Ground Advantage, to where people live in the US (Census population). Product sizes are typical examples.{" "}
        <Link href="/how-it-works" className="underline underline-offset-2">
          How we calculate this
        </Link>
      </p>
    </div>
  );
}
