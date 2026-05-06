"use client";

import { useState } from "react";
import { Notebook, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReflectionPrompt as ReflectionPromptModel } from "@/lib/mock/types";

export type ReflectionPromptProps = {
  prompt: ReflectionPromptModel;
  onSubmit?: (response: string) => void;
};

export function ReflectionPrompt({ prompt, onSubmit }: ReflectionPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const [response, setResponse] = useState("");

  if (dismissed) return null;

  return (
    <Card className="border-dashed">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <Notebook className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
            <div>
              <p className="text-sm">{prompt.prompt}</p>
              <p className="text-xs text-muted-foreground">Optional — reflection helps it stick.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Dismiss reflection prompt" onClick={() => setDismissed(true)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="ml-6 space-y-2">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your reflection (one sentence is fine)…"
            className="min-h-[60px] w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
              Skip
            </Button>
            <Button size="sm" disabled={!response.trim()} onClick={() => onSubmit?.(response.trim())}>
              Save reflection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
