"use client";

import { useState } from "react";
import {
  Sparkles,
  RotateCcw,
  Send,
  BookOpen,
  Eye,
  EyeOff,
  Brain,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DiagnosticBanner } from "@/components/educlaw/DiagnosticBanner";
import { ClarifyingQuestionCard } from "@/components/educlaw/ClarifyingQuestionCard";
import { ScaffoldedResponse } from "@/components/educlaw/ScaffoldedResponse";
import { ValidationVerdictRibbon } from "@/components/educlaw/ValidationVerdictRibbon";
import { ReflectionPrompt } from "@/components/educlaw/ReflectionPrompt";
import { AgentHopDiagram } from "@/components/educlaw/AgentHopDiagram";
import { ConfidencePip } from "@/components/educlaw/ConfidencePip";
import { useMockData } from "@/lib/mock/MockDataProvider";

type Stage = 0 | 1 | 2 | 3 | 4 | 5;

const STAGE_LABELS = ["Notice", "Diagnose", "Ask", "Act", "Check", "Reflect"];

export default function ConversationPage() {
  const { heroTurn, users, courses } = useMockData();
  const student = users.student;
  const calc = courses.find((c) => c.id === "c_calc1")!;

  const [stage, setStage] = useState<Stage>(5); // default: full turn shown
  const [pickedChip, setPickedChip] = useState<string | null>(null);
  const [showBackstage, setShowBackstage] = useState(true);

  const reset = () => {
    setStage(0);
    setPickedChip(null);
  };

  const advance = () => setStage((s) => (Math.min(5, s + 1) as Stage));

  const visibleHops = heroTurn.hops.slice(0, Math.min(stage, 5));

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
              <h1 className="text-xl font-semibold tracking-tight">Conversation</h1>
              <Badge variant="accent">Hero flow</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {calc.code} · {calc.title} · Homework 5 (Chain Rule) · Problem 3
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowBackstage((v) => !v)}>
              {showBackstage ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide backstage
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show backstage
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              Replay
            </Button>
            {stage < 5 && (
              <Button size="sm" onClick={advance}>
                Next: {STAGE_LABELS[stage + 1]} →
              </Button>
            )}
          </div>
        </header>

        <Card>
          <CardContent className="space-y-4 p-4">
            {/* Stage 0: Notice — student input bubble */}
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                {heroTurn.studentInput}
              </div>
            </div>
            <div className="ml-2 flex justify-end gap-2 text-[11px] text-muted-foreground">
              <span>{student.name}</span>
              <span aria-hidden="true">·</span>
              <span>just now</span>
            </div>

            {stage >= 1 && (
              <>
                <Separator />
                <StageLabel index={1} />
                <DiagnosticBanner diagnosis={heroTurn.diagnosis} studentFacing />
              </>
            )}

            {stage >= 2 && heroTurn.dialogue && (
              <>
                <StageLabel index={2} />
                <ClarifyingQuestionCard prompt={heroTurn.dialogue} onPick={setPickedChip} />
                {pickedChip && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-secondary px-4 py-1.5 text-xs text-secondary-foreground">
                      Picked:{" "}
                      {heroTurn.dialogue.chips.find((c) => c.value === pickedChip)?.label ?? pickedChip}
                    </div>
                  </div>
                )}
              </>
            )}

            {stage >= 3 && heroTurn.execution && (
              <>
                <StageLabel index={3} />
                <ScaffoldedResponse response={heroTurn.execution} />
              </>
            )}

            {stage >= 4 && heroTurn.validation && (
              <>
                <StageLabel index={4} />
                <ValidationVerdictRibbon verdict={heroTurn.validation} audience="student" />
              </>
            )}

            {stage >= 5 && heroTurn.reflection && (
              <>
                <StageLabel index={5} />
                <ReflectionPrompt prompt={heroTurn.reflection} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Mock input — non-functional in prototype */}
        <div className="flex items-center gap-2 rounded-md border bg-card p-2">
          <Input placeholder="Type a follow-up… (prototype — input is decorative)" disabled />
          <Button size="icon" disabled aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Use <strong>Next</strong> above to walk the Guided Learning Cycle stage by stage, or
          <strong> Replay</strong> to start over. The full scenario script lives in{" "}
          <code>docs/phase1-foundation.md</code> Appendix A.
        </p>
      </div>

      {showBackstage && (
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-accent" aria-hidden="true" />
                <CardTitle className="text-sm">Backstage</CardTitle>
              </div>
              <CardDescription className="text-xs">
                What the agents are doing. Faculty + auditors see this; students don't by default.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Guided Learning Cycle
                </p>
                <ol className="mt-1 space-y-1 text-xs">
                  {STAGE_LABELS.map((label, i) => (
                    <li
                      key={label}
                      className={
                        i <= stage
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      <span className="inline-block w-4 tabular-nums">{i}.</span>
                      {label}
                      {i === stage && <span className="ml-2 text-accent">← here</span>}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Inference confidence
                </p>
                <div className="mt-1">
                  <ConfidencePip value={heroTurn.diagnosis.confidence} />
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Agent hops</p>
                <div className="mt-2">
                  <AgentHopDiagram hops={visibleHops} />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Active policy
                </p>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <span>{heroTurn.validation?.policyClause ?? "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-accent" aria-hidden="true" />
                <CardTitle className="text-sm">Course context</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div>
                <p className="text-muted-foreground">Course</p>
                <p className="font-medium text-foreground">
                  {calc.code} — {calc.title}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Active outcome</p>
                <p className="font-medium text-foreground">Apply the chain rule to composite functions</p>
              </div>
              <div>
                <p className="text-muted-foreground">Assignment</p>
                <p className="font-medium text-foreground">Homework 5 — Problem 3</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      )}
    </div>
  );
}

function StageLabel({ index }: { index: number }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
        {index}
      </span>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {STAGE_LABELS[index]}
      </span>
    </div>
  );
}
