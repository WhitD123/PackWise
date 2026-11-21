import type { ReactNode } from "react";

type Tone = "forest" | "moss" | "brick" | "ochre" | "neutral";

// Every pairing passes 4.5:1 on paper or on its own fill. Ochre is a border and tint only; its words are ink.
const TONES: Record<Tone, string> = {
  forest: "border-forest bg-forest text-paper",
  moss: "border-moss text-moss",
  brick: "border-brick text-brick",
  ochre: "border-ochre bg-ochre/15 text-ink",
  neutral: "border-line text-muted",
};

/** A short status word. Sentence case: it names something, it does not shout. */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-block rounded-sm border px-2 py-0.5 text-sm font-medium ${TONES[tone]}`}>{children}</span>;
}
