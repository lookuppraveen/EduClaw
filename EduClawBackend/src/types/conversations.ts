export type AgentName = "inference" | "dialogue" | "execution" | "validation" | "reflection";

export type ValidationStatus = "approved" | "modified" | "blocked";

export interface Conversation {
  id: string;
  learnerId: string;
  courseId: string;
  assignmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InferenceDiagnosis {
  intent: string;
  confusionLevel: "low" | "medium" | "high";
  knowledgeGap: string;
  urgency: "low" | "medium" | "high";
  confidence: number;
  rationale: string;
  recommendedNextAgent: AgentName;
}

export interface DialoguePrompt {
  question: string;
  chips: string[];
}

export interface Citation {
  source: string;
  url: string;
}

export interface ExecutionResponse {
  scaffold: string;
  workedExamples: string[];
  citations: Citation[];
  suggestedAction: string;
}

export interface ValidationVerdict {
  status: ValidationStatus;
  reason: string;
  studentFacingMessage: string;
  policyClause: string;
}

export interface ReflectionPrompt {
  prompt: string;
  kind: "metacognitive" | "goal-check";
  optional: boolean;
}

export interface AgentHop {
  id: string;
  turnId: string;
  agent: AgentName;
  startedAt: string;
  durationMs: number;
  confidence: number;
  outputSummary: string;
  internalDetails: string;
}

export interface ConversationTurn {
  id: string;
  conversationId: string;
  learnerId: string;
  courseId: string;
  assignmentId: string | null;
  studentInput: string;
  selectedChip: string | null;
  inference: InferenceDiagnosis;
  dialogue: DialoguePrompt;
  execution: ExecutionResponse;
  validation: ValidationVerdict;
  reflection: ReflectionPrompt;
  createdAt: string;
}
