import Link from "next/link";
import { Sparkles, Bell, Notebook } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MobileHomePreview() {
  return (
    <div className="min-h-[calc(100vh-30px)] bg-muted/40 p-6">
      <div className="mx-auto max-w-sm">
        <div className="overflow-hidden rounded-[2.5rem] border-8 border-foreground bg-background shadow-2xl">
          <div className="flex items-center justify-between bg-primary px-5 py-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
              <span className="text-sm font-semibold">EduClaw</span>
            </div>
            <Bell className="h-4 w-4" aria-hidden="true" />
          </div>

          <div className="space-y-4 p-5">
            <div>
              <h1 className="text-lg font-semibold">Hi Maya</h1>
              <p className="text-xs text-muted-foreground">Today's gentle nudge</p>
            </div>

            <Card>
              <CardContent className="space-y-2 p-3">
                <p className="text-sm font-medium">Chain rule still feels shaky.</p>
                <p className="text-xs text-muted-foreground">3 minutes — try one worked example.</p>
                <Link href="/student/conversation" className="text-xs font-medium text-accent">
                  Open →
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-2 p-3">
                <div className="flex items-center gap-2">
                  <Notebook className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <p className="text-sm font-medium">One-sentence reflection</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  When does the chain rule apply? Talk it out — we'll capture it as text.
                </p>
              </CardContent>
            </Card>

            <Badge variant="warning" className="w-full justify-center">
              Mobile preview — responsive web in iPhone frame
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
