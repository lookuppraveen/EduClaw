// EduClaw mock data shapes.
// Each top-level type is annotated with the eventual MCP source per the build plan.
// When Phase 2 swaps in real tools, only the data source changes — components untouched.

export type Role = "student" | "faculty" | "advisor" | "admin" | "auditor";

// TODO MCP: identity.get_user(user_id)
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarInitials: string;
};

// TODO MCP: course_context.get_course(course_id)
export type Course = {
  id: string;
  code: string;
  title: string;
  term: string;
  enrollmentCount: number;
  outcomes: Outcome[];
};

export type Outcome = {
  id: string;
  label: string;
};

// TODO MCP: learner_state.read(learner_id)
export type LearnerState = {
  learnerId: string;
  goals: { explicit: string[]; inferred: string[] };
  mastery: Array<{ outcomeId: string; estimate: number; evidence: string[] }>;
  consentLedger: ConsentScope[];
  reflections: Reflection[];
};

export type ConsentScope = {
  id: string;
  label: string;
  description: string;
  granted: boolean;
  updatedAt: string;
};

export type Reflection = {
  id: string;
  prompt: string;
  response: string;
  createdAt: string;
  outcomeId?: string;
};

// Conversation primitives — what the TwinAgent runtime produces per turn.

export type ConfusionLevel = "low" | "medium" | "high";
export type Urgency = "low" | "medium" | "high";

// TODO MCP: produced by Inference Agent (see §5.1 of build plan)
export type InferenceDiagnosis = {
  intent: string;
  confusionLevel: ConfusionLevel;
  knowledgeGap: string;
  urgency: Urgency;
  confidence: number; // 0–1
  rationale: string;
  recommendedNextAgent: "dialogue" | "execution" | "validation" | "reflection";
};

// TODO MCP: produced by Dialogue Agent (see §5.2)
export type DialoguePrompt = {
  question: string;
  chips: Array<{ label: string; value: string }>;
};

// TODO MCP: produced by Execution Agent (see §5.3)
export type ExecutionResponse = {
  scaffold: string;
  workedExamples: Array<{ title: string; body: string }>;
  citations: Citation[];
  suggestedAction?: { label: string; kind: "open-assignment" | "schedule" | "practice" };
};

export type Citation = {
  id: string;
  source: string;
  excerpt: string;
  href: string;
};

// TODO MCP: produced by Validation Agent (see §5.4)
export type ValidationVerdict = {
  status: "approved" | "modified" | "blocked";
  reason: string;
  studentFacingMessage?: string;
  policyClause?: string;
};

// TODO MCP: produced by Reflection Agent (see §5.5)
export type ReflectionPrompt = {
  prompt: string;
  kind: "explain-back" | "transfer" | "predict" | "summarize";
  optional: true;
};

// TODO MCP: produced by Orchestrator
export type AgentHop = {
  agent: "inference" | "dialogue" | "execution" | "validation" | "reflection";
  startedAt: string;
  durationMs: number;
  confidence?: number;
  outputSummary: string;
};

export type ConversationTurn = {
  id: string;
  studentInput: string;
  diagnosis: InferenceDiagnosis;
  dialogue?: DialoguePrompt;
  execution?: ExecutionResponse;
  validation?: ValidationVerdict;
  reflection?: ReflectionPrompt;
  hops: AgentHop[];
  createdAt: string;
};

// TODO MCP: policy.lookup(course_id, assignment_id)
export type ValidationPolicy = {
  id: string;
  courseId: string;
  assignmentId?: string;
  title: string;
  clauses: PolicyClause[];
  authoredBy: string;
  updatedAt: string;
};

export type PolicyClause = {
  id: string;
  rule: string;
  whenToApply: string;
  onViolation: "modify" | "block";
};
