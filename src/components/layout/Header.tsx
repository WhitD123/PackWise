import Link from "next/link";

import { NavLinks } from "./NavLinks";

/** The mark is the app's own picture: a carton from above with the product inside. */
function Mark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
      <rect x="1.5" y="1.5" width="21" height="21" fill="var(--kraft)" stroke="var(--forest)" strokeWidth="2" />
      <rect x="7" y="7" width="10" height="10" fill="var(--forest)" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="border-b border-line bg-paper print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-serif text-2xl font-bold text-forest">
          <Mark />
          Packwise
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
