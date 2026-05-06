"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CitationChip } from "./CitationChip";
import type { ExecutionResponse } from "@/lib/mock/types";

export type ScaffoldedResponseProps = {
  response: ExecutionResponse;
  onAction?: (kind: string) => void;
};

export function ScaffoldedResponse({ response, onAction }: ScaffoldedResponseProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
          <p className="text-sm leading-relaxed">{response.scaffold}</p>
        </div>

        {response.workedExamples.length > 0 && (
          <div className="ml-6 space-y-2">
            {response.workedExamples.map((ex) => (
              <div key={ex.title} className="rounded-md border bg-muted/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {ex.title}
                </p>
                <p className="mt-1 font-serif text-sm">{ex.body}</p>
              </div>
            ))}
          </div>
        )}

        {response.citations.length > 0 && (
          <div className="ml-6 flex flex-wrap gap-2">
            {response.citations.map((c) => (
              <CitationChip key={c.id} citation={c} />
            ))}
          </div>
        )}

        {response.suggestedAction && (
          <div className="ml-6">
            <Button
              variant="accent"
              size="sm"
              onClick={() => onAction?.(response.suggestedAction!.kind)}
            >
              {response.suggestedAction.label}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
