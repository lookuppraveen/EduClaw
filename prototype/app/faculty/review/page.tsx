"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, ArrowRight, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockData } from "@/lib/mock/MockDataProvider";
import { relativeTime } from "@/lib/utils";
import type { FlaggedTurn } from "@/lib/mock/fixtures/flagged-turns";

type StatusFilter = "all" | "pending" | "approved" | "overridden" | "escalated";

export default function FacultyReviewQueue() {
  const { flaggedTurns } = useMockData();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return flaggedTurns.filter((t) => {
      if (filter !== "all" && t.reviewStatus !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          t.studentName.toLowerCase().includes(q) ||
          t.studentInput.toLowerCase().includes(q) ||
          (t.validation?.reason ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [flaggedTurns, filter, search]);

  const counts = useMemo(() => {
    return {
      all: flaggedTurns.length,
      pending: flaggedTurns.filter((t) => t.reviewStatus === "pending").length,
      approved: flaggedTurns.filter((t) => t.reviewStatus === "approved").length,
      overridden: flaggedTurns.filter((t) => t.reviewStatus === "overridden").length,
      escalated: flaggedTurns.filter((t) => t.reviewStatus === "escalated").length,
    };
  }, [flaggedTurns]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight">Validation review queue</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Every turn the Validation Agent flagged. Click a row to see the full agent trace and act.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <FilterPills filter={filter} setFilter={setFilter} counts={counts} />
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search student, input, reason…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search flagged turns"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No flagged turns match your filter.
            </p>
          ) : (
            filtered.map((t) => <QueueRow key={t.id} turn={t} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterPills({
  filter,
  setFilter,
  counts,
}: {
  filter: StatusFilter;
  setFilter: (s: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
}) {
  const opts: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "overridden", label: "Overridden" },
    { value: "escalated", label: "Escalated" },
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {opts.map((o) => (
        <Button
          key={o.value}
          size="sm"
          variant={filter === o.value ? "default" : "ghost"}
          onClick={() => setFilter(o.value)}
        >
          {o.label}
          <span className="ml-1.5 text-xs opacity-70">{counts[o.value]}</span>
        </Button>
      ))}
    </div>
  );
}

function QueueRow({ turn }: { turn: FlaggedTurn }) {
  return (
    <Link
      href={`/faculty/review/${turn.id}`}
      className="flex items-start gap-3 rounded-md border p-3 text-sm transition-colors hover:border-accent/40 hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
        {turn.studentInitials}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{turn.studentName}</span>
          <VerdictBadge status={turn.validation?.status ?? "approved"} />
          <ReviewStatusBadge status={turn.reviewStatus} />
          <span className="text-xs text-muted-foreground">{relativeTime(turn.flaggedAt)}</span>
        </div>
        <p className="line-clamp-1 italic text-muted-foreground">"{turn.studentInput}"</p>
        {turn.validation?.policyClause && (
          <p className="text-[11px] text-muted-foreground">Policy: {turn.validation.policyClause}</p>
        )}
      </div>
      <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}

function VerdictBadge({ status }: { status: "approved" | "modified" | "blocked" }) {
  if (status === "approved") return <Badge variant="success">Approved</Badge>;
  if (status === "modified") return <Badge variant="warning">Modified</Badge>;
  return <Badge variant="destructive">Blocked</Badge>;
}

function ReviewStatusBadge({ status }: { status: FlaggedTurn["reviewStatus"] }) {
  const map: Record<FlaggedTurn["reviewStatus"], { variant: "default" | "outline" | "destructive" | "secondary"; label: string }> = {
    pending: { variant: "outline", label: "Pending review" },
    approved: { variant: "secondary", label: "Approved by you" },
    overridden: { variant: "destructive", label: "Overridden" },
    escalated: { variant: "destructive", label: "Escalated" },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
