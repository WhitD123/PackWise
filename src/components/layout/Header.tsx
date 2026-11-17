import Link from "next/link";

const NAV = [
  { href: "/planner", label: "Planner" },
  { href: "/scan", label: "Scan" },
  { href: "/results", label: "Results" },
];

export function Header() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-serif text-2xl font-semibold text-forest">
          Packwise
        </Link>
        <nav className="flex gap-6 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-ink hover:text-forest hover:underline underline-offset-4">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
