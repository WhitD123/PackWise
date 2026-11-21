// Landing page. Every number on it is read from the data files or computed by the engine for the demo
// seller (a 12 oz candle, one order from the sample file), never typed in.

import Link from "next/link";

import { CartonCompare } from "@/components/home/CartonCompare";
import { FiveFactorLabel } from "@/components/label/FiveFactorLabel";
import { ButtonLink } from "@/components/ui/Button";
import { loadData } from "@/lib/data";
import { dims, grams, usd } from "@/lib/format";
import { buildWorkedExample } from "@/lib/method/workedExample";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const list = (items: string[]) => new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(items);

const LABEL_ROWS: [string, string][] = [
  ["Landfill waste", "Grams of packaging likely to end up in a landfill, based on how much of each material actually gets recycled."],
  ["Cost", "Packaging plus USPS shipping, per order."],
  ["Protection", "Whether the setup protects the product, from its fragility, the cushioning and the box strength. Fragile glass needs High."],
  ["State fees", "What the packaging would cost each year in states that charge producers, or $0 if you are exempt."],
  ["Carbon", "Greenhouse gases from making the packaging and from disposing of it."],
];

const STEPS: [string, string][] = [
  ["Describe your product, or photograph a packed order.", "We read the box, the filler and the wrap from the photo. You correct anything we got wrong."],
  ["See how today's setup scores.", "Cost, protection, waste, state fees and carbon for what you ship now."],
  ["Compare better setups.", "Each one shows the dollars saved, the plastic avoided and what it costs you."],
  ["Check the state laws.", "Which states you are covered in and what the fees would be, before and after a swap."],
  ["See the yearly impact.", "The formula is on the screen, with the sources behind it."],
];

