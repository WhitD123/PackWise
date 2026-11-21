"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/planner", label: "Planner" },
  { href: "/scan", label: "Scan" },
  { href: "/results", label: "Results" },
  { href: "/how-it-works", label: "How it works" },
];

/** The current page is underlined, so the reader always knows where they are. */
export function NavLinks() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-wrap gap-x-6 gap-y-1 text-base">
      {NAV.map((n) => {
        const here = path === n.href || path.startsWith(`${n.href}/`);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={here ? "page" : undefined}
            className={`underline-offset-[6px] hover:underline ${here ? "font-semibold text-forest underline decoration-2" : "text-ink"}`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
