import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-sm border border-line bg-surface p-5 ${className}`}>{children}</div>;
}

export function SectionHeading({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-semibold text-forest">{title}</h2>
      {lead && <p className="mt-1 max-w-2xl text-muted">{lead}</p>}
    </div>
  );
}
