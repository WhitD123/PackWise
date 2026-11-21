/** A 0..10 score as a thin bar: green when good, ochre in the middle, brick when poor. */
export function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = Math.max(0, Math.min(10, score)) * 10;
  const color = score >= 7 ? "bg-moss" : score >= 4 ? "bg-ochre" : "bg-brick";
  return (
    <div
      className="h-1.5 w-full rounded-full bg-line"
      role="meter"
      aria-label={`${label} score`}
      aria-valuetext={`${Math.round(score * 10) / 10} out of 10`}
      aria-valuemin={0}
      aria-valuemax={10}
      aria-valuenow={Math.round(score * 10) / 10}
    >
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