export default function Home() {
  const data = loadData();
  const ex = buildWorkedExample(data);
  const feeStates = data.coverageRules.filter((r) => r.law_status === "fees_active" || r.law_status === "fees_upcoming");
  const withRates = feeStates.filter((r) => r.fee_file && data.coverageSchedules[r.fee_file]);
  const named = (status: string) => data.coverageRules.filter((r) => r.law_status === status).map((r) => r.name);
  const lawCount = data.coverageRules.filter((r) => r.law_status !== "none").length;
  const rateRows = ["corrugated", "eps-foam", "pe-film"].map((id) => data.catalog.materials.find((m) => m.id === id)!);
  const rate = (file: string, material: string) => {
    const r = data.coverageSchedules[file]?.rates[material];
    return r ? `${r.rate_usd_per_lb < 0 ? "-" : ""}$${Math.abs(r.rate_usd_per_lb).toFixed(2)}` : "no rate found";
  };

  const today = ex?.today.evaluated;
  const swap = ex?.swap.evaluated;
  const name = ex?.input.lines[0].name;

  return (
    <div className="space-y-24">
      <section className="border-2 border-forest bg-kraft p-6 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div>
            <h1 className="max-w-xl text-4xl font-bold text-forest sm:text-5xl">
              {today && name
                ? `A ${name} ships in a box that is ${pct(today.emptySpaceRatio ?? 0)} empty.`
                : "Pick packaging before it becomes waste."}
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink">
              {today
                ? `The air is packed with foam peanuts and bubble wrap, and most of the packaging (${pct(today.values.waste / today.packagingWeight_g)} by weight) is likely to end up in a landfill. `
                : ""}
              Packwise scores your packaging on cost, protection, waste, state fees and carbon, then shows a better setup
              and what it saves.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/planner">Plan your packaging</ButtonLink>
              <ButtonLink href="/results" variant="secondary">
                See the demo seller&rsquo;s results
              </ButtonLink>
            </div>
          </div>

          {today && swap && (
            <div className="border border-ink bg-surface p-5">
              <p className="mb-4 text-sm text-muted">Per order, from the sample order file. Cartons drawn to the same scale.</p>
              <CartonCompare today={today} swap={swap} />
              <table className="mt-5 w-full text-sm">
                <caption className="sr-only">Today&rsquo;s packaging compared with the right-sized setup</caption>
                <thead>
                  <tr className="border-b border-ink text-left">
                    <th className="py-1.5 pr-3 font-semibold">
                      <span className="sr-only">Measure</span>
                    </th>
                    <th className="py-1.5 pr-3 font-semibold">Today</th>
                    <th className="py-1.5 font-semibold">Right-sized</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Ships at", dims(today.shippedDims), dims(swap.shippedDims)],
                    ["Empty space", pct(today.emptySpaceRatio ?? 0), pct(swap.emptySpaceRatio ?? 0)],
                    ["Plastic", grams(today.plasticWeight_g), grams(swap.plasticWeight_g)],
                    ["Shipping", usd(today.shippingCost_usd), usd(swap.shippingCost_usd)],
                  ].map(([label, a, b]) => (
                    <tr key={label} className="border-b border-line">
                      <th scope="row" className="py-1.5 pr-3 text-left font-normal text-muted">
                        {label}
                      </th>
                      <td className="py-1.5 pr-3">{a}</td>
                      <td className="py-1.5 font-semibold text-forest">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted">
                Right-sized is a box made for this jar, so it needs no foam or wrap. Shipping is averaged over where the
                sample orders go.{" "}
                <Link href="/how-it-works#example" className="underline underline-offset-2">
                  How we calculate this
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>

      {ex && (
        <section className="grid gap-12 lg:grid-cols-[24rem_1fr] lg:items-start">
          <FiveFactorLabel option={ex.swapScored} />
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold text-forest">Every setup gets a Packaging Facts label</h2>
            <p className="mt-3">
              Like the label on food: one card, the numbers that matter. This one is for the right-sized box above. Scores
              compare the options for the same product, so a 10 means the best of the setups we tried.
            </p>
            <dl className="mt-6 divide-y divide-line border-y border-line">
              {LABEL_ROWS.map(([term, text]) => (
                <div key={term} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                  <dt className="font-semibold text-forest">{term}</dt>
                  <dd className="text-base">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      <section className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="max-w-sm text-3xl font-bold text-forest">From your orders to an answer</h2>
          <p className="mt-3 max-w-sm text-muted">
            Start with a sample order file, or upload your own Shopify export. Nothing is saved on a server.
          </p>
        </div>
        <ol className="space-y-6 border-l-2 border-forest pl-6">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[2.2rem] top-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-forest bg-paper font-serif text-sm font-bold text-forest"
              >
                {i + 1}
              </span>
              <h3 className="text-xl font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-3xl">
        <h2 className="text-3xl font-bold text-forest">The cheap plastic option is starting to cost more</h2>
        <p className="mt-3">
          {lawCount} states now have packaging laws. {list(named("fees_active"))} already charge fees by the pound
          {named("fees_upcoming").length > 0 ? `, and ${list(named("fees_upcoming"))} ${named("fees_upcoming").length > 1 ? "are" : "is"} next` : ""}. The
          rate depends on the material, and it is highest for plastic film and foam.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-base">
            <caption className="mb-2 text-left text-sm text-muted">Fee per pound of packaging</caption>
            <thead>
              <tr className="border-b border-ink text-left">
                <th className="py-2 pr-4 font-semibold">Material</th>
                {withRates.map((r) => {
                  const sched = data.coverageSchedules[r.fee_file!];
                  return (
                    <th key={r.state} className="py-2 pr-4 text-right font-semibold">
                      {r.name} {sched.program_year}
                      {sched.status === "proposed" ? " (proposed)" : ""}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rateRows.map((m) => (
                <tr key={m.id} className="border-b border-line">
                  <th scope="row" className="py-2 pr-4 text-left font-normal">
                    {m.name}
                  </th>
                  {withRates.map((r) => (
                    <td key={r.state} className="py-2 pr-4 text-right">
                      {rate(r.fee_file!, m.id)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">
          Small producers are exempt in every state, so Packwise checks your revenue and shipments against each
          state&rsquo;s limits.{" "}
          <Link href="/how-it-works#laws" className="underline underline-offset-2">
            How the laws work
          </Link>
        </p>
      </section>

      <section className="on-dark bg-forest p-8 text-paper sm:p-12">
        <h2 className="max-w-xl text-3xl font-bold">See what your packaging costs you</h2>
        <p className="mt-3 max-w-xl text-lg text-paper/85">
          Free to use. Built on public data, with every figure linked to its source and every estimate labeled.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/planner" className="inline-flex rounded-sm bg-paper px-5 py-2.5 font-semibold text-forest hover:bg-kraft">
            Plan your packaging
          </Link>
          <Link href="/scan" className="inline-flex rounded-sm border border-paper px-5 py-2.5 font-semibold text-paper hover:bg-paper/10">
            Photograph a packed order
          </Link>
        </div>
      </section>
    </div>
  );
}
