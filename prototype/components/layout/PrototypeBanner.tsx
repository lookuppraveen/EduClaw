import { TriangleAlert } from "lucide-react";

export function PrototypeBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-warning text-warning-foreground px-4 py-1.5 text-xs font-medium"
    >
      <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
      <span>
        EduClaw Phase 1 Prototype — mock data only, no backend, no real LLM. For stakeholder review.
      </span>
    </div>
  );
}
