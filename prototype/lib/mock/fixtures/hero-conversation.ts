import type { ConversationTurn } from "../types";

// Hero scenario from docs/phase1-foundation.md Appendix A:
// Maya is stuck on the chain rule in a Calculus I assignment.
export const heroConversation: ConversationTurn = {
  id: "turn_chain_rule_1",
  studentInput: "I don't get problem 3. Can you just show me how to do it?",
  diagnosis: {
    intent: "request-direct-answer",
    confusionLevel: "medium",
    knowledgeGap: "Identifying inner vs outer function in a chain-rule expression",
    urgency: "medium",
    confidence: 0.81,
    rationale:
      "Student asked for a direct answer to a graded problem, but recent practice on chain-rule items shows partial understanding — likely a structural confusion, not a refusal to engage.",
    recommendedNextAgent: "dialogue",
  },
  dialogue: {
    question:
      "Before we start — is the part that's tricky the order of operations, or which function is inside which?",
    chips: [
      { label: "Which function is inside which", value: "inner-outer" },
      { label: "The order of operations", value: "order" },
      { label: "Something else", value: "other" },
    ],
  },
  execution: {
    scaffold:
      "Let's try this with a simpler shape first. If we treat g(x) = x² as the 'inside' and f(u) = sin(u) as the 'outside', then sin(x²) is f(g(x)). The chain rule says: take the derivative of the outside (treating the inside as a single thing), then multiply by the derivative of the inside. Try it on this similar example before going back to your homework problem.",
    workedExamples: [
      {
        title: "Worked example A — sin(x²)",
        body: "Outside: sin(u) → cos(u). Inside: x² → 2x. Result: cos(x²) · 2x.",
      },
      {
        title: "Worked example B — (3x + 1)⁴",
        body: "Outside: u⁴ → 4u³. Inside: 3x + 1 → 3. Result: 4(3x + 1)³ · 3 = 12(3x + 1)³.",
      },
    ],
    citations: [
      {
        id: "cite_textbook_4_2",
        source: "Stewart, Calculus 9e — §4.2 The Chain Rule",
        excerpt:
          "If g is differentiable at x and f is differentiable at g(x), then the composite function F = f ∘ g is differentiable at x and F'(x) = f'(g(x)) · g'(x).",
        href: "#",
      },
      {
        id: "cite_lecture_w8",
        source: "Week 8 lecture notes — Patel",
        excerpt:
          "Always identify the 'inside' first. If you can't name the inside function, the chain rule won't help yet.",
        href: "#",
      },
    ],
    suggestedAction: { label: "Try a similar practice problem", kind: "practice" },
  },
  validation: {
    status: "modified",
    reason:
      "Student requested a direct answer to a graded problem (problem 3 of homework 5). Course Validation Policy 'Show me, don't solve for me' requires scaffolds with worked analogs instead of the answer.",
    studentFacingMessage:
      "I can't solve homework problem 3 for you, but I can walk you through a similar example so you can solve it yourself.",
    policyClause: "MATH 1550 — Homework: scaffolds only on graded items",
  },
  reflection: {
    prompt: "In one sentence, how would you explain the chain rule to a classmate?",
    kind: "explain-back",
    optional: true,
  },
  hops: [
    { agent: "inference", startedAt: "2026-05-06T10:01:02Z", durationMs: 240, confidence: 0.81, outputSummary: "Diagnosed: structural confusion (inner/outer)" },
    { agent: "dialogue", startedAt: "2026-05-06T10:01:03Z", durationMs: 410, outputSummary: "Asked clarifying question with 3 chips" },
    { agent: "execution", startedAt: "2026-05-06T10:01:05Z", durationMs: 1820, confidence: 0.74, outputSummary: "Returned scaffold + 2 worked examples + 2 citations" },
    { agent: "validation", startedAt: "2026-05-06T10:01:07Z", durationMs: 920, confidence: 0.92, outputSummary: "Modified — converted direct-answer request into scaffold per policy" },
    { agent: "reflection", startedAt: "2026-05-06T10:01:08Z", durationMs: 180, outputSummary: "Posted optional explain-back prompt" },
  ],
  createdAt: "2026-05-06T10:01:02Z",
};
