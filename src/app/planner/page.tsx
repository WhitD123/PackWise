import type { Metadata } from "next";

import { PlannerForm } from "@/components/planner/PlannerForm";
import { loadData } from "@/lib/data";

export const metadata: Metadata = { title: "Plan your packaging | Packwise" };

export default function PlannerPage() {
  const data = loadData();
  return (
    <div>
      <h1 className="mb-2 text-4xl font-semibold text-forest">Plan your packaging</h1>
      <p className="mb-8 max-w-2xl text-lg text-muted">
        Three quick steps. We test every box, mailer and filler in our library against your order and show the
        cheapest, the best balance, and the lowest-waste setup.
      </p>
      <PlannerForm data={data} />
    </div>
  );
}
