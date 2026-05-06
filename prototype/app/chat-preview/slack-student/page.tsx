import { Sparkles, Hash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SlackStudentPreview() {
  return (
    <div className="min-h-[calc(100vh-30px)] bg-[#1A1D21] p-6 text-white">
      <div className="mx-auto max-w-2xl space-y-3">
        <Badge variant="warning" className="mx-auto block w-fit">Slack frame mock</Badge>

        <div className="rounded-md border border-white/10 bg-[#222529]">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <Hash className="h-4 w-4 text-white/60" aria-hidden="true" />
            <span className="font-semibold">math-1550-help</span>
            <span className="text-xs text-white/50">187 members</span>
          </div>

          <div className="space-y-4 p-4">
            <Message
              author="Maya Chen"
              avatar="MC"
              avatarColor="bg-accent"
              time="10:01 AM"
              body={
                <>
                  <code className="rounded bg-white/10 px-1 text-[#1d9bd1]">/educlaw ask</code>{" "}
                  I'm stuck on the chain rule for problem 3 — can someone explain?
                </>
              }
            />

            <Message
              author="EduClaw"
              authorBadge="APP"
              avatar={<Sparkles className="h-4 w-4 text-accent" />}
              avatarColor="bg-primary"
              time="10:01 AM"
              body={
                <div className="space-y-2">
                  <p>
                    Looks like you might be working through which function is "inside" vs "outside".
                    Quick check before we go further:
                  </p>
                  <p className="text-white/70">
                    Is the part that's tricky the order of operations, or which function is inside which?
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["Which is inside which", "Order of operations", "Something else"].map((c) => (
                      <button
                        key={c}
                        className="rounded border border-white/20 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-white/40">
                    Heads up: this channel is monitored by your instructor's Validation Policy. I won't
                    solve graded problems for you, but I can walk through analogous examples.
                  </p>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Message({
  author,
  authorBadge,
  avatar,
  avatarColor,
  time,
  body,
}: {
  author: string;
  authorBadge?: string;
  avatar: React.ReactNode;
  avatarColor: string;
  time: string;
  body: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded ${avatarColor} text-xs font-semibold`}>
        {avatar}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">{author}</span>
          {authorBadge && (
            <span className="rounded bg-white/10 px-1 text-[10px] font-bold tracking-wide text-white/70">
              {authorBadge}
            </span>
          )}
          <span className="text-xs text-white/40">{time}</span>
        </div>
        <div className="mt-1 text-sm text-white/90">{body}</div>
      </div>
    </div>
  );
}
