import { ChevronRight, Brain, MessageCircleQuestion, Sparkles, ShieldCheck, Notebook } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentHop } from "@/lib/mock/types";

const ICONS = {
  inference: Brain,
  dialogue: MessageCircleQuestion,
  execution: Sparkles,
  validation: ShieldCheck,
  reflection: Notebook,
} as const;

const COLORS = {
  inference: "bg-accent/10 text-accent border-accent/30",
  dialogue: "bg-primary/10 text-primary border-primary/30",
  execution: "bg-secondary text-secondary-foreground border-border",
  validation: "bg-warning/10 text-warning border-warning/30",
  reflection: "bg-success/10 text-success border-success/30",
} as const;

export type AgentHopDiagramProps = {
  hops: AgentHop[];
  className?: string;
};

export function AgentHopDiagram({ hops, className }: AgentHopDiagramProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} aria-label="Agent hop diagram">
      {hops.map((hop, i) => {
        const Icon = ICONS[hop.agent];
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs",
                COLORS[hop.agent]
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <div className="leading-tight">
                <div className="font-medium capitalize">{hop.agent}</div>
                <div className="text-[10px] opacity-80 tabular-nums">{hop.durationMs}ms</div>
              </div>
            </div>
            {i < hops.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}
