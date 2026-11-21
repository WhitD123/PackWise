// "How we calculate this": the math and sources behind every number in Packwise.
// A server page: it reads the data files and runs the engine, so nothing here is typed in by hand.

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";
import { loadData, type AppData } from "@/lib/data";
import { grams, num, pounds, usd, usdWhole } from "@/lib/format";
import { buildWorkedExample, type SetupBreakdown } from "@/lib/method/workedExample";
import { WRAP_LAYERS } from "@/lib/planner/evaluateSetup";
import { PROTECTION_SCORE } from "@/lib/scoring/fiveFactor";
import { PRESET_LABELS, WEIGHT_PRESETS, type PresetName } from "@/lib/scoring/weights";
import { ZONE_BANDS } from "@/lib/shipping/estimateZone";

export const metadata: Metadata = { title: "How we calculate this | Packwise" };

const pct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <h2 className="text-2xl font-semibold text-forest">{title}</h2>
      {children}
    </section>
  );
}

const P = ({ children }: { children: ReactNode }) => <p className="max-w-3xl">{children}</p>;
const Note = ({ children }: { children: ReactNode }) => <p className="max-w-3xl text-sm text-muted">{children}</p>;

function Table({ head, rows, align }: { head: string[]; rows: ReactNode[][]; align?: ("l" | "r")[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink text-left text-sm">
            {head.map((h, i) => (
              <th key={h} className={`py-2 pr-4 font-semibold ${align?.[i] === "r" ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60 align-top">
              {r.map((c, j) => (
                <td key={j} className={`py-2 pr-4 ${align?.[j] === "r" ? "text-right tabular-nums" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Link = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
    {children}
  </a>
);

function PartsTable({ s }: { s: SetupBreakdown }) {
  const ev = s.evaluated;
  return (
    <div className="space-y-2">
      <h3 className="font-serif text-lg text-forest">
        {s.label}: {s.description}
      </h3>
      <Table
        head={["Part", "Material", "Amount", "Grams", "Recycled", "Landfilled (g)", "CO2e (g)"]}
        align={["l", "l", "r", "r", "r", "r", "r"]}
        rows={[
          ...s.parts.map((p) => [
            p.name,
            p.materialName,
            p.amount,
            num(p.grams, 1),
            pct(p.recycleRate),
            num(p.landfillGrams, 1),
            num(p.co2eGrams, 0),
          ]),
          [
            <strong key="t">Total</strong>,
            "",
            "",
            <strong key="g">{num(ev.packagingWeight_g, 1)}</strong>,
            "",
            <strong key="l">{num(ev.values.waste, 1)}</strong>,
            <strong key="c">{num(ev.values.carbon * 1000, 0)}</strong>,
          ],
        ]}
      />
    </div>
  );
}

function feeCell(data: AppData, file: string, material: string): string {
  const sched = data.coverageSchedules[file];
  const r = sched?.rates[material];
  if (!r) return "no rate found";
  return `${r.rate_usd_per_lb < 0 ? "-" : ""}$${Math.abs(r.rate_usd_per_lb).toFixed(2)}`;
}

export default function HowItWorksPage() {
  const data = loadData();
  const ex = buildWorkedExample(data);
  const s = data.shipping;
  const cubic = s.cubic;
  const product = ex?.input.lines[0];
  const feeStates = data.coverageRules.filter((r) => r.law_status === "fees_active" || r.law_status === "fees_upcoming");
  const withSchedule = feeStates.filter((r) => r.fee_file && data.coverageSchedules[r.fee_file]);
  const estimateCount = data.catalog.components.filter((c) => c.is_estimate).length;
  const states = (status: string) =>
    data.coverageRules
      .filter((r) => r.law_status === status)
      .map((r) => r.name)
      .join(", ");

  return (
    <div className="space-y-12">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-semibold text-forest">How we calculate this</h1>
        <p className="mt-3 text-lg text-muted">
          Packwise is a transparent formula, not a trained model. Every number on the results page is worked out from
          the data files listed at the bottom of this page, and estimates are labeled as estimates. The only AI in
          Packwise is the photo scan, which reads the parts in a picture of your packed order. You check and correct that
          list before anything is calculated.
        </p>
        <nav aria-label="On this page" className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {[
            ["factors", "Five factors"],
            ["example", "Worked example"],
            ["materials", "Materials"],
            ["shipping", "Shipping"],
            ["laws", "State laws"],
            ["empty-space", "Empty space"],
            ["impact", "Impact"],
            ["limits", "Estimates and limits"],
            ["sources", "Sources"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="underline underline-offset-4">
              {label}
            </a>
          ))}
        </nav>
      </header>

      <Section id="factors" title="Five factors">
        <P>
          Every packaging setup is measured on five things for the same product. The numbers are real quantities first
          (dollars, grams, kilograms), and only then turned into 0 to 10 scores so setups can be compared.
        </P>
        <Table
          head={["Factor", "What it is", "How it is calculated"]}
          rows={[
            ["Cost", "Dollars per order", "Packaging material cost plus the USPS shipping price."],
            [
              "Protection",
              "Low, Medium or High",
              "Rated from how fragile the product is, the cushioning around it and the box strength. Fragile glass needs High. It is a minimum a setup must meet, not something you trade away.",
            ],
            [
              "Landfill waste",
              "Grams per order",
              "For every part: weight x (1 - recycle rate). The recycle rate is the national residential rate for that material.",
            ],
            [
              "State fees",
              "Dollars per year",
              "For each state with a packaging law: pounds delivered there x the state's rate per pound for each material. Exempt states cost $0.",
            ],
            [
              "Carbon",
              "kg CO2e per order",
              "For every part: kilograms x a lifecycle factor (production plus end of life, see Materials).",
            ],
          ]}
        />
        <h3 className="font-serif text-lg text-forest">From numbers to scores</h3>
        <ol className="max-w-3xl list-decimal space-y-1 pl-5">
          <li>Setups below the product&rsquo;s protection minimum are dropped.</li>
          <li>Any setup that another setup beats or ties on every factor, and beats on at least one, is dropped.</li>
          <li>
            Waste, Cost, State fees and Carbon are each scored from 0 to 10 across the setups that remain:{" "}
            <code>score = 10 x (worst - this) / (worst - best)</code>. If every setup ties, all get 10.
          </li>
          <li>
            Protection is not scaled. It maps straight to a score: Low {PROTECTION_SCORE.low}, Medium{" "}
            {PROTECTION_SCORE.medium}, High {PROTECTION_SCORE.high}.
          </li>
          <li>The overall score is each factor&rsquo;s score times its weight, added up.</li>
        </ol>
        <Table
          head={["Weights", "Waste", "Cost", "Carbon", "State fees"]}
          align={["l", "r", "r", "r", "r"]}
          rows={(Object.keys(WEIGHT_PRESETS) as PresetName[]).map((k) => [
            PRESET_LABELS[k],
            pct(WEIGHT_PRESETS[k].waste),
            pct(WEIGHT_PRESETS[k].cost),
            pct(WEIGHT_PRESETS[k].carbon),
            pct(WEIGHT_PRESETS[k].fees),
          ])}
        />
        <Note>
          Scores are relative: they rank the setups for this product against each other. They are not a rating on an
          absolute scale. The weights are our proposal and can be changed.
        </Note>
      </Section>

      {ex && product && (
        <Section id="example" title="Worked example: a 12 oz candle">
          <P>
            The demo seller ships one &ldquo;{product.name}&rdquo; per order ({product.length_in} x {product.width_in} x{" "}
            {product.height_in} in, {product.weight_oz} oz packed, rated {product.fragility} fragility). Today it goes in an
            oversized box with foam peanuts and bubble wrap. The tables show every part, first today&rsquo;s setup and then the
            top swap. All figures are calculated by the app from the library and materials data for one order.
          </P>
          <PartsTable s={ex.today} />
          <PartsTable s={ex.swap} />
          <Table
            head={["Per order", "Today", "Top swap"]}
            align={["l", "r", "r"]}
            rows={[
              ["Packaging weight", grams(ex.today.evaluated.packagingWeight_g), grams(ex.swap.evaluated.packagingWeight_g)],
              ["Plastic", grams(ex.today.evaluated.plasticWeight_g), grams(ex.swap.evaluated.plasticWeight_g)],
              ["Landfilled", grams(ex.today.evaluated.values.waste), grams(ex.swap.evaluated.values.waste)],
              [
                "Carbon (production + end of life)",
                `${num(ex.today.evaluated.values.carbon, 2)} kg CO2e`,
                `${num(ex.swap.evaluated.values.carbon, 2)} kg CO2e`,
              ],
              ["Packaging cost", usd(ex.today.evaluated.packagingCost_usd), usd(ex.swap.evaluated.packagingCost_usd)],
              [
                "Shipping (average over the order mix)",
                usd(ex.today.evaluated.shippingCost_usd),
                usd(ex.swap.evaluated.shippingCost_usd),
              ],
            ]}
          />
          <P>
            Over {num(ex.ordersPerYear)} orders a year (the sample order file, one candle per order), the swap saves{" "}
            {usdWhole(ex.swapYear.usdSaved)} a year net of the box costing more, avoids {pounds(ex.swapYear.plasticAvoidedLb)} of
            plastic and {pounds(ex.swapYear.landfillAvoidedLb)} of landfilled packaging, and avoids{" "}
            {num(ex.swapYear.carbonAvoidedKg)} kg CO2e. The wrap area is an estimate ({WRAP_LAYERS} layers over the jar&rsquo;s
            surface).
          </P>
        </Section>
      )}

      <Section id="materials" title="Materials: recycling and carbon">
        <P>
          Each material has a recycle rate and a carbon factor. The lifecycle factor used for Carbon is{" "}
          <code>production + recycle rate x recycling emissions + (1 - recycle rate) x landfill emissions</code>, in kg CO2e
          per kg. It counts landfill methane and gives no credit for recycling. These are published averages for a
          material, not measurements of your packaging.
        </P>
        <Table
          head={["Material", "Plastic", "Recycle rate", "Data year", "Production (kg CO2e/kg)", "Landfill (kg CO2e/kg)", "Source"]}
          align={["l", "l", "r", "r", "r", "r", "l"]}
          rows={data.catalog.materials.map((m) => [
            m.name,
            m.is_plastic ? "yes" : "no",
            pct(m.recycle_rate),
            m.recycle_rate_year ?? "",
            num(m.carbon_kg_co2e_per_kg, 3),
            m.eol_kg_co2e_per_kg ? num(m.eol_kg_co2e_per_kg.landfill, 3) : "",
            <Link key="s" href={m.recycle_rate_source_url ?? m.source_url}>
              link
            </Link>,
          ])}
        />
        <Note>
          Recycle rate is the national residential recycling rate, measured the same way for every material so they can be
          compared. Older, higher figures (for example EPA&rsquo;s for corrugated) include commercial recycling and are not used.
          Expanded polystyrene carbon is resin only, so it is a lower bound.
        </Note>
      </Section>

      <Section id="shipping" title="Shipping price">
        <P>
          Prices are {s.carrier} {s.service}, commercial rates, from the table effective {s.effective_date ?? "the date in the data"}.
        </P>
        <ol className="max-w-3xl list-decimal space-y-1 pl-5">
          <li>Shipped weight is the product plus all the packaging.</li>
          <li>
            Dimensional weight applies only to boxes over {num(s.dim_applies_above_cubic_in ?? 0)} cubic inches: the billable
            weight is the larger of the actual weight and the outside volume divided by {s.dim_divisor}, rounded up.
          </li>
          <li>The weight price is the first row of the USPS table at or above the billable weight, for the destination zone.</li>
          {cubic && (
            <li>
              Cubic pricing is used when it is cheaper and the package qualifies: up to {cubic.max_cubic_ft} cubic foot, up to{" "}
              {cubic.max_weight_lb} lb, longest side up to {cubic.max_longest_dimension_in} in. Each outside side is rounded down to
              the nearest quarter inch. Cubic needs commercial postage bought through shipping software, which most online
              sellers have. Using the lower of the two prices is our reading of the rules.
            </li>
          )}
          {s.surcharges_usd && (
            <li>
              Surcharges are added when they apply: longest side over 22 in (
              {usd(s.surcharges_usd.length_over_22_in_up_to_30_in)}), over 30 in ({usd(s.surcharges_usd.length_over_30_in)}), volume
              over 2 cubic feet ({usd(s.surcharges_usd.volume_over_2_cubic_ft)}).
            </li>
          )}
          <li>For a whole order file, the price is averaged over where the orders go, each zone weighted by its share of orders.</li>
        </ol>
        <h3 className="font-serif text-lg text-forest">Zones</h3>
        <P>The zone depends on where you ship from. Packwise labels every shipping price with how its zone was found.</P>
        <Table
          head={["Label", "When", "How"]}
          rows={[
            [
              "Exact USPS zone",
              `The ship-from ZIP starts with ${s.zones_from_origin?.origin_zip3} (the demo seller, Portland).`,
              "The real USPS zone chart for that origin, copied from USPS.",
            ],
            [
              "Estimated zone",
              "Any other ship-from ZIP.",
              "Straight-line distance between the centers of the two 3-digit ZIP areas, put into USPS's distance bands (below). Typically within one zone of USPS's own chart.",
            ],
            [
              "Zone assumed",
              "No ship-from ZIP, or an unknown one.",
              "Zone 5 for every order. This is a fallback, not a typical zone.",
            ],
          ]}
        />
        <Table
          head={["Distance between ZIP areas", "Zone"]}
          align={["l", "r"]}
          rows={[
            ["Same 3-digit ZIP area", "1"],
            ...ZONE_BANDS.map(([limit, zone], i) => [
              `${i === 0 ? "Up to" : `${num(ZONE_BANDS[i - 1][0])} to`} ${num(limit)} miles`,
              String(zone),
            ]),
            [`Over ${num(ZONE_BANDS[ZONE_BANDS.length - 1][0])} miles`, "8"],
          ]}
        />
        <Note>
          Zone 9 (Guam and nearby) is priced as Zone 8. Estimated zones are not a quote. Shipping estimates cover the 50 states
          and DC, USPS Ground Advantage only.
        </Note>
        {s.temporary_pricing_note && <Note>{s.temporary_pricing_note}</Note>}
      </Section>

      <Section id="laws" title="State packaging laws and fees">
        <P>
          Some states make the brands that put packaging on the market report it and pay for it. For each state with a law
          Packwise works out the pounds of packaging delivered there each year (orders to that state x packaging per order),
          checks the small-producer exemptions, and, if you are covered, multiplies the pounds of each material by the
          state&rsquo;s rate. A candle&rsquo;s glass jar and metal lid count as packaging by default, labeled &ldquo;likely covered,
          no official ruling on candle jars&rdquo;, and you can switch that off to see both numbers.
        </P>
        <Table
          head={["State", "Law", "Exempt if", "Must apply?", "Fee year and status"]}
          rows={feeStates.map((r) => {
            const sched = r.fee_file ? data.coverageSchedules[r.fee_file] : undefined;
            const tests = [
              r.revenue_threshold_usd
                ? `${r.revenue_scope === "in_state" ? `${r.name} sales` : "worldwide revenue"} under ${usdWhole(r.revenue_threshold_usd)}`
                : null,
              r.exempt_if === "any_test" && r.weight_threshold_lb
                ? `under ${num(r.weight_threshold_lb, r.weight_threshold_lb % 1 ? 1 : 0)} lb of packaging into the state`
                : null,
            ].filter(Boolean);
            return [
              r.name,
              r.law_name ?? "",
              tests.join(r.exempt_if === "any_test" ? " or " : ""),
              r.application_required ? "Yes" : "No",
              sched
                ? `${sched.program_year}, ${sched.status}${r.fee_data_year_lag ? `; billed on ${sched.program_year - r.fee_data_year_lag} shipments` : ""}`
                : "no fee schedule yet",
            ];
          })}
        />
        <h3 className="font-serif text-lg text-forest">Fee rates per pound</h3>
        <Table
          head={["Material", ...withSchedule.map((r) => `${r.name} ${data.coverageSchedules[r.fee_file!].program_year}`)]}
          align={["l", ...withSchedule.map((): "r" => "r")]}
          rows={data.catalog.materials.map((m) => [m.name, ...withSchedule.map((r) => feeCell(data, r.fee_file!, m.id))])}
        />
        <Note>
          A negative rate is a credit. &ldquo;No rate found&rdquo; means the schedule has no rate for that material, which is not the
          same as zero.
          {withSchedule.some((r) => data.coverageSchedules[r.fee_file!].plastic_component_fees) &&
            " California plastics also owe a plastic component fee on top of the base rate, and a per-component fee we cannot count from a weight alone."}{" "}
          Proposed rates are not final.
        </Note>
        <Note>
          Registration only (no fee yet): {states("registration_only")}. Fees upcoming: {states("fees_upcoming")}. The other
          states have no packaging law yet. If a 3PL or marketplace packs your orders, the obligation for the shipping packaging
          may fall on them. This is an estimate from public rules, not legal advice.
        </Note>
      </Section>

      <Section id="empty-space" title="Empty space">
        <P>
          The EU&rsquo;s packaging regulation will cap empty space in e-commerce packaging at {pct(data.euEmptySpace.max_empty_space_ratio)}{" "}
          from {data.euEmptySpace.application_date.slice(0, 4)}. It is not a US law, so Packwise uses it only as a benchmark. Empty
          space ratio = (box inside volume minus the volume of what is inside) / box inside volume, and filler counts as empty.
          Only a smaller box lowers it.
        </P>
        {ex && (
          <P>
            For the demo order, today&rsquo;s box is {pct(ex.today.evaluated.emptySpaceRatio ?? 0)} empty and the fitted box is{" "}
            {pct(ex.swap.evaluated.emptySpaceRatio ?? 0)} empty. That is much less, but still above the benchmark, because a square box
            around a round jar always leaves corners.
          </P>
        )}
        <Note>
          We use the product&rsquo;s own bounding box as what is inside. The EU rule uses the volume of the product&rsquo;s sales
          packaging, and its calculation method is still being written.
        </Note>
      </Section>

      <Section id="impact" title="Impact projection">
        <P>
          The impact box on the results page scales one seller&rsquo;s own swap. It shows the formula next to the answer:
        </P>
        <Card>
          <p className="font-mono text-sm">
            plastic avoided = sellers x orders per year x (plastic g before - plastic g after) / 453.592
          </p>
          {ex && (
            <p className="mt-3 text-sm">
              For the demo: {num(ex.projection.sellers)} sellers x {num(ex.ordersPerYear)} orders x (
              {num(ex.today.evaluated.plasticWeight_g, 1)} g - {num(ex.swap.evaluated.plasticWeight_g, 1)} g) / 453.592 ={" "}
              {num(ex.projection.plasticAvoidedLb)} lb, about {num(ex.projection.plasticAvoidedUsTons, 1)} US tons a year. Those orders
              are {num(ex.projection.parcelShare * 100, 1)}% of the {num(data.usParcelVolume.value_billion, 1)} billion parcels shipped in
              the US in {data.usParcelVolume.year} (<Link href={data.usParcelVolume.source_url}>{data.usParcelVolume.publisher}</Link>).
            </p>
          )}
        </Card>
        <P>What this does not claim:</P>
        <ul className="max-w-3xl list-disc space-y-1 pl-5 text-sm">
          <li>
            It does not predict that {ex ? num(ex.projection.sellers) : "any number of"} sellers will switch. It is one
            seller&rsquo;s own numbers multiplied.
          </li>
          <li>
            &ldquo;Similar&rdquo; means the same order volume and packaging mix. It does not claim to represent the average small US
            seller.
          </li>
          <li>
            It does not claim ocean or environmental leakage avoided, and it does not claim a net carbon or lifecycle benefit. A
            replacement can weigh more or carry its own impacts, which is why the box on the results page also shows the change
            in paper and other non-plastic packaging.
          </li>
          <li>
            The share of US parcels counts all parcels, not only online orders, so it shows scale and is not a market-share
            claim.
          </li>
          <li>Library weights are typical values, not weighed for each seller&rsquo;s items.</li>
        </ul>
      </Section>

      <Section id="limits" title="Estimates and limits">
        <ul className="max-w-3xl list-disc space-y-1 pl-5">
          <li>
            {estimateCount} of the {data.catalog.components.length} library components are flagged as estimates, and every
            mailer&rsquo;s inside height is an estimate. Estimated values are labeled where they appear.
          </li>
          <li>Paper filler weights are uncertain. The library keeps a range for them until they are weighed.</li>
          <li>
            Wrap area is an estimate: {WRAP_LAYERS} layers over each item&rsquo;s surface.
          </li>
          <li>Estimated shipping zones are typically within one zone of USPS&rsquo;s chart, and they are not a quote.</li>
          <li>Proposed state fee schedules can change before they take effect.</li>
          <li>
            Candle jars: there is no official ruling on whether a candle&rsquo;s glass jar counts as packaging, so both views are
            shown.
          </li>
          <li>
            Packwise sizes packaging for the products you describe, one kind of order at a time. Shipping covers USPS Ground
            Advantage to the 50 states and DC.
          </li>
          <li>
            Protection ratings follow carrier packaging guidance. They are not a drop-test result, and no setup here is
            certified.
          </li>
        </ul>
      </Section>

      <Section id="sources" title="Sources">
        <P>
          Every record in the data files carries its own source link and the date it was checked. The full list is in
          SOURCES.md in the repository.
        </P>
        <Table
          head={["Data", "Source", "Checked"]}
          rows={[
            [
              `${s.carrier} ${s.service} prices`,
              <Link key="a" href={(s as unknown as { source_url: string }).source_url}>
                USPS price notice
              </Link>,
              (s as unknown as { last_checked: string }).last_checked,
            ],
            ...(s.rules_source_url
              ? [
                  [
                    "Cubic pricing rules",
                    <Link key="b" href={s.rules_source_url}>
                      USPS Domestic Mail Manual
                    </Link>,
                    (s as unknown as { last_checked: string }).last_checked,
                  ],
                ]
              : []),
            ...withSchedule.map((r) => {
              const sched = data.coverageSchedules[r.fee_file!];
              return [
                `${r.name} ${sched.program_year} fee rates (${sched.status})`,
                <Link key={r.state} href={sched.source_url}>
                  fee schedule
                </Link>,
                sched.last_checked,
              ];
            }),
            ...feeStates.map((r) => [
              `${r.name} exemption rules`,
              <Link key={`r-${r.state}`} href={r.source_url}>
                state rules
              </Link>,
              r.last_checked,
            ]),
            [
              "US parcels shipped",
              <Link key="p" href={data.usParcelVolume.source_url}>
                {data.usParcelVolume.publisher}
              </Link>,
              "",
            ],
            [
              "EU empty-space rule",
              <Link key="e" href={data.euEmptySpace.source_url}>
                Regulation (EU) 2025/40, Article 24
              </Link>,
              "",
            ],
          ]}
        />
      </Section>
    </div>
  );
}
