export function Stepper({
  steps,
  current,
  onSelect,
}: {
  steps: string[];
  current: number;
  onSelect?: (i: number) => void;
}) {
  return (
    <ol className="mb-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-3 text-sm">
      {steps.map((s, i) => {
        const state = i === current ? "text-forest font-semibold" : i < current ? "text-moss" : "text-muted";
        return (
          <li key={s}>
            <button
              type="button"
              className={`${state} ${onSelect && i < current ? "hover:underline underline-offset-4" : ""}`}
              onClick={() => onSelect && i < current && onSelect(i)}
              aria-current={i === current ? "step" : undefined}
            >
              <span className="mr-1.5 font-serif">{i + 1}.</span>
              {s}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
