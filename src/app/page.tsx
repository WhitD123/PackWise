// Home: the intro to Packwise. Built on NN/g homepage guidance (say what it is and who it is for in one sentence,
// show a real example, give clear starting points, plain specific labels, conventional layout) and on the FTC Green
// Guides for environmental claims (no unqualified "eco-friendly"; name the specific benefit; say it is about the
// packaging; state what each comparison is against; do not overstate). Every number is computed or read from data.

import Link from "next/link";
import type { ReactNode } from "react";

import { CartonCompare } from "@/components/home/CartonCompare";
import { LabelSwitcher } from "@/components/home/LabelSwitcher";
import { TryIt } from "@/components/home/TryIt";
import { SectionNav } from "@/components/results/SectionNav";
import { Term } from "@/components/ui/Term";
import { loadData, type ImpactFact } from "@/lib/data";
import { grams, num, pounds, usd, usdWhole } from "@/lib/format";
import { buildWorkedExample } from "@/lib/method/workedExample";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const list = (items: string[]) => new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(items);

const SECTIONS = [
  { id: "what-you-get", label: "What you get" },
  { id: "how-it-works", label: "How it works" },
  { id: "try-it", label: "Try it" },
  { id: "environment", label: "Why it matters" },
  { id: "questions", label: "Questions" },
];

