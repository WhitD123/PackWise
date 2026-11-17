import type { Metadata } from "next";

import { ResultsView } from "@/components/results/ResultsView";
import { loadData } from "@/lib/data";

export const metadata: Metadata = { title: "Your options | Packwise" };

export default function ResultsPage() {
  return <ResultsView data={loadData()} />;
}
