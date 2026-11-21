import type { ReactNode } from "react";

/**
 * A heads-up the reader should not miss: an estimate, a proposed rate, a limit.
 * Ochre is only a fill and a border here (it fails contrast as text on paper); the words are ink.
 */
export function Warning({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div role="note" className={`flex gap-2 border-l-4 border-ochre bg-ochre/10 py-2 pl-3 pr-3 text-sm text-ink ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0">
        <path d="M8 1.5 15 14H1z" fill="var(--ochre)" />
        <rect x="7.25" y="6" width="1.5" height="4.5" fill="var(--ink)" />
        <rect x="7.25" y="11.5" width="1.5" height="1.5" fill="var(--ink)" />
      </svg>
      <div>{children}</div>
    </div>
  );
}
