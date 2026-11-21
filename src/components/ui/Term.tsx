"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

/**
 * A word a beginner may not know, with its plain meaning one tap away. A real button (keyboard and screen reader
 * friendly); Escape or a click elsewhere closes it.
 */
export function Term({ id, children }: { id: GlossaryKey; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const panelId = useId();
  const entry = GLOSSARY[id];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="cursor-help underline decoration-moss decoration-dotted decoration-2 underline-offset-4 hover:decoration-solid"
      >
        {children ?? entry.term}
      </button>
      {open && (
        <span
          id={panelId}
          className="pw-pop absolute left-0 top-full z-30 mt-2 block w-72 max-w-[calc(100vw-2rem)] border border-ink bg-surface p-3 text-left text-sm font-normal leading-snug text-ink shadow-[3px_3px_0_var(--ink)]"
        >
          <span className="mb-1 block font-serif text-base font-semibold text-forest">{entry.term}</span>
          {entry.def}
        </span>
      )}
    </span>
  );
}
