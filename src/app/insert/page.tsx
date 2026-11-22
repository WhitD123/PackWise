import type { Metadata } from "next";
import { Suspense } from "react";

import { PrintableInsert } from "@/components/insert/PrintableInsert";
import { loadData } from "@/lib/data";

export const metadata: Metadata = { title: "Customer insert | Packwise" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Reads the setup and shop name from the link. It is inside Suspense because the query is only known per request. */
async function InsertFromQuery({ searchParams }: { searchParams: PageProps<"/insert">["searchParams"] }) {
  const q = await searchParams;
  return <PrintableInsert data={loadData()} setupKey={one(q.setup)} shopName={one(q.shop).slice(0, 60)} />;
}

export default function InsertPage({ searchParams }: PageProps<"/insert">) {
  return (
    <Suspense fallback={<p className="text-muted">Preparing your card…</p>}>
      <InsertFromQuery searchParams={searchParams} />
    </Suspense>
  );
}
