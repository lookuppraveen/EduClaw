"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck, Activity, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MasteryDot } from "@/components/educlaw/MasteryDot";
import { useMockData } from "@/lib/mock/MockDataProvider";
import { relativeTime } from "@/lib/utils";

export default function FacultyDashboard() {
  const { courses, policies, flaggedTurns, users } = useMockData();
  const me = users.faculty;
  const myCourse = courses.find((c) => c.id === "c_calc1")!;
  const myPolicy = policies[0];
  const pending = flaggedTurns.filter((t) => t.reviewStatus === "pending");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {me.name}</h1>
        <p className="text-sm text-muted-foreground">
          Three students need your attention. Two policies are active. One course mastery shift this week.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          icon={AlertCircle}
          tone="warning"
          label="Pending review"
          value={pending.length.toString()}
          href="/faculty/review"
          hint="flagged turns awaiting your call"
        />
        <StatTile
          icon={ShieldCheck}
          tone="accent"
          label="Active policies"
          value={policies.length.toString()}
          href="/faculty/policy"
          hint="across your courses"
        />
        <StatTile
          icon={Activity}
          tone="success"
          label="Class mastery shift"
          value="+4 pp"
          href="#"
          hint="chain rule mastery, last 7d"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{myCourse.code} — {myCourse.title}</CardTitle>
                <CardDescription>{myCourse.term} · {myCourse.enrollmentCount} students</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/faculty/courses">All courses <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Class mastery (median)</p>
            {myCourse.outcomes.map((o, i) => {
              const value = [0.78, 0.62, 0.34, 0.0][i] ?? 0;
              return (
                <div key={o.id} className="flex items-center gap-3">
                  <MasteryDot value={value} />
                  <div className="flex-1 text-sm">{o.label}</div>
                  <div className="w-32 overflow-hidden rounded-full bg-muted">
                    <div className="h-1.5 bg-accent" style={{ width: `${Math.max(2, value * 100)}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                    {(value * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">{myPolicy.title}</p>
                <p className="text-xs text-muted-foreground">
                  {myPolicy.clauses.length} clauses · updated {relativeTime(myPolicy.updatedAt)}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/faculty/policy">Edit policy <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recently flagged</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/faculty/review">Open queue</Link>
              </Button>
            </div>
            <CardDescription>Most recent four turns the Validation Agent flagged.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {flaggedTurns.slice(0, 4).map((t) => (
              <Link
                key={t.id}
                href={`/faculty/review/${t.id}`}
                className="flex items-start gap-3 rounded-md border p-3 text-sm transition-colors hover:border-accent/40 hover:bg-accent/5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                  {t.studentInitials}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.studentName}</span>
                    <VerdictBadge status={t.validation?.status ?? "approved"} />
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground italic">
                    "{t.studentInput}"
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {relativeTime(t.flaggedAt)} · {t.reviewStatus}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  tone,
  label,
  value,
  hint,
  href,
}: {
  icon: typeof BookOpen;
  tone: "warning" | "accent" | "success";
  label: string;
  value: string;
  hint: string;
  href: string;
}) {
  const toneClass =
    tone === "warning"
      ? "text-warning bg-warning/10"
      : tone === "success"
      ? "text-success bg-success/10"
      : "text-accent bg-accent/10";
  return (
    <Link href={href} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-md ${toneClass}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-semibold leading-tight tabular-nums">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function VerdictBadge({ status }: { status: "approved" | "modified" | "blocked" }) {
  if (status === "approved") return <Badge variant="success">Approved</Badge>;
  if (status === "modified") return <Badge variant="warning">Modified</Badge>;
  return <Badge variant="destructive">Blocked</Badge>;
}
