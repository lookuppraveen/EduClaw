import { cn } from "@/lib/utils";

export type MasteryDotProps = {
  value: number; // 0–1
  label?: string;
  size?: "sm" | "md" | "lg";
};

export function MasteryDot({ value, label, size = "md" }: MasteryDotProps) {
  const pct = Math.max(0, Math.min(1, value));
  const tone =
    pct >= 0.85 ? "bg-success" : pct >= 0.6 ? "bg-accent" : pct >= 0.3 ? "bg-warning" : "bg-destructive";
  const dim = size === "sm" ? "h-2.5 w-2.5" : size === "lg" ? "h-4 w-4" : "h-3 w-3";

  return (
    <span
      className={cn("inline-block rounded-full", tone, dim)}
      role="img"
      aria-label={label ?? `Mastery ${(pct * 100).toFixed(0)} percent`}
    />
  );
}
