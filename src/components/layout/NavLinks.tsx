"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Links are named by what the visitor gets, not by how the app is built (NN/g: specific, descriptive labels).
const NAV = [
  { href: "/results", label: "Example results" },
  { href: "/scan", label: "Scan a photo" },
  { href: "/library", label: "Packaging library" },
  { href: "/how-it-works", label: "How we calculate" },
];

/** The current page is underlined, so the reader always knows where they are. The main task is a button. */
export function NavLinks() {
  const path = usePathname();
  const here = (href: string) => path === href || path.startsWith(`${href}/`);
  return (
    <nav aria-label="Main" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          aria-current={here(n.href) ? "page" : undefined}
          className={`underline-offset-[6px] hover:underline ${here(n.href) ? "font-semibold text-forest underline decoration-2" : "text-ink"}`}
        >
          {n.label}
        </Link>
      ))}
      <Link
        href="/planner"
        aria-current={here("/planner") ? "page" : undefined}
        className="rounded-sm bg-forest px-4 py-2 font-semibold text-paper hover:bg-moss"
      >
        Check my packaging
      </Link>
    </nav>
  );
}
