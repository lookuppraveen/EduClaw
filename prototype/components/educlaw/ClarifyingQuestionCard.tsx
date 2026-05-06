"use client";

import { MessageCircleQuestion } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DialoguePrompt } from "@/lib/mock/types";

export type ClarifyingQuestionCardProps = {
  prompt: DialoguePrompt;
  onPick?: (value: string) => void;
};

export function ClarifyingQuestionCard({ prompt, onPick }: ClarifyingQuestionCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-2">
          <MessageCircleQuestion className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
          <p className="text-sm">{prompt.question}</p>
        </div>
        <div className="ml-6 flex flex-wrap gap-2">
          {prompt.chips.map((chip) => (
            <Button
              key={chip.value}
              variant="outline"
              size="sm"
              onClick={() => onPick?.(chip.value)}
            >
              {chip.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
