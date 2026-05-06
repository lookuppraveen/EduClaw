import { CheckCircle2, AlertTriangle, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationVerdict } from "@/lib/mock/types";

export type ValidationVerdictRibbonProps = {
  verdict: ValidationVerdict;
  audience?: "student" | "faculty";
};

const STYLES: Record<
  ValidationVerdict["status"],
  { wrap: string; iconWrap: string; Icon: typeof CheckCircle2; label: string }
> = {
  approved: {
    wrap: "border-success/40 bg-success/10",
    iconWrap: "text-success",
    Icon: CheckCircle2,
    label: "Approved",
  },
  modified: {
    wrap: "border-warning/40 bg-warning/10",
    iconWrap: "text-warning",
    Icon: AlertTriangle,
    label: "Modified for learning",
  },
  blocked: {
    wrap: "border-destructive/40 bg-destructive/10",
    iconWrap: "text-destructive",
    Icon: ShieldOff,
    label: "Blocked",
  },
};

export function ValidationVerdictRibbon({ verdict, audience = "student" }: ValidationVerdictRibbonProps) {
  const { wrap, iconWrap, Icon, label } = STYLES[verdict.status];
  const showFullReason = audience === "faculty" || verdict.status === "blocked";

  return (
    <div
      role="status"
      className={cn("flex items-start gap-3 rounded-md border px-3 py-2 text-sm", wrap)}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconWrap)} aria-hidden="true" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{label}</span>
          {verdict.policyClause && (
            <span className="text-xs text-muted-foreground">Policy: {verdict.policyClause}</span>
          )}
        </div>
        <p className="text-xs">
          {audience === "student" && verdict.studentFacingMessage
            ? verdict.studentFacingMessage
            : showFullReason
            ? verdict.reason
            : null}
        </p>
      </div>
    </div>
  );
}
