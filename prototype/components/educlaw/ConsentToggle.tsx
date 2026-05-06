"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { relativeTime } from "@/lib/utils";
import type { ConsentScope } from "@/lib/mock/types";

export type ConsentToggleProps = {
  scope: ConsentScope;
  onChange?: (granted: boolean) => void;
};

export function ConsentToggle({ scope, onChange }: ConsentToggleProps) {
  const id = `consent-${scope.id}`;
  return (
    <div className="flex items-start justify-between gap-4 border-b py-4 last:border-0">
      <div className="flex-1">
        <Label htmlFor={id} className="text-sm font-medium">
          {scope.label}
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">{scope.description}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Last updated {relativeTime(scope.updatedAt)}
        </p>
      </div>
      <Switch
        id={id}
        checked={scope.granted}
        onCheckedChange={(v) => onChange?.(v)}
        aria-label={`Toggle consent: ${scope.label}`}
      />
    </div>
  );
}
