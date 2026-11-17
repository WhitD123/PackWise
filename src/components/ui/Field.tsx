import type { ReactNode } from "react";

const INPUT =
  "w-full rounded-sm border border-line bg-paper px-3 py-2 text-ink focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  step = "any",
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number | "any";
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        className={INPUT}
        value={Number.isFinite(value) ? value : ""}
        min={min}
        step={step}
        onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
      />
      {suffix && <span className="shrink-0 text-xs text-muted">{suffix}</span>}
    </div>
  );
}

export function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="text" className={INPUT} value={value} onChange={(e) => onChange(e.target.value)} />;
}

export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select className={INPUT} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
