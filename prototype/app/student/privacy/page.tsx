"use client";

import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConsentToggle } from "@/components/educlaw/ConsentToggle";
import { useMockData } from "@/lib/mock/MockDataProvider";
import type { ConsentScope } from "@/lib/mock/types";

export default function PrivacyCenterPage() {
  const { learnerState } = useMockData();
  const [scopes, setScopes] = useState<ConsentScope[]>(learnerState.consentLedger);

  const update = (id: string, granted: boolean) => {
    setScopes((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, granted, updatedAt: new Date().toISOString() } : s
      )
    );
  };

  const grantedCount = scopes.filter((s) => s.granted).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight">Privacy Center</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          You decide what EduClaw can see and remember. Toggles take effect immediately.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Consent ledger</CardTitle>
              <CardDescription>
                {grantedCount} of {scopes.length} scopes granted.
              </CardDescription>
            </div>
            <Badge variant="outline">FERPA-aligned</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {scopes.map((scope) => (
            <ConsentToggle
              key={scope.id}
              scope={scope}
              onChange={(granted) => update(scope.id, granted)}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="border-accent/40 bg-accent/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
          <div>
            <p className="font-medium">Your data, your call.</p>
            <p className="text-muted-foreground">
              EduClaw never trains on your data without explicit institutional opt-in. Every scope expansion is
              logged and auditable.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
