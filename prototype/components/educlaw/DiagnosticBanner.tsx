"use client";

import { useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfidencePip } from "./ConfidencePip";
import type { InferenceDiagnosis } from "@/lib/mock/types";

export type DiagnosticBannerProps = {
  diagnosis: InferenceDiagnosis;
  studentFacing?: boolean; // if true, hide rationale (faculty/auditor see full)
  message?: string;
};

export function DiagnosticBanner({ diagnosis, studentFacing = true, message }: DiagnosticBannerProps) {
  const [open, setOpen] = useState(!studentFacing);
  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
          <div className="flex-1 space-y-1">
            <p className="text-sm">
              {message ??
                "Looks like you might be working through something tricky — want to talk through it together?"}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <ConfidencePip value={diagnosis.confidence} />
              <span aria-hidden="true">·</span>
              <span className="capitalize">{diagnosis.confusionLevel} confusion</span>
            </div>
          </div>
          {!studentFacing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="diagnostic-detail"
            >
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="sr-only">Toggle detail</span>
            </Button>
          )}
        </div>

        {open && (
          <div id="diagnostic-detail" className="ml-7 grid gap-1 border-t pt-2 text-xs text-muted-foreground">
            <div><span className="font-medium text-foreground">Intent:</span> {diagnosis.intent}</div>
            <div><span className="font-medium text-foreground">Knowledge gap:</span> {diagnosis.knowledgeGap}</div>
            <div><span className="font-medium text-foreground">Urgency:</span> {diagnosis.urgency}</div>
            <div><span className="font-medium text-foreground">Rationale:</span> {diagnosis.rationale}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
