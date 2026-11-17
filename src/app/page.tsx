// PLACEHOLDER landing page so the starter template's broken images are gone.
// Tyler owns the real landing page.
import { ButtonLink } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="max-w-3xl py-10">
      <h1 className="text-5xl font-semibold leading-tight text-forest">
        Packaging that costs less, ships smaller, and keeps plastic out of landfills.
      </h1>
      <p className="mt-5 text-lg text-muted">
        Most packaging waste is locked in the day a small brand picks its boxes and mailers. Packwise checks your
        setup and shows a better one, with what it saves.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/planner">Plan your packaging</ButtonLink>
        <ButtonLink href="/results" variant="secondary">
          See the demo seller
        </ButtonLink>
      </div>
    </div>
  );
}
