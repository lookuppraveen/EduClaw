import Link from "next/link";
import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type StubPageProps = {
  title: string;
  surface: "Web" | "LMS embed" | "Mobile" | "Chat";
  role: "Student" | "Faculty" | "Advisor" | "Admin" | "Auditor" | "All";
  weekTarget: number;
  hero?: boolean;
  notes?: string;
};

export function StubPage({ title, surface, role, weekTarget, hero, notes }: StubPageProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Construction className="h-5 w-5 text-warning" aria-hidden="true" />
              <CardTitle>{title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {hero && <Badge variant="accent">Hero flow</Badge>}
              <Badge variant="outline">Week {weekTarget}</Badge>
            </div>
          </div>
          <CardDescription>
            Stub — not yet built. Surface: {surface} · Persona: {role}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This screen is part of the Phase 1 inventory in <code>docs/phase1-foundation.md</code>.
            It will be implemented in Week {weekTarget} of the sprint.
          </p>
          {notes && <p className="rounded-md bg-muted p-3 text-foreground">{notes}</p>}
          <p>
            <Link href="/demo" className="text-accent underline-offset-2 hover:underline">
              ← Back to screen index
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
