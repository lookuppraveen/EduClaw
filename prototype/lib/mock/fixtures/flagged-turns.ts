import type { ConversationTurn } from "../types";

// TODO MCP: integrity.list_flagged(course_id) + trace.get(turn_id)
// Subset of fields most relevant to faculty review — full ConversationTurn shape preserved.
export type FlaggedTurn = ConversationTurn & {
  studentName: string;
  studentInitials: string;
  courseId: string;
  assignmentId: string;
  flaggedAt: string;
  reviewStatus: "pending" | "approved" | "overridden" | "escalated";
  facultyNote?: string;
};

export const flaggedTurns: FlaggedTurn[] = [
  {
    id: "flag_1",
    studentName: "Maya Chen",
    studentInitials: "MC",
    courseId: "c_calc1",
    assignmentId: "a_hw5",
    flaggedAt: "2026-05-06T10:01:09Z",
    reviewStatus: "pending",
    studentInput: "I don't get problem 3. Can you just show me how to do it?",
    diagnosis: {
      intent: "request-direct-answer",
      confusionLevel: "medium",
      knowledgeGap: "Identifying inner vs outer function in chain rule",
      urgency: "medium",
      confidence: 0.81,
      rationale:
        "Student asked for a direct answer to a graded problem; recent practice shows partial understanding.",
      recommendedNextAgent: "dialogue",
    },
    validation: {
      status: "modified",
      reason:
        "Direct-answer request on graded item. Policy 'Show me, don't solve for me' applied — converted to scaffold.",
      studentFacingMessage:
        "I can't solve homework problem 3 for you, but I can walk you through a similar example.",
      policyClause: "MATH 1550 — Homework: scaffolds only on graded items",
    },
    hops: [
      { agent: "inference", startedAt: "2026-05-06T10:01:02Z", durationMs: 240, confidence: 0.81, outputSummary: "Diagnosed structural confusion" },
      { agent: "dialogue", startedAt: "2026-05-06T10:01:03Z", durationMs: 410, outputSummary: "Asked clarifying question" },
      { agent: "execution", startedAt: "2026-05-06T10:01:05Z", durationMs: 1820, confidence: 0.74, outputSummary: "Returned scaffold + 2 worked examples" },
      { agent: "validation", startedAt: "2026-05-06T10:01:07Z", durationMs: 920, confidence: 0.92, outputSummary: "Modified per policy" },
    ],
    createdAt: "2026-05-06T10:01:02Z",
  },
  {
    id: "flag_2",
    studentName: "Jamal Thompson",
    studentInitials: "JT",
    courseId: "c_calc1",
    assignmentId: "a_hw5",
    flaggedAt: "2026-05-06T09:42:00Z",
    reviewStatus: "pending",
    studentInput: "Write my reflection on the chain rule for me.",
    diagnosis: {
      intent: "request-ghostwriting",
      confusionLevel: "low",
      knowledgeGap: "Self-assessment and metacognition",
      urgency: "low",
      confidence: 0.93,
      rationale:
        "Direct request to produce reflective writing on the student's behalf — covered by hard block policy.",
      recommendedNextAgent: "validation",
    },
    validation: {
      status: "blocked",
      reason:
        "Hard block on ghostwritten reflections per Validation Policy clause 3.",
      studentFacingMessage:
        "I can't write your reflection for you — that's the part that helps it stick. I can ask you a question to get you started, though.",
      policyClause: "MATH 1550 — Block ghostwriting of reflections",
    },
    hops: [
      { agent: "inference", startedAt: "2026-05-06T09:42:00Z", durationMs: 180, confidence: 0.93, outputSummary: "Identified ghostwriting request" },
      { agent: "validation", startedAt: "2026-05-06T09:42:01Z", durationMs: 320, confidence: 0.97, outputSummary: "Blocked per clause 3" },
    ],
    createdAt: "2026-05-06T09:42:00Z",
  },
  {
    id: "flag_3",
    studentName: "Priya Nair",
    studentInitials: "PN",
    courseId: "c_calc1",
    assignmentId: "a_hw5",
    flaggedAt: "2026-05-05T16:18:00Z",
    reviewStatus: "approved",
    facultyNote: "Good call by the agent — this was a genuine concept question, not a homework dodge.",
    studentInput: "Why does the chain rule even work? Like why isn't the derivative just one piece?",
    diagnosis: {
      intent: "conceptual-inquiry",
      confusionLevel: "medium",
      knowledgeGap: "Intuition for composite-function derivatives",
      urgency: "low",
      confidence: 0.86,
      rationale: "Conceptual question, not tied to a specific graded problem.",
      recommendedNextAgent: "execution",
    },
    validation: {
      status: "approved",
      reason: "Conceptual explanation with citations — within policy.",
      policyClause: "MATH 1550 — Conceptual explanations always allowed",
    },
    hops: [
      { agent: "inference", startedAt: "2026-05-05T16:18:00Z", durationMs: 220, confidence: 0.86, outputSummary: "Conceptual inquiry" },
      { agent: "execution", startedAt: "2026-05-05T16:18:01Z", durationMs: 1650, confidence: 0.78, outputSummary: "Conceptual explanation w/ 2 citations" },
      { agent: "validation", startedAt: "2026-05-05T16:18:03Z", durationMs: 540, confidence: 0.94, outputSummary: "Approved" },
      { agent: "reflection", startedAt: "2026-05-05T16:18:04Z", durationMs: 160, outputSummary: "Posted explain-back prompt" },
    ],
    createdAt: "2026-05-05T16:18:00Z",
  },
  {
    id: "flag_4",
    studentName: "Diego Alvarez",
    studentInitials: "DA",
    courseId: "c_calc1",
    assignmentId: "a_hw5",
    flaggedAt: "2026-05-05T11:02:00Z",
    reviewStatus: "escalated",
    facultyNote: "Pattern of repeated direct-answer requests across HW3, HW4, HW5 — referred to academic integrity office.",
    studentInput: "Just give me the answer to all of problem 5 a-d, I'm out of time.",
    diagnosis: {
      intent: "request-direct-answer",
      confusionLevel: "low",
      knowledgeGap: "Time management; possible disengagement",
      urgency: "high",
      confidence: 0.88,
      rationale:
        "Third direct-answer request this week; affective signal suggests stress, not confusion.",
      recommendedNextAgent: "validation",
    },
    validation: {
      status: "modified",
      reason:
        "Pattern flagged for faculty review — third similar request this week. Modified to scaffold + offered office hours.",
      studentFacingMessage:
        "I hear you're stressed. I can't solve graded problems for you, but I can show you a worked example and your professor's office hours are at 2pm today.",
      policyClause: "MATH 1550 — Homework: scaffolds only on graded items",
    },
    hops: [
      { agent: "inference", startedAt: "2026-05-05T11:02:00Z", durationMs: 260, confidence: 0.88, outputSummary: "Pattern detected: 3rd direct-answer this week" },
      { agent: "validation", startedAt: "2026-05-05T11:02:01Z", durationMs: 740, confidence: 0.95, outputSummary: "Modified + escalation to faculty queue" },
    ],
    createdAt: "2026-05-05T11:02:00Z",
  },
];
