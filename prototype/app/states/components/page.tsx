"use client";

import { Sparkles } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DiagnosticBanner } from "@/components/educlaw/DiagnosticBanner";
import { ClarifyingQuestionCard } from "@/components/educlaw/ClarifyingQuestionCard";
import { ScaffoldedResponse } from "@/components/educlaw/ScaffoldedResponse";
import { ValidationVerdictRibbon } from "@/components/educlaw/ValidationVerdictRibbon";
import { ReflectionPrompt } from "@/components/educlaw/ReflectionPrompt";
import { ConsentToggle } from "@/components/educlaw/ConsentToggle";
import { AgentHopDiagram } from "@/components/educlaw/AgentHopDiagram";
import { MasteryDot } from "@/components/educlaw/MasteryDot";
import { ConfidencePip } from "@/components/educlaw/ConfidencePip";
import { useMockData } from "@/lib/mock/MockDataProvider";

export default function ComponentLibraryPage() {
  const { heroTurn, learnerState } = useMockData();

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight">Component library</h1>
            <Badge variant="outline">Week 2 deliverable</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Every reusable piece in the EduClaw design system. For stakeholder sign-off and faculty design partner review.
          </p>
        </header>

        <Section title="Tokens — color">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <Swatch token="primary" />
            <Swatch token="accent" />
            <Swatch token="success" />
            <Swatch token="warning" />
            <Swatch token="destructive" />
            <Swatch token="muted" />
          </div>
        </Section>

        <Section title="Tokens — typography">
          <div className="space-y-2">
            <p className="text-3xl font-semibold tracking-tight">Heading 1 · Inter</p>
            <p className="text-2xl font-semibold tracking-tight">Heading 2 · Inter</p>
            <p className="text-base">Body · Inter</p>
            <p className="text-sm text-muted-foreground">Muted body · Inter</p>
            <p className="font-serif text-base">Reading content · Source Serif Pro — used for course materials and worked examples.</p>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Default</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button>Default size</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Default</Badge>
            <Badge variant="accent">Accent</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Section>

        <Section title="Form primitives">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="demo-input">Label</Label>
              <Input id="demo-input" placeholder="Placeholder text…" />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2">
                <Switch id="demo-switch" defaultChecked />
                <Label htmlFor="demo-switch">Toggle on</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="demo-switch-off" />
                <Label htmlFor="demo-switch-off">Toggle off</Label>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Tabs">
          <Tabs defaultValue="a" className="w-full">
            <TabsList>
              <TabsTrigger value="a">Tab A</TabsTrigger>
              <TabsTrigger value="b">Tab B</TabsTrigger>
              <TabsTrigger value="c">Tab C</TabsTrigger>
            </TabsList>
            <TabsContent value="a" className="text-sm text-muted-foreground">Tab A content.</TabsContent>
            <TabsContent value="b" className="text-sm text-muted-foreground">Tab B content.</TabsContent>
            <TabsContent value="c" className="text-sm text-muted-foreground">Tab C content.</TabsContent>
          </Tabs>
        </Section>

        <Section title="Loading skeletons">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Section>

        <Section title="MasteryDot · ConfidencePip">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <MasteryDot value={0.05} /> <span className="text-xs">Not yet</span>
            </div>
            <div className="flex items-center gap-2">
              <MasteryDot value={0.45} /> <span className="text-xs">Emerging</span>
            </div>
            <div className="flex items-center gap-2">
              <MasteryDot value={0.7} /> <span className="text-xs">Approaching</span>
            </div>
            <div className="flex items-center gap-2">
              <MasteryDot value={0.92} /> <span className="text-xs">Proficient</span>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <ConfidencePip value={0.32} />
            <ConfidencePip value={0.61} />
            <ConfidencePip value={0.88} />
          </div>
        </Section>

        <Section title="DiagnosticBanner — student-facing vs faculty-facing">
          <div className="space-y-3">
            <DiagnosticBanner diagnosis={heroTurn.diagnosis} studentFacing />
            <DiagnosticBanner diagnosis={heroTurn.diagnosis} studentFacing={false} />
          </div>
        </Section>

        <Section title="ClarifyingQuestionCard">
          {heroTurn.dialogue && <ClarifyingQuestionCard prompt={heroTurn.dialogue} />}
        </Section>

        <Section title="ScaffoldedResponse with citations">
          {heroTurn.execution && <ScaffoldedResponse response={heroTurn.execution} />}
        </Section>

        <Section title="ValidationVerdictRibbon — every state">
          <div className="space-y-3">
            <ValidationVerdictRibbon
              verdict={{ status: "approved", reason: "Within policy.", policyClause: "Conceptual explanations always allowed" }}
              audience="faculty"
            />
            {heroTurn.validation && (
              <ValidationVerdictRibbon verdict={heroTurn.validation} audience="student" />
            )}
            <ValidationVerdictRibbon
              verdict={{
                status: "blocked",
                reason: "Hard block on ghostwritten reflections per clause 3.",
                studentFacingMessage:
                  "I can't write your reflection for you — that's the part that helps it stick.",
                policyClause: "Block ghostwriting",
              }}
              audience="student"
            />
          </div>
        </Section>

        <Section title="ReflectionPrompt">
          {heroTurn.reflection && <ReflectionPrompt prompt={heroTurn.reflection} />}
        </Section>

        <Section title="ConsentToggle">
          <Card>
            <CardContent className="p-4">
              {learnerState.consentLedger.slice(0, 2).map((s) => (
                <ConsentToggle key={s.id} scope={s} />
              ))}
            </CardContent>
          </Card>
        </Section>

        <Section title="AgentHopDiagram">
          <AgentHopDiagram hops={heroTurn.hops} />
        </Section>

        <p className="pt-6 text-xs text-muted-foreground">
          Source: <code>components/educlaw/*</code> and <code>components/ui/*</code>. Plan: <code>docs/phase1-foundation.md</code> §7.
        </p>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Static map — Tailwind JIT can't see dynamic `bg-${token}`.
const SWATCH_BG: Record<string, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  muted: "bg-muted",
};

function Swatch({ token }: { token: keyof typeof SWATCH_BG }) {
  return (
    <div className="space-y-1">
      <div
        className={`h-12 w-full rounded-md border ${SWATCH_BG[token]}`}
        aria-label={`${token} swatch`}
      />
      <p className="text-[11px] text-muted-foreground">{token}</p>
    </div>
  );
}
