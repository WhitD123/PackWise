"use client";

import { useEffect, useState } from "react";

/**
 * A bar of links to the parts of a long page. It stays at the top while you scroll and marks the part you are
 * reading, so a first-time visitor always knows where they are and what comes next.
 */
export function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => e !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    els.forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this page" className="sticky top-0 z-20 -mx-4 border-y border-line bg-paper/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
      <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? "location" : undefined}
              className={`underline-offset-[6px] hover:underline ${active === s.id ? "font-semibold text-forest underline decoration-2" : "text-ink"}`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
