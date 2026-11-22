import Link from "next/link";

import { dataLastUpdated, loadData } from "@/lib/data";

/** About, privacy and data freshness in one place (NN/g: group the "who we are" information). */
export function Footer() {
  const data = loadData();
  return (
    <footer className="border-t border-line bg-surface print:hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-serif text-lg font-semibold text-forest">About Packwise</p>
          <p className="mt-2 text-muted">
            A free tool that helps small online shops choose shipping packaging that costs less and creates less waste.
            Built by a two-person team for Arbiter Hacks V1, using public data only. It sells nothing and earns nothing
            from the suppliers it lists.
          </p>
        </div>
        <div>
          <p className="font-serif text-lg font-semibold text-forest">Your information</p>
          <p className="mt-2 text-muted">
            Your answers are saved only in your own browser. An order file you upload is read in your browser and is not
            sent anywhere. A photo you scan is sent to Google&rsquo;s Gemini to read the parts; Packwise does not store it.
          </p>
        </div>
        <div>
          <p className="font-serif text-lg font-semibold text-forest">The numbers</p>
          <p className="mt-2 text-muted">
            Estimates from public data, not legal advice. Data last updated {dataLastUpdated(data) ?? "unknown"}. Shipping is{" "}
            {data.shipping.carrier} {data.shipping.service} to the 50 states and DC.
          </p>
          <p className="mt-2">
            <Link href="/how-it-works" className="font-semibold text-forest underline underline-offset-4">
              How we calculate this
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
