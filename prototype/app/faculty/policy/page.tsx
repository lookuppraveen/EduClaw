"use client";

import { ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PolicyClauseEditor } from "@/components/educlaw/PolicyClauseEditor";
import { useMockData } from "@/lib/mock/MockDataProvider";

export default function FacultyPolicyPage() {
  const { policies, courses } = useMockData();
  const policy = policies[0];
  const course = courses.find((c) => c.id === policy.courseId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight">Validation Policy authoring</h1>
            <Badge variant="accent">Hero flow</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            You author the rules. EduClaw's Validation Agent enforces them on every student turn.
          </p>
        </div>
        <Button variant="accent">
          <Sparkles className="h-4 w-4" />
          Preview as student
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Policy details</CardTitle>
          <CardDescription>
            {course?.code} · {course?.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="policy-title">Policy title</Label>
            <Input id="policy-title" defaultValue={policy.title} />
          </div>
          <div>
            <Label htmlFor="policy-assignment">Applies to assignment</Label>
            <Input id="policy-assignment" defaultValue={policy.assignmentId ?? ""} placeholder="e.g. a_hw5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clauses</CardTitle>
          <CardDescription>
            Each clause defines a rule, when it applies, and whether to modify or block on violation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PolicyClauseEditor initialClauses={policy.clauses} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Save as draft</Button>
        <Button>Publish policy</Button>
      </div>
    </div>
  );
}
