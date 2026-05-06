"use client";

import { Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MasteryDot } from "@/components/educlaw/MasteryDot";
import { useMockData } from "@/lib/mock/MockDataProvider";

export default function MasteryMapPage() {
  const { courses, learnerState } = useMockData();
  const calc = courses.find((c) => c.id === "c_calc1")!;

  // Bucket outcomes by mastery band for the trend strip.
  const bands = [
    { label: "Not yet", min: 0, max: 0.3, tone: "bg-destructive" },
    { label: "Emerging", min: 0.3, max: 0.6, tone: "bg-warning" },
    { label: "Approaching", min: 0.6, max: 0.85, tone: "bg-accent" },
    { label: "Proficient", min: 0.85, max: 1.01, tone: "bg-success" },
  ];

  const counts = bands.map((b) => ({
    ...b,
    count: learnerState.mastery.filter((m) => m.estimate >= b.min && m.estimate < b.max).length,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight">Mastery map</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Where you are on every learning outcome — based on your work, not just your time spent.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribution</CardTitle>
          <CardDescription>How your outcomes are spread across mastery bands.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 text-center">
            {counts.map((b) => (
              <div key={b.label} className="rounded-md border p-3">
                <div className={`mx-auto mb-2 h-2 w-12 rounded-full ${b.tone}`} aria-hidden="true" />
                <p className="text-2xl font-semibold tabular-nums">{b.count}</p>
                <p className="text-xs text-muted-foreground">{b.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{calc.code} — {calc.title}</CardTitle>
              <CardDescription>By outcome, with evidence.</CardDescription>
            </div>
            <Badge variant="outline">{calc.outcomes.length} outcomes</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {calc.outcomes.map((o) => {
            const m = learnerState.mastery.find((x) => x.outcomeId === o.id);
            const value = m?.estimate ?? 0;
            const band =
              value >= 0.85 ? "Proficient" : value >= 0.6 ? "Approaching" : value >= 0.3 ? "Emerging" : "Not yet";
            return (
              <div key={o.id} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MasteryDot value={value} size="lg" />
                    <p className="font-medium text-sm">{o.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{band}</Badge>
                    <span className="text-xs tabular-nums text-muted-foreground">{(value * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={
                      value >= 0.85
                        ? "h-full bg-success"
                        : value >= 0.6
                        ? "h-full bg-accent"
                        : value >= 0.3
                        ? "h-full bg-warning"
                        : "h-full bg-destructive"
                    }
                    style={{ width: `${Math.max(2, value * 100)}%` }}
                  />
                </div>
                {m && m.evidence.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[11px] text-muted-foreground">Evidence:</span>
                    {m.evidence.map((e) => (
                      <Badge key={e} variant="secondary" className="text-[10px]">
                        {e}
                      </Badge>
                    ))}
                  </div>
                )}
                {(!m || m.evidence.length === 0) && (
                  <p className="text-[11px] text-muted-foreground">No evidence yet — try a practice item.</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
