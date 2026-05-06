"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ShieldCheck, Send, Flag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DiagnosticBanner } from "@/components/educlaw/DiagnosticBanner";
import { ScaffoldedResponse } from "@/components/educlaw/ScaffoldedResponse";
import { ValidationVerdictRibbon } from "@/components/educlaw/ValidationVerdictRibbon";
import { AgentHopDiagram } from "@/components/educlaw/AgentHopDiagram";
import { useMockData } from "@/lib/mock/MockDataProvider";
import { relativeTime } from "@/lib/utils";

export default function SingleFlaggedTurnPage({
  params,
}: {
  params: Promise<{ turnId: string }>;
}) {
  const { turnId } = use(params);
  const { flaggedTurns } = useMockData();
  const turn = flaggedTurns.find((t) => t.id === turnId);
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<null | "approve" | "override" | "escalate">(null);

  if (!turn) notFound();

  const submit = (kind: "approve" | "override" | "escalate") => {
    setDecision(kind);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/faculty/review">
          <ChevronLeft className="h-4 w-4" />
          Back to queue
        </Link>
      </Button>

      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Flagged turn — {turn.studentName}
          </h1>
          <Badge variant="outline">{turn.id}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Flagged {relativeTime(turn.flaggedAt)} · Status: {turn.reviewStatus}
        </p>
      </header>

      {decision && (
        <div className="rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">
          Recorded — turn {decision}d. (Prototype: action is logged locally only.)
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student input</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-muted/40 p-3 text-sm italic">
                "{turn.studentInput}"
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inference diagnosis</CardTitle>
              <CardDescription>What the agent believed was happening before responding.</CardDescription>
            </CardHeader>
            <CardContent>
              <DiagnosticBanner diagnosis={turn.diagnosis} studentFacing={false} />
            </CardContent>
          </Card>

          {turn.execution && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Execution agent output</CardTitle>
                <CardDescription>What was returned to the student (post-validation).</CardDescription>
              </CardHeader>
              <CardContent>
                <ScaffoldedResponse response={turn.execution} />
              </CardContent>
            </Card>
          )}

          {turn.validation && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                  <CardTitle className="text-base">Validation verdict</CardTitle>
                </div>
                <CardDescription>Faculty view — full reasoning shown.</CardDescription>
              </CardHeader>
              <CardContent>
                <ValidationVerdictRibbon verdict={turn.validation} audience="faculty" />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Faculty decision</CardTitle>
              <CardDescription>
                {turn.facultyNote
                  ? "Previous note recorded; you can add a new one."
                  : "Approve the agent's call, override it, or escalate to academic integrity."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {turn.facultyNote && (
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Previous note</p>
                  <p className="mt-1">{turn.facultyNote}</p>
                </div>
              )}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note for the audit trail…"
                className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => submit("approve")}>
                    <Send className="h-4 w-4" />
                    Approve agent's call
                  </Button>
                  <Button variant="outline" onClick={() => submit("override")}>
                    Override
                  </Button>
                </div>
                <Button variant="destructive" size="sm" onClick={() => submit("escalate")}>
                  <Flag className="h-4 w-4" />
                  Escalate to integrity office
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Agent hops</CardTitle>
              <CardDescription className="text-xs">
                Order and timing of every agent that ran.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgentHopDiagram hops={turn.hops} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div>
                <p className="text-muted-foreground">Student</p>
                <p className="font-medium">{turn.studentName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Course</p>
                <p className="font-medium">MATH 1550 — Calculus I</p>
              </div>
              <div>
                <p className="text-muted-foreground">Assignment</p>
                <p className="font-medium">{turn.assignmentId}</p>
              </div>
              <Separator />
              <p className="text-muted-foreground">
                FERPA reminder: only the student and authorized faculty may view this trace.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
