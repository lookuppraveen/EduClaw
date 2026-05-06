"use client";

import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MasteryDot } from "@/components/educlaw/MasteryDot";
import { useMockData } from "@/lib/mock/MockDataProvider";

export default function CourseListPage() {
  const { courses, learnerState } = useMockData();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight">My courses</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Open a course to bring up its companion panel and mastery view.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {courses.map((c) => {
          const myMastery =
            learnerState.mastery.length > 0
              ? learnerState.mastery.reduce((a, b) => a + b.estimate, 0) / learnerState.mastery.length
              : 0;
          return (
            <Link key={c.id} href={`/student/courses/${c.id}`} className="block">
              <Card className="h-full transition-shadow hover:shadow-md hover:border-accent/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{c.code}</CardTitle>
                      <CardDescription>{c.title}</CardDescription>
                    </div>
                    <Badge variant="outline">{c.term}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-xs text-muted-foreground">
                    {c.outcomes.length} outcomes · {c.enrollmentCount} students
                  </p>
                  {c.id === "c_calc1" && (
                    <div className="flex items-center gap-2">
                      <MasteryDot value={myMastery} />
                      <span className="text-xs">Average mastery {(myMastery * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-accent">
                    Open <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
