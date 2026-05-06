import { cn } from "@/lib/utils";

export type ConfidencePipProps = {
  value: number; // 0–1
  label?: string;
  className?: string;
};

export function ConfidencePip({ value, label, className }: ConfidencePipProps) {
  const pct = Math.max(0, Math.min(1, value));
  const filled = Math.round(pct * 5);
  const tone = pct >= 0.75 ? "bg-success" : pct >= 0.5 ? "bg-accent" : "bg-warning";

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={label ?? `Confidence ${(pct * 100).toFixed(0)} percent`}
      role="img"
    >
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-2 rounded-full",
              i < filled ? tone : "bg-muted"
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{(pct * 100).toFixed(0)}%</span>
    </div>
  );
}