function Section({ id, title, lead, children }: { id: string; title: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16">
      <h2 className="text-3xl font-bold text-forest">{title}</h2>
      {lead && <p className="mt-2 max-w-2xl text-lg text-muted">{lead}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Source({ fact }: { fact: ImpactFact }) {
  return (
    <a href={fact.source_url} target="_blank" rel="noreferrer" className="text-sm text-muted underline underline-offset-2">
      {fact.publisher.split(",")[0].split(" (")[0]}, {fact.year}
    </a>
  );
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group border-b border-line py-4">
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 font-serif text-lg font-semibold text-forest [&::-webkit-details-marker]:hidden">
        {q}
        <span aria-hidden="true" className="font-sans text-2xl leading-none text-forest group-open:hidden">
          +
        </span>
        <span aria-hidden="true" className="hidden font-sans text-2xl leading-none text-forest group-open:inline">
          &minus;
        </span>
      </summary>
      <div className="mt-2 max-w-3xl text-base">{children}</div>
    </details>
  );
}

export default function Home() {
  const data = loadData();
  const ex = buildWorkedExample(data);
  const fact = (id: string) => data.impactFacts.find((f) => f.id === id);
  const mat = (id: string) => data.catalog.materials.find((m) => m.id === id);
  const lawStates = data.coverageRules.filter((r) => r.law_status !== "none");
  const feeStates = lawStates.filter((r) => r.law_status === "fees_active").map((r) => r.name);
  const parcels = fact("us-parcel-volume-2025");
  const packagingWaste = fact("epa-containers-packaging-generation-2018");
  const film = fact("epa-plastic-bags-sacks-wraps-generation-2018");
  const filmRate = fact("epa-plastic-bags-sacks-wraps-recycling-rate-2018");
  const soloSellers = fact("etsy-sellers-business-of-one-2024");
  const cardboard = mat("corrugated");
  const peFilm = mat("pe-film");
  const foam = mat("eps-foam");

  const today = ex?.today.evaluated;
  const better = ex?.swap.evaluated;

  return (
    <div className="space-y-24">
      {/* 1. What it is, who it is for, and a real example */}
      <section className="border-2 border-forest bg-kraft p-5 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <h1 className="max-w-xl text-4xl font-bold text-forest sm:text-5xl">
              Packwise helps small online shops ship in packaging that costs less and wastes less.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink">
              Tell it what you sell and how you pack it today, or snap a photo of a packed order. In about a minute you see
              a better box, what it saves on shipping, how much plastic it cuts, and whether{" "}
              <Term id="state-laws">state packaging laws</Term> apply to you. Free, with no account.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/planner" className="inline-flex rounded-sm bg-forest px-5 py-2.5 font-semibold text-paper hover:bg-moss">
                Check my packaging
              </Link>
              <a href="#try-it" className="inline-flex rounded-sm border border-forest px-5 py-2.5 font-semibold text-forest hover:bg-forest/10">
                Try an example first
              </a>
              <Link href="/scan" className="inline-flex items-center px-2 py-2.5 font-semibold text-forest underline underline-offset-4">
                Scan a photo instead
              </Link>
            </div>
          </div>

          {today && better && (
            <figure className="border border-ink bg-surface p-5">
              <figcaption className="mb-4">
                <span className="block font-serif text-lg font-semibold text-forest">A real example</span>
                <span className="text-sm text-muted">
                  A candle shop&rsquo;s 12 oz jar candle, today in an oversized box with foam peanuts and bubble wrap,
                  against a box made for the jar. Drawn to the same scale. Sample data.
                </span>
              </figcaption>
              <CartonCompare today={today} swap={better} />
              <table className="mt-5 w-full text-sm">
                <caption className="sr-only">Per order, today compared with the better box</caption>
                <thead>
                  <tr className="border-b border-ink text-left">
                    <th className="py-1.5 pr-3 font-semibold">Per order</th>
                    <th className="py-1.5 pr-3 font-semibold">Today</th>
                    <th className="py-1.5 font-semibold">Better box</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Shipping", usd(today.shippingCost_usd), usd(better.shippingCost_usd)],
                    ["Plastic", grams(today.plasticWeight_g), grams(better.plasticWeight_g)],
                    [<Term key="l" id="landfill-waste" />, grams(today.values.waste), grams(better.values.waste)],
                    [<Term key="e" id="empty-space" />, pct(today.emptySpaceRatio ?? 0), pct(better.emptySpaceRatio ?? 0)],
                  ].map(([label, a, b], i) => (
                    <tr key={i} className="border-b border-line">
                      <th scope="row" className="py-1.5 pr-3 text-left font-normal text-muted">
                        {label}
                      </th>
                      <td className="py-1.5 pr-3">{a}</td>
                      <td className="py-1.5 font-semibold text-forest">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-sm">
                <Link href="/results" className="font-semibold text-forest underline underline-offset-4">
                  See the full example results
                </Link>
              </p>
            </figure>
          )}
        </div>
      </section>

      <SectionNav sections={SECTIONS} />

      {/* 2. Benefits, each with the example's own numbers and what it is compared with */}
      {ex && today && better && (
        <Section
          id="what-you-get"
          title="What Packwise does for your shop"
          lead="Each benefit below uses the candle shop example, compared with its oversized box with foam peanuts and bubble wrap."
        >
          <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
            {[
              {
                title: "Pay less to ship",
                body: (
                  <>
                    A smaller box can qualify for cheaper USPS pricing (<Term id="cubic-pricing">Cubic pricing</Term>). Shipping went from{" "}
                    {usd(today.shippingCost_usd)} to {usd(better.shippingCost_usd)} an order, about {usdWhole(ex.swapYear.usdSaved)} a year after paying{" "}
                    {usd(better.packagingCost_usd - today.packagingCost_usd)} more for each box.
                  </>
                ),
              },
              {
                title: "Use less plastic",
                body: (
                  <>
                    A box made for the jar needs no foam peanuts or bubble wrap: {grams(today.plasticWeight_g)} of plastic an order down to{" "}
                    {grams(better.plasticWeight_g)}, or {pounds(ex.swapYear.plasticAvoidedLb)} a year.
                  </>
                ),
              },
              {
                title: "Send less packaging to landfill",
                body: (
                  <>
                    Packaging likely to be thrown away fell from {grams(today.values.waste)} to {grams(better.values.waste)} an order, because
                    cardboard is recycled far more often than foam or film.
                  </>
                ),
              },
              {
                title: "Know where you stand on state laws",
                body: (
                  <>
                    {lawStates.length} states have packaging laws, and {list(feeStates)} already charge fees. See whether you are covered or
                    exempt, and what a change would do to your fees.
                  </>
                ),
              },
              {
                title: "Keep products safe",
                body: (
                  <>
                    Packwise only suggests setups that give your product the <Term id="protection">protection</Term> it needs, following
                    carrier packaging guidance. Glass stays rated High.
                  </>
                ),
              },
              {
                title: "See the trade-offs",
                body: (
                  <>
                    Every suggestion says what gets worse as well as what gets better, like the better box costing{" "}
                    {usd(better.packagingCost_usd - today.packagingCost_usd)} more. You decide.
                  </>
                ),
              },
            ].map((b) => (
              <div key={b.title} className="border-t-2 border-forest pt-4">
                <h3 className="text-xl text-forest">{b.title}</h3>
                <p className="mt-2 text-base">{b.body}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 3. How it works: a real sequence, so it is numbered */}
      <Section id="how-it-works" title="How it works" lead="Three steps. Most people are done in a few minutes.">
        <ol className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Tell us what you ship",
              body: "Pick a product or enter its size and weight, say how you pack it now, and roughly how many orders you send. A photo of a packed order or a Shopify order export fills this in for you.",
            },
            {
              title: "We test every option",
              body: `Packwise tries every box, mailer, filler and wrap in its library of ${data.catalog.components.length} real products, prices each one with USPS rates, and checks state packaging rules.`,
            },
            {
              title: "You get a clear plan",
              body: "The best setup for your product with its Packaging Facts label, better swaps with what you save and what changes, your state law check, and the yearly impact.",
            },
          ].map((s, i) => (
            <li key={s.title} className="relative pl-12">
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-forest bg-paper font-serif text-lg font-bold text-forest"
              >
                {i + 1}
              </span>
              <h3 className="text-xl text-forest">{s.title}</h3>
              <p className="mt-2 text-base">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/planner" className="inline-flex rounded-sm bg-forest px-5 py-2.5 font-semibold text-paper hover:bg-moss">
            Check my packaging
          </Link>
          <Link href="/scan" className="inline-flex rounded-sm border border-forest px-5 py-2.5 font-semibold text-forest hover:bg-forest/10">
            Scan a photo of a packed order
          </Link>
          <Link href="/results" className="inline-flex items-center px-2 py-2.5 font-semibold text-forest underline underline-offset-4">
            See a full example first
          </Link>
        </div>
      </Section>

      {/* 4. Try it, right here */}
      <Section
        id="try-it"
        title="Try it in 30 seconds"
        lead="Pick a product and how you pack it now. The numbers below come from the same engine as the full results."
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <TryIt data={data} />
          {ex && (
            <div className="space-y-4">
              <h3 className="text-xl text-forest">Every option gets a Packaging Facts label</h3>
              <p className="text-base">
                Like the label on food: one card with the numbers that matter. Flip between the candle shop&rsquo;s box today and the
                better one. Scores compare options for the same product, so 10 means the best of the setups we tried.
              </p>
              <LabelSwitcher today={ex.todayScored} better={ex.swapScored} />
            </div>
          )}
        </div>
      </Section>

      {/* 5. Environmental impact: sourced facts, the example's specific changes, and how claims are kept honest */}
      <Section
        id="environment"
        title="Why packaging choices matter"
        lead="Most packaging waste is decided once, when a shop picks its box, and then repeated on every order."
      >
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="text-xl text-forest">The scale</h3>
            <ul className="mt-4 space-y-5">
              {parcels && (
                <li className="border-l-4 border-forest pl-4">
                  <p className="text-base">
                    <strong className="font-serif text-2xl text-forest">{num(parcels.value, 1)} billion</strong> parcels were shipped in the US
                    in {parcels.year}.
                  </p>
                  <Source fact={parcels} />
                </li>
              )}
              {packagingWaste && (
                <li className="border-l-4 border-forest pl-4">
                  <p className="text-base">
                    <strong className="font-serif text-2xl text-forest">{num(packagingWaste.value, 1)} million tons</strong> of containers and
                    packaging went into US household and business trash and recycling in {packagingWaste.year}.
                  </p>
                  <Source fact={packagingWaste} />
                </li>
              )}
              {film && filmRate && (
                <li className="border-l-4 border-forest pl-4">
                  <p className="text-base">
                    <strong className="font-serif text-2xl text-forest">{num(film.value, 1)} million tons</strong> of plastic bags, sacks and wraps,
                    and only {num(filmRate.value, 0)}% was recycled.
                  </p>
                  <Source fact={filmRate} />
                </li>
              )}
              {cardboard && peFilm && foam && (
                <li className="border-l-4 border-forest pl-4">
                  <p className="text-base">
                    From homes, about <strong>{pct(cardboard.recycle_rate)}</strong> of cardboard is recycled, against{" "}
                    <strong>{pct(peFilm.recycle_rate)}</strong> of plastic film and <strong>{pct(foam.recycle_rate)}</strong> of foam peanuts. That
                    is why swapping plastic filler for a box that fits matters.
                  </p>
                  <Link href="/how-it-works#materials" className="text-sm text-muted underline underline-offset-2">
                    Recycling rates by material
                  </Link>
                </li>
              )}
              {soloSellers && (
                <li className="border-l-4 border-forest pl-4">
                  <p className="text-base">
                    <strong className="font-serif text-2xl text-forest">{num(soloSellers.value, 0)}%</strong> of sellers surveyed by Etsy run
                    their shop alone, so packaging is usually picked by one busy person, often by price.
                  </p>
                  <Source fact={soloSellers} />
                </li>
              )}
            </ul>
          </div>

          {ex && today && better && (
            <div>
              <h3 className="text-xl text-forest">What one better box changed</h3>
              <p className="mt-2 text-base">
                The candle shop example, per year at {num(ex.ordersPerYear)} orders, compared with its oversized box with foam peanuts and
                bubble wrap. These are changes to the packaging, not to the candle.
              </p>
              <dl className="mt-5 divide-y divide-line border-y border-line">
                {[
                  ["Plastic packaging", `${pounds(ex.swapYear.plasticAvoidedLb)} less`],
                  ["Packaging likely landfilled", `${pounds(ex.swapYear.landfillAvoidedLb)} less`],
                  [
                    <Term key="c" id="co2e">
                      Carbon (CO2e)
                    </Term>,
                    `${num(ex.swapYear.carbonAvoidedKg)} kg less, from making and disposing of the packaging`,
                  ],
                  ["Empty space in the box", `${pct(today.emptySpaceRatio ?? 0)} down to ${pct(better.emptySpaceRatio ?? 0)}`],
                ].map(([k, v], i) => (
                  <div key={i} className="grid gap-1 py-3 sm:grid-cols-[13rem_1fr] sm:gap-4">
                    <dt className="font-semibold text-forest">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>

              <h3 className="mt-10 text-xl text-forest">How we keep these claims honest</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-base">
                <li>We never call packaging &ldquo;eco-friendly&rdquo; or &ldquo;green&rdquo;. We name the specific change, in grams or pounds.</li>
                <li>Every comparison says what it is compared with, and the results show what gets worse as well.</li>
                <li>
                  A box that fits better is not perfect: the example&rsquo;s better box is still {pct(better.emptySpaceRatio ?? 0)} empty space,
                  so we say &ldquo;much less&rdquo;, not &ldquo;none&rdquo;.
                </li>
                <li>We do not claim ocean plastic avoided or a total lifecycle benefit, because the public data cannot support it.</li>
              </ul>
              <p className="mt-4">
                <Link href="/how-it-works" className="font-semibold text-forest underline underline-offset-4">
                  See every formula and source
                </Link>
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* 6. Common questions, in one place */}
      <Section id="questions" title="Common questions">
        <div className="border-t border-line">
          <Faq q="Who is Packwise for?">
            Small online shops in the US that pack and ship their own orders in a box or mailer: candles, mugs, soap, clothing, books and
            similar products. You do not need to know anything about packaging or shipping rates.
          </Faq>
          <Faq q="What does it cost?">Nothing. There is no account, no sign-up and nothing to install.</Faq>
          <Faq q="What do I need to get started?">
            What you sell (its size and weight, or pick a similar example), how you pack it now, and roughly how many orders you ship.
            Your ship-from ZIP code and a Shopify order export make the results more exact, but they are optional.
          </Faq>
          <Faq q="Do you keep my information?">
            Your answers are saved only in your own browser so the results page can read them. An order file you upload is read in your
            browser and is not sent anywhere. A photo you scan is sent to Google&rsquo;s Gemini to read the parts; Packwise does not store it,
            and Google&rsquo;s terms for Gemini apply.
          </Faq>
          <Faq q="Where do the numbers come from?">
            Public sources only: supplier pages for all {data.catalog.components.length} boxes, mailers and fillers, the USPS price tables,
            state laws and fee schedules, and national recycling and emissions data. Estimates are labeled, and every number links to how
            it is worked out on{" "}
            <Link href="/how-it-works" className="font-semibold text-forest underline underline-offset-4">
              How we calculate
            </Link>
            .
          </Faq>
          <Faq q="Will a smaller box still protect my product?">
            Packwise only suggests setups that meet the protection your product needs: enough cushioning on every side for fragile items,
            or a box made for that product. It follows carrier packaging guidance, but it is not a drop test, so test a new setup with a few
            real orders.
          </Faq>
          <Faq q="Is the state law check legal advice?">
            No. It is an estimate from public rules and fee schedules. Check with the state program before you register or report.
          </Faq>
          <Faq q="Which carriers does it cover?">
            {data.shipping.carrier} {data.shipping.service} to the 50 states and DC. UPS and FedEx are not covered yet.
          </Faq>
          <Faq q="Does Packwise sell packaging?">
            No. It links to each supplier&rsquo;s own page so you can compare, and it earns nothing from them.
          </Faq>
        </div>
      </Section>

      <section className="on-dark bg-forest p-8 text-paper sm:p-12">
        <h2 className="max-w-xl text-3xl font-bold">See what your packaging costs you</h2>
        <p className="mt-3 max-w-xl text-lg text-paper/85">
          A few questions, or one photo. Free, no account, and every number shows its source.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/planner" className="inline-flex rounded-sm bg-paper px-5 py-2.5 font-semibold text-forest hover:bg-kraft">
            Check my packaging
          </Link>
          <Link href="/scan" className="inline-flex rounded-sm border border-paper px-5 py-2.5 font-semibold text-paper hover:bg-paper/10">
            Scan a photo of a packed order
          </Link>
        </div>
      </section>
    </div>
  );
}
