"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Sparkles, BookOpen, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DiagnosticBanner } from "@/components/educlaw/DiagnosticBanner";
import { MasteryDot } from "@/components/educlaw/MasteryDot";
import { useMockData } from "@/lib/mock/MockDataProvider";

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { courses, learnerState, heroTurn } = useMockData();
  const course = courses.find((c) => c.id === id);
  if (!course) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/student/courses">
          <ChevronLeft className="h-4 w-4" />
          All courses
        </Link>
      </Button>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {course.code} — {course.title}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {course.term} · {course.enrollmentCount} students · {course.outcomes.length} outcomes
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/student/conversation">
            <Sparkles className="h-4 w-4" />
            Open conversation
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">This week</CardTitle>
              <CardDescription>Active assignment and due items.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Homework 5 — Chain Rule</p>
                  <Badge variant="warning">Due Friday</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  10 problems · 50 points · Validation Policy: scaffolds only on graded items
                </p>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Quiz 3 — Limits review</p>
                  <Badge variant="outline">Next week</Badge>
                </div>
                <p className="text-xs text-muted-foreground">In-class · 25 minutes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outcomes &amp; mastery</CardTitle>
              <CardDescription>Your standing on each course outcome.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {course.outcomes.map((o) => {
                const m = learnerState.mastery.find((x) => x.outcomeId === o.id);
                const value = m?.estimate ?? 0;
                return (
                  <div key={o.id} className="flex items-center gap-3">
                    <MasteryDot value={value} />
                    <div className="flex-1 text-sm">{o.label}</div>
                    <div className="w-32 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-1.5 bg-accent"
                        style={{ width: `${Math.max(2, value * 100)}%` }}
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
        </div>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <Card className="border-accent/40">
            <CardHeader className="bg-accent/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                  <CardTitle className="text-sm">EduClaw companion</CardTitle>
                </div>
                <Badge variant="outline">In-course</Badge>
              </div>
              <CardDescription className="text-xs">
                Aware of {course.code} and your active assignment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <DiagnosticBanner
                diagnosis={heroTurn.diagnosis}
                studentFacing
                message="Looks like the chain rule is still feeling shaky — want to walk through it?"
              />
              <Separator />
              <Button asChild variant="accent" className="w-full">
                <Link href="/student/conversation">
                  <MessageSquare className="h-4 w-4" />
                  Start a conversation
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Anything you ask here stays inside the {course.code} course context.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
