import { num, pounds } from "@/lib/format";
import type { Swap } from "@/lib/types";

const SELLERS = 1000;

/** "If 1,000 similar sellers made the same swap", with the math shown (brief video segment 2:15). */
export function ImpactSummary({ swap, ordersPerYear }: { swap: Swap; ordersPerYear: number }) {
  const perSeller = swap.plastic_avoided_lb_per_year;
  if (perSeller <= 0) return null;
  const total = perSeller * SELLERS;
  return (
    <div className="rounded-sm bg-forest p-6 text-paper">
      <p className="text-sm uppercase tracking-wide text-kraft">If {num(SELLERS)} similar sellers made this swap</p>
      <p className="mt-2 font-serif text-4xl font-semibold">{num(total / 2000, 1)} tons of plastic avoided a year</p>
      <p className="mt-3 text-sm text-paper/80">
        {pounds(perSeller)} per seller ({num(ordersPerYear)} orders a year) × {num(SELLERS)} sellers ={" "}
        {num(total)} lb ≈ {num(total / 2000, 1)} US tons.
      </p>
    </div>
  );
}
