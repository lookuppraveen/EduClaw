"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MasteryDot } from "@/components/educlaw/MasteryDot";
import { useMockData } from "@/lib/mock/MockDataProvider";

export default function StudentDashboardPage() {
  const { learnerState, courses } = useMockData();
  const calc = courses.find((c) => c.id === "c_calc1")!;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hi Maya — what's on your mind today?</h1>
          <p className="text-sm text-muted-foreground">
            Your companion is here to help you think it through, not finish it for you.
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/student/conversation">
            <Sparkles className="h-4 w-4" />
            Open conversation
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{calc.code} — {calc.title}</CardTitle>
              <CardDescription>Mastery snapshot · {calc.term}</CardDescription>
            </div>
            <Badge variant="outline">{calc.enrollmentCount} students</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {calc.outcomes.map((o) => {
            const m = learnerState.mastery.find((x) => x.outcomeId === o.id);
            const value = m?.estimate ?? 0;
            return (
              <div key={o.id} className="flex items-center gap-3">
                <MasteryDot value={value} label={`${o.label}: ${(value * 100).toFixed(0)}%`} />
                <div className="flex-1 text-sm">{o.label}</div>
                <div className="w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-1.5 bg-accent"
                    style={{ width: `${Math.max(2, value * 100)}%` }}
                    aria-hidden="true"
                  />
                </div>
                <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                  {(value * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's nudges</CardTitle>
            <CardDescription>Gentle prompts based on your week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-md border p-3">
              <p className="font-medium">Chain rule still feels shaky.</p>
              <p className="text-muted-foreground">Want to try two short worked examples?</p>
              <Button asChild size="sm" variant="link" className="mt-2 h-auto p-0">
                <Link href="/student/conversation">Open conversation <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">You haven't reflected this week.</p>
              <p className="text-muted-foreground">A one-sentence reflection helps it stick.</p>
              <Button asChild size="sm" variant="link" className="mt-2 h-auto p-0">
                <Link href="/student/journal">Open journal <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your goals</CardTitle>
            <CardDescription>You set these — EduClaw uses them to stay on track.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Explicit</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {learnerState.goals.explicit.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Inferred</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
                {learnerState.goals.inferred.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
