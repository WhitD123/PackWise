// The packaging library: every component Packwise can recommend, with its source.
import type { Metadata } from "next";
import Link from "next/link";

import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { loadData } from "@/lib/data";

export const metadata: Metadata = { title: "Packaging library | Packwise" };

export default function LibraryPage() {
  const data = loadData();
  const { components, materials } = data.catalog;
  const suppliers = [...new Set(components.map((c) => c.supplier))];
  const checked = components.map((c) => c.last_checked).sort().at(-1);
  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-semibold text-forest">Packaging library</h1>
        <p className="mt-3 text-lg text-muted">
          Every box, mailer, filler, wrap and insert Packwise can recommend: {components.length} real products from{" "}
          {new Intl.ListFormat("en", { type: "conjunction" }).format(suppliers)}, with their size, weight, price and the page
          each number came from. Prices were checked on {checked} and are what the supplier charged then.
        </p>
        <p className="mt-3 text-base">
          Drawings share one scale, so you can compare sizes at a glance. Open any item for how to dispose of it, recycled
          content and our notes.{" "}
          <Link href="/how-it-works#materials" className="font-semibold text-forest underline underline-offset-4">
            How materials are scored
          </Link>
        </p>
      </header>
      <LibraryBrowser components={components} materials={materials} />
    </div>
  );
}
