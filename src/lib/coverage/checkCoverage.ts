// "Am I covered?" check (CLAUDE.md section 8). Pure functions: rules and fee
// schedules come in as arguments, so tests can pass any data and the app reads
// files in one place (src/lib/data.ts).
//
// Per state with a law:
//   1. Pounds of packaging delivered into the state = orders there x packaging per order.
//   2. Small-producer tests from state-coverage.json (revenue and/or weight).
//   3. Result: covered, exempt, apply_for_exemption (California), or no_law.
//   4. If covered and a fee schedule exists: fee = pounds x rate per material.

import { estimateFees, GRAMS_PER_LB } from "./estimateFees.ts";
import type { CoverageInput, CoverageResult, FeeSchedule, StateCoverageRule } from "./types.ts";

/**
 * "Close to the line" band for in-state revenue tests (California).
 * Our design suggestion from data/rules/epr-logic.json, not a legal figure.
 */
export const CLOSE_TO_LINE_BAND = 0.2;

export function formatUsd(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${Number((v / 1_000_000).toFixed(2))}M`;
  return `$${Math.round(v).toLocaleString("en-US")}`;
}

function formatLb(v: number): string {
  return `${Math.round(v).toLocaleString("en-US")} lb`;
}

function totalGrams(byMaterial: Record<string, number>): number {
  return Object.values(byMaterial).reduce((s, g) => s + (g > 0 ? g : 0), 0);
}

export function checkState(
  rule: StateCoverageRule,
  input: CoverageInput,
  schedules: Record<string, FeeSchedule>,
): CoverageResult {
  const base = { state: rule.state, source_url: rule.source_url, last_checked: rule.last_checked };

  if (rule.law_status === "none") {
    return {
      ...base,
      result: "no_law",
      reason: `${rule.name} has no packaging law yet.`,
      fee_usd_per_year: null,
      fee_status: "none",
      weight_lb_per_year: 0,
      close_to_line: false,
      needs_input: null,
      warnings: [],
    };
  }

  const orders = input.ordersPerYearByState[rule.state] ?? 0;
  const weightLb = (orders * totalGrams(input.packagingGramsPerOrderByMaterial)) / GRAMS_PER_LB;

  // Revenue test: global revenue, or sales delivered into this state.
  const revenueValue =
    rule.revenue_scope === "global"
      ? input.seller.worldwideRevenueUsd
      : rule.state === "CA"
        ? input.seller.californiaSalesUsd
        : null;
  const threshold = rule.revenue_threshold_usd;
  const revenueKnown = revenueValue !== null && threshold !== null;
  const revenueExempt = revenueKnown && revenueValue < threshold;
  const weightExempt =
    rule.exempt_if === "any_test" && rule.weight_threshold_lb !== null && weightLb < rule.weight_threshold_lb;

  const closeToLine =
    revenueKnown &&
    rule.revenue_scope === "in_state" &&
    Math.abs(revenueValue - threshold) / threshold <= CLOSE_TO_LINE_BAND;

  const scopeText = rule.revenue_scope === "in_state" ? `${rule.name} sales` : "worldwide revenue";
  const shared = { ...base, weight_lb_per_year: weightLb, close_to_line: closeToLine };

  // Exempt by either test.
  if (revenueExempt || weightExempt) {
    let reason: string;
    if (revenueExempt) {
      reason = `${scopeText[0].toUpperCase()}${scopeText.slice(1)} of ${formatUsd(revenueValue)} is under the ${formatUsd(threshold)} limit.`;
    } else {
      reason = `About ${formatLb(weightLb)} of packaging goes into ${rule.name}, under the ${formatLb(rule.weight_threshold_lb!)} limit.`;
    }
    if (rule.application_required) {
      return {
        ...shared,
        result: "apply_for_exemption",
        reason: closeToLine
          ? `Close to the line: ${reason} Use your actual ${rule.name} sales, and you must apply to claim the exemption.`
          : `${reason} You must apply to claim the exemption.`,
        fee_usd_per_year: null,
        fee_status: "none",
        needs_input: null,
        warnings: [],
      };
    }
    return {
      ...shared,
      result: "exempt",
      reason: `Exempt: ${reason}`,
      fee_usd_per_year: null,
      fee_status: "none",
      needs_input: null,
      warnings: [],
    };
  }

  // Covered, or not enough information to say otherwise.
  const needsInput =
    !revenueKnown && threshold !== null
      ? rule.revenue_scope === "in_state"
        ? `Enter your ${rule.name} sales to check this state.`
        : "Enter your yearly revenue to check this state."
      : null;

  const reasons: string[] = [];
  if (revenueKnown) reasons.push(`${scopeText} of ${formatUsd(revenueValue)} is over the ${formatUsd(threshold)} limit`);
  if (rule.exempt_if === "any_test" && rule.weight_threshold_lb !== null) {
    reasons.push(`about ${formatLb(weightLb)} of packaging goes into ${rule.name}, over the ${formatLb(rule.weight_threshold_lb)} limit`);
  }
  let reason = reasons.length > 0 ? `Covered: ${reasons.join(" and ")}.` : `Covered unless you qualify for an exemption.`;
  if (needsInput) reason = `Treated as covered until you enter more: ${needsInput}`;
  if (closeToLine) reason = `Close to the line: ${reason} Use your actual ${rule.name} sales.`;

  const schedule = rule.fee_file ? schedules[rule.fee_file] : undefined;
  if (!schedule) {
    return {
      ...shared,
      result: "covered",
      reason: `${reason} No fees yet.`,
      fee_usd_per_year: null,
      fee_status: "none",
      needs_input: needsInput,
      warnings: [],
    };
  }

  const fee = estimateFees(schedule, orders, input.packagingGramsPerOrderByMaterial);
  return {
    ...shared,
    result: "covered",
    reason,
    fee_usd_per_year: fee.fee_usd_per_year,
    fee_status: schedule.status,
    needs_input: needsInput,
    warnings: fee.warnings,
  };
}

/** One result per state that has a law. States without a law are left out. */
export function checkCoverage(
  rules: StateCoverageRule[],
  input: CoverageInput,
  schedules: Record<string, FeeSchedule>,
): CoverageResult[] {
  return rules.filter((r) => r.law_status !== "none").map((r) => checkState(r, input, schedules));
}
