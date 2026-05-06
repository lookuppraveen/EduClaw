"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentHopDiagram } from "@/components/educlaw/AgentHopDiagram";
import { useMockData } from "@/lib/mock/MockDataProvider";

export default function AuditorDashboard() {
  const { heroTurn, users } = useMockData();
  const student = users.student;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Trace explorer</h1>
        <p className="text-sm text-muted-foreground">
          Read-only view of how agents handled each turn. Used for FERPA review and academic integrity audits.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Most recent turn</CardTitle>
              <CardDescription>
                {student.name} — MATH 1550 · Homework 5 (chain rule)
              </CardDescription>
            </div>
            <Badge variant="warning">Validation: Modified</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Student input</p>
            <p className="mt-1 italic">"{heroTurn.studentInput}"</p>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Agent hops</p>
            <AgentHopDiagram hops={heroTurn.hops} />
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Inference diagnosis</p>
              <p className="mt-1"><span className="font-medium">Intent:</span> {heroTurn.diagnosis.intent}</p>
              <p><span className="font-medium">Gap:</span> {heroTurn.diagnosis.knowledgeGap}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Validation outcome</p>
              <p className="mt-1"><span className="font-medium">Status:</span> {heroTurn.validation?.status}</p>
              <p><span className="font-medium">Reason:</span> {heroTurn.validation?.reason}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
