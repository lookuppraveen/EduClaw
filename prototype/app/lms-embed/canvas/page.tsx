import Link from "next/link";
import { Sparkles, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CanvasEmbedPage() {
  return (
    <div className="min-h-[calc(100vh-30px)] bg-[#394B58]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded bg-[#E72429] px-2 py-1 text-xs font-bold">CANVAS</div>
          <span className="text-sm">MATH 1550 · Homework 5</span>
        </div>
        <Badge variant="warning">LMS frame mock</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[1fr_360px]">
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
              <CardTitle>Homework 5 — Chain Rule (Stewart §4.2)</CardTitle>
            </div>
            <CardDescription>Due Friday · 10 problems · 50 points</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-medium">Problem 3</p>
            <p>Find the derivative of <span className="font-serif italic">sin((3x + 1)²)</span>.</p>
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              [Canvas assignment shell — content shown for prototype demo only]
            </div>
            <p className="text-xs text-muted-foreground">
              EduClaw is available in the side panel. It's set to "scaffolds only" by your instructor.
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/40">
          <CardHeader className="bg-accent/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                <CardTitle className="text-base">EduClaw companion</CardTitle>
              </div>
              <Badge variant="outline">LTI 1.3</Badge>
            </div>
            <CardDescription>Aware of Homework 5 and your Validation Policy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              The full conversation surface lives at the dedicated route in this prototype.
            </p>
            <Button asChild variant="accent" className="w-full">
              <Link href="/student/conversation">Open conversation surface</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              In production this panel renders inside Canvas via LTI 1.3 Deep Linking.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
