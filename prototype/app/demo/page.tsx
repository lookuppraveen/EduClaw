import Link from "next/link";
import { Sparkles, ExternalLink, Lock } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { screens, type ScreenEntry, type Surface } from "@/lib/mock/screens";
import { cn } from "@/lib/utils";

const SURFACE_LABELS: Record<Surface, string> = {
  web: "Web Portal",
  "lms-embed": "LMS Embed (LTI 1.3)",
  mobile: "Mobile",
  chat: "Chat (Slack / Teams)",
  "cross-cutting": "Cross-cutting",
};

const SURFACE_ORDER: Surface[] = ["web", "lms-embed", "mobile", "chat", "cross-cutting"];

const ROLE_GROUPS = ["all", "student", "faculty", "advisor", "admin", "auditor"] as const;

export default function DemoIndexPage() {
  const total = screens.length;
  const ready = screens.filter((s) => s.status === "ready").length;
  const stub = screens.filter((s) => s.status === "stub").length;
  const planned = screens.filter((s) => s.status === "planned").length;

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight">EduClaw screen index</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Every planned screen for the Phase 1 UI/UX sprint. Click a screen to open it. Use the
            role switcher in the top nav to enter as a different persona.
          </p>
        </div>

        <ProgressStrip total={total} ready={ready} stub={stub} planned={planned} />

        {SURFACE_ORDER.map((surface) => {
          const surfaceScreens = screens.filter((s) => s.surface === surface);
          if (surfaceScreens.length === 0) return null;
          return (
            <section key={surface} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">{SURFACE_LABELS[surface]}</h2>
                <span className="text-xs text-muted-foreground">
                  {surfaceScreens.length} screens
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {surfaceScreens.map((s) => (
                  <ScreenCard key={`${surface}-${s.title}`} screen={s} />
                ))}
              </div>
              <Separator />
            </section>
          );
        })}

        <footer className="pt-4 text-xs text-muted-foreground">
          Plan source: <code>docs/phase1-foundation.md</code> · Roles:{" "}
          {ROLE_GROUPS.filter((r) => r !== "all").join(", ")}
        </footer>
      </main>
    </>
  );
}

function ProgressStrip({
  total,
  ready,
  stub,
  planned,
}: {
  total: number;
  ready: number;
  stub: number;
  planned: number;
}) {
  const pctReady = Math.round((ready / total) * 100);
  const pctStub = Math.round((stub / total) * 100);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Sprint progress</CardTitle>
        <CardDescription>
          {total} screens planned — {ready} ready, {stub} stub, {planned} not yet started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={ready}
          aria-label="Screens ready"
        >
          <div className="bg-success" style={{ width: `${pctReady}%` }} />
          <div className="bg-warning" style={{ width: `${pctStub}%` }} />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <LegendDot tone="bg-success" label={`Ready (${ready})`} />
          <LegendDot tone="bg-warning" label={`Stub (${stub})`} />
          <LegendDot tone="bg-muted" label={`Planned (${planned})`} />
        </div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", tone)} aria-hidden="true" />
      {label}
    </span>
  );
}

function ScreenCard({ screen }: { screen: ScreenEntry }) {
  const disabled = !screen.href;
  const inner = (
    <Card
      className={cn(
        "h-full transition-shadow",
        disabled ? "opacity-60" : "hover:shadow-md hover:border-accent/40"
      )}
    >
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium leading-snug">{screen.title}</span>
          {screen.hero && <Badge variant="accent">Hero</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="capitalize">
            {screen.role}
          </Badge>
          <Badge variant="outline">Week {screen.weekTarget}</Badge>
          <StatusBadge status={screen.status} />
        </div>
        <div className="flex items-center justify-between text-xs">
          {disabled ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Not yet routed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-accent">
              Open <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return disabled ? (
    <div aria-disabled>{inner}</div>
  ) : (
    <Link href={screen.href!} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
      {inner}
    </Link>
  );
}

function StatusBadge({ status }: { status: ScreenEntry["status"] }) {
  if (status === "ready") return <Badge variant="success">Ready</Badge>;
  if (status === "stub") return <Badge variant="warning">Stub</Badge>;
  return <Badge variant="secondary">Planned</Badge>;
}
