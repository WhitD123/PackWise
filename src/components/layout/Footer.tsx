import { dataLastUpdated, loadData } from "@/lib/data";

export function Footer() {
  const data = loadData();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
        <span>Packwise: an Arbiter Hacks V1 project. Estimates only, not legal advice.</span>
        <span>
          Data last updated {dataLastUpdated(data) ?? "unknown"}. Shipping is {data.shipping.carrier} {data.shipping.service}{" "}
          to the 50 states and DC; zones are exact from Portland and estimated from other ZIP codes. Sources in SOURCES.md.
        </span>
      </div>
    </footer>
  );
}
