"use client";

import { useMemo, useState } from "react";

import { Card, SectionHeading } from "@/components/ui/Card";
import { coverageForSetup } from "@/lib/coverage/forSetup";
import type { CoverageResult, StateCoverageRule } from "@/lib/coverage/types";
import type { AppData } from "@/lib/data";
import { usdWhole } from "@/lib/format";
import type { PlannerInput } from "@/lib/planner/plannerInput";
import type { EvaluatedSetup } from "@/lib/types";

/** The "smaller seller" view from the demo story: a brand at about $2M a year. */
const SMALL_SELLER_REVENUE_USD = 2_000_000;

const STATUS_ORDER: Record<StateCoverageRule["law_status"], number> = {
  fees_active: 0,
  fees_upcoming: 1,
  registration_only: 2,
  none: 3,
};

const BADGE: Record<CoverageResult["result"], { text: string; className: string }> = {
  covered: { text: "Covered", className: "border-brick text-brick" },
  exempt: { text: "Exempt", className: "border-moss text-moss" },
  apply_for_exemption: { text: "Exempt if you apply", className: "border-ochre text-ochre" },
  no_law: { text: "No law yet", className: "border-line text-muted" },
};

function nextKeyDate(rule: StateCoverageRule, today: string) {
  return rule.key_dates.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
}

function StateCard({
  rule,
  before,
  after,
  data,
  today,
}: {
  rule: StateCoverageRule;
  before: CoverageResult;
  after: CoverageResult | null;
  data: AppData;
  today: string;
}) {
  const badge = BADGE[before.result];
  const schedule = rule.fee_file ? data.coverageSchedules[rule.fee_file] : undefined;
  const next = nextKeyDate(rule, today);
  const showAfter = after !== null && after.fee_usd_per_year !== null && before.fee_usd_per_year !== null;

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xl text-forest">{rule.name}</h3>
        <span className={`rounded-sm border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${badge.className}`}>
          {badge.text}
        </span>
      </div>
      <p className="mt-2">{before.reason}</p>

      {before.fee_usd_per_year !== null && (
        <div className="mt-4 border-t border-line pt-3">
          <div className="font-serif text-2xl font-semibold">
            {usdWhole(before.fee_usd_per_year)}
            {showAfter && (
              <>
                {" "}
                <span className="text-muted">→</span>{" "}
                <span className={after!.fee_usd_per_year! <= before.fee_usd_per_year ? "text-moss" : "text-brick"}>
                  {usdWhole(after!.fee_usd_per_year!)}
                </span>
              </>
            )}{" "}
            <span className="font-sans text-sm font-normal text-muted">
              per year{showAfter ? ", today → after the top swap" : ""}
            </span>
          </div>
          {schedule && (
            <p className="mt-1 text-xs text-muted">
              Estimate from {schedule.program_year} {schedule.status === "proposed" ? "proposed" : "final"} rates.
              {rule.fee_data_year_lag
                ? ` A ${schedule.program_year} fee is based on ${schedule.program_year - rule.fee_data_year_lag} shipments.`
                : ""}
            </p>
          )}
        </div>
      )}

      {before.needs_input && <p className="mt-3 text-sm text-ochre">{before.needs_input}</p>}
      {before.warnings.map((w) => (
        <p key={w} className="mt-2 text-xs text-muted">
          {w}
        </p>
      ))}

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
        <span>{next ? `Next: ${next.date}, ${next.event}` : "No upcoming dates found"}</span>
        <span>
          <a href={rule.source_url} className="underline" target="_blank" rel="noreferrer">
            Source
          </a>
          , checked {rule.last_checked}
        </span>
      </div>
    </Card>
  );
}

export function CoverageSection({
  data,
  input,
  current,
  after,
}: {
  data: AppData;
  input: PlannerInput;
  /** What the seller ships today (or the recommended setup if today's is unknown). */
  current: EvaluatedSetup;
  /** The top swap, for the "after" fee. */
  after: EvaluatedSetup | null;
}) {
  const hasJar = (input.productPackaging ?? []).some((p) => p.is_candle_container);
  const [includeJar, setIncludeJar] = useState(true);
  const [smallSeller, setSmallSeller] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const rows = useMemo(() => {
    const opts = {
      includeCandleContainer: hasJar && includeJar,
      revenueOverrideUsd: smallSeller ? SMALL_SELLER_REVENUE_USD : undefined,
    };
    const before = coverageForSetup(current, input, data, opts);
    const afterResults = after ? coverageForSetup(after, input, data, opts) : null;
    return before
      .map((b) => ({
        rule: data.coverageRules.find((r) => r.state === b.state)!,
        before: b,
        after: afterResults?.find((a) => a.state === b.state) ?? null,
      }))
      .sort((a, b) => STATUS_ORDER[a.rule.law_status] - STATUS_ORDER[b.rule.law_status] || a.rule.name.localeCompare(b.rule.name));
  }, [current, after, input, data, hasJar, includeJar, smallSeller]);

  const noLaw = data.coverageRules.filter((r) => r.law_status === "none");
  const noLawStates = noLaw.filter((r) => r.state !== "DC").length;
  const dcNoLaw = noLaw.some((r) => r.state === "DC");

  return (
    <section>
      <SectionHeading
        title="State packaging laws"
        lead="Seven states make brands report, and in some states pay for, the packaging they ship. Fees per pound are highest for packaging that is hard to recycle, like plastic film and foam."
      />

      <div className="mb-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
        {hasJar && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!includeJar} onChange={(e) => setIncludeJar(!e.target.checked)} />
            Treat the jar and lid as part of the product, not packaging
          </label>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={smallSeller} onChange={(e) => setSmallSeller(e.target.checked)} />
          See a smaller seller ({usdWhole(SMALL_SELLER_REVENUE_USD)} a year)
        </label>
      </div>

      {hasJar && includeJar && (
        <p className="mb-4 text-sm text-bark">
          The glass jar and metal lid are counted as packaging: likely covered, but there is no official ruling on candle
          jars yet.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <StateCard key={r.rule.state} rule={r.rule} before={r.before} after={r.after} data={data} today={today} />
        ))}
      </div>

      <p className="mt-4 text-sm text-muted">
        The other {noLawStates} states{dcNoLaw ? " and DC" : ""} have no packaging law yet. Estimates come from public rules and fee schedules,
        not legal advice.
      </p>
    </section>
  );
}
