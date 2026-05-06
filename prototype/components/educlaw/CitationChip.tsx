"use client";

import { useState } from "react";
import { BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Citation } from "@/lib/mock/types";

export type CitationChipProps = {
  citation: Citation;
  className?: string;
};

export function CitationChip({ citation, className }: CitationChipProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <BookMarked className="h-3 w-3" aria-hidden="true" />
        {citation.source}
      </button>
      {open && (
        <div className="mt-1 rounded-md border bg-popover p-3 text-xs text-popover-foreground shadow-sm">
          <p className="italic">"{citation.excerpt}"</p>
          <a href={citation.href} className="mt-2 inline-block text-accent underline-offset-2 hover:underline">
            View source
          </a>
        </div>
      )}
    </div>
  );
}
