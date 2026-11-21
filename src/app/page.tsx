// Landing page. It says what Packwise does in plain words, lets a visitor try it straight away (no sign-up),
// and offers three ways to start. Every number is read from the data files or computed by the engine.

import Link from "next/link";
import type { ReactNode } from "react";

import { LabelSwitcher } from "@/components/home/LabelSwitcher";
import { TryIt } from "@/components/home/TryIt";
import { Term } from "@/components/ui/Term";
import { loadData } from "@/lib/data";
import { num } from "@/lib/format";
import { buildWorkedExample } from "@/lib/method/workedExample";

const list = (items: string[]) => new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(items);

const GETS: [string, string][] = [
  ["A better box", "The smallest box that still protects your product. Sometimes it is one made for your product, with no filler at all."],
  ["What you save", "Shipping and packaging cost per order and per year, with the USPS price worked out for each box."],
  ["Less waste", "How much plastic and landfill waste you cut, and which state packaging fees you can avoid."],
];

const LABEL_ROWS: [string, string][] = [
  ["Landfill waste", "Grams of packaging likely to end up in a landfill, based on how much of each material actually gets recycled."],
  ["Cost", "Packaging plus USPS shipping, per order."],
  ["Protection", "Whether the setup protects the product. Fragile glass needs High."],
  ["State fees", "What the packaging would cost each year in states that charge for it, or $0 if you are exempt."],
  ["Carbon", "Greenhouse gases from making the packaging and from throwing it away."],
];

function Icon({ name }: { name: "example" | "ruler" | "camera" }) {
  const common = { fill: "none", stroke: "var(--forest)", strokeWidth: 2, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="h-8 w-8">
      {name === "example" && (
        <>
          <rect x="6" y="3" width="20" height="26" {...common} />
          <path d="M10 9h12M10 14h12M10 19h8" {...common} />
          <path d="M6 11h20" {...common} strokeWidth={3.5} />
        </>
      )}
      {name === "ruler" && (
        <>
          <rect x="3" y="10" width="26" height="12" {...common} />
          <path d="M8 10v5M13 10v3M18 10v5M23 10v3" {...common} />
        </>
      )}
      {name === "camera" && (
        <>
          <path d="M4 10h6l2-3h8l2 3h6v15H4z" {...common} />
          <circle cx="16" cy="17" r="5" {...common} />
        </>
      )}
    </svg>
  );
}

function StartOption({ href, icon, title, children, action }: { href: string; icon: "example" | "ruler" | "camera"; title: string; children: ReactNode; action: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col border-t-4 border-forest bg-surface p-5 outline-offset-4 hover:bg-kraft/30"
    >
      <Icon name={icon} />
      <h3 className="mt-3 text-xl text-forest">{title}</h3>
      <p className="mt-1 flex-1 text-base text-ink">{children}</p>
      <span className="mt-4 font-semibold text-forest underline decoration-2 underline-offset-4 group-hover:decoration-moss">{action}</span>
    </Link>
  );
}

export default function Home() {
  const data = loadData();
  const ex = buildWorkedExample(data);
  const named = (status: string) => data.coverageRules.filter((r) => r.law_status === status).map((r) => r.name);
  const lawCount = data.coverageRules.filter((r) => r.law_status !== "none").length;
  const feeFor = (state: string, material: string) => {
    const rule = data.coverageRules.find((r) => r.state === state);
    const r = rule?.fee_file ? data.coverageSchedules[rule.fee_file]?.rates[material] : undefined;
    return r ? `$${r.rate_usd_per_lb.toFixed(2)}` : null;
  };
  const foamOR = feeFor("OR", "eps-foam");
  const boxOR = feeFor("OR", "corrugated");

  return (
    <div className="space-y-20">
      <section className="border-2 border-forest bg-kraft p-5 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div className="lg:pt-4">
            <h1 className="max-w-xl text-4xl font-bold text-forest sm:text-5xl">
              Find packaging that costs less to ship and makes less waste.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink">
              Packwise is a free tool for small online shops. Tell it what you sell and how you pack it. It finds a box
              that fits better and shows what you would save on shipping, how much plastic you would cut, and whether{" "}
              <Term id="state-laws">state packaging laws</Term> apply to you.
            </p>
            <ul className="mt-7 max-w-lg space-y-4">
              {GETS.map(([lead, text]) => (
                <li key={lead} className="border-l-4 border-forest pl-4">
                  <span className="block font-serif text-lg font-semibold text-forest">{lead}</span>
                  <span className="text-ink">{text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-7 max-w-lg text-ink">
              No account and nothing to install. Every number links to how it is worked out.{" "}
              <Link href="/how-it-works" className="font-semibold text-forest underline underline-offset-4">
                How we calculate this
              </Link>
            </p>
          </div>
          <TryIt data={data} />
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-forest">Where are you starting?</h2>
        <p className="mt-2 max-w-2xl text-muted">Pick whichever is easiest. You can switch at any point, and your answers carry over.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <StartOption href="/results" icon="example" title="Show me an example" action="Open the example">
            See the full results for a candle shop that ships {num(data.sampleOrders.ordersPerYear)} orders a year.
          </StartOption>
          <StartOption href="/planner" icon="ruler" title="I know what I sell" action="Start the planner">
            Answer three short steps: your product, where you ship, and how you pack it today.
          </StartOption>
          <StartOption href="/scan" icon="camera" title="I have a packed order" action="Scan a photo">
            Take a photo of an open, packed order. We list the box, filler and wrap, and you fix anything we got wrong.
          </StartOption>
        </div>
      </section>

      {ex && (
        <section className="grid gap-12 lg:grid-cols-[24rem_1fr] lg:items-start">
          <LabelSwitcher today={ex.todayScored} better={ex.swapScored} />
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold text-forest">Every option gets a Packaging Facts label</h2>
            <p className="mt-3">
              Like the label on food: one card with the numbers that matter. Flip between the candle shop&rsquo;s box today and
              the better one to see what changes. Scores compare the options for the same product, so a 10 means the best of
              the setups we tried.
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

      <section className="max-w-3xl">
        <h2 className="text-3xl font-bold text-forest">Why the cheap plastic option is starting to cost more</h2>
        <p className="mt-3">
          {lawCount} states now have <Term id="state-laws">packaging laws</Term>. {list(named("fees_active"))} already charge
          brands a fee for every pound of packaging they ship
          {named("fees_upcoming").length > 0 ? `, and ${list(named("fees_upcoming"))} are next` : ""}. The fee depends on the
          material.
          {foamOR && boxOR && ` In Oregon, foam peanuts cost ${foamOR} a pound and cardboard ${boxOR}.`} Small shops are often
          exempt, and Packwise checks that for you.
        </p>
        <p className="mt-3">
          <Link href="/how-it-works#laws" className="font-semibold text-forest underline underline-offset-4">
            How the state laws work
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
