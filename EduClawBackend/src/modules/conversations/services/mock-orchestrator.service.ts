import { newId } from "../../../common/crypto.js";
import type {
  AgentHop,
  DialoguePrompt,
  ExecutionResponse,
  InferenceDiagnosis,
  ReflectionPrompt,
  ValidationVerdict
} from "../../../types/conversations.js";

export interface OrchestratorInput {
  message: string;
  selectedChip: string | null;
}

export interface OrchestratorOutput {
  inference: InferenceDiagnosis;
  dialogue: DialoguePrompt;
  execution: ExecutionResponse;
  validation: ValidationVerdict;
  reflection: ReflectionPrompt;
  trace: AgentHop[];
}

const nowIso = (): string => new Date().toISOString();

const buildInference = (message: string): InferenceDiagnosis => {
  const asksDirectAnswer = /show me|give me the answer|just solve/i.test(message);
  return {
    intent: asksDirectAnswer ? "seeking direct solution" : "concept clarification",
    confusionLevel: asksDirectAnswer ? "high" : "medium",
    knowledgeGap: "chain rule composition",
    urgency: "medium",
    confidence: asksDirectAnswer ? 0.82 : 0.76,
    rationale: "Based on prompt style and request wording",
    recommendedNextAgent: "dialogue"
  };
};

const buildDialogue = (selectedChip: string | null): DialoguePrompt => {
  if (selectedChip) {
    return {
      question: "Great choice. Want another check before we continue?",
      chips: ["Yes, one more check", "No, continue", "Change topic"]
    };
  }

  return {
    question: "Which part feels most unclear?",
    chips: ["Inner vs outer function", "Derivative order", "Something else"]
  };
};

const buildExecution = (): ExecutionResponse => ({
  scaffold: "Let's solve a similar problem first, then map back to your homework.",
  workedExamples: [
    "d/dx (3x^2 + 1)^4 = 4(3x^2+1)^3 * 6x",
    "d/dx sin(x^2) = cos(x^2) * 2x"
  ],
  citations: [
    { source: "Stewart Calculus Chapter 3", url: "https://example.edu/materials/stewart-ch3" },
    { source: "Lecture 5: Chain Rule", url: "https://example.edu/materials/lecture-5" }
  ],
  suggestedAction: "Try one similar derivative and compare each chain step."
});

const buildValidation = (message: string): ValidationVerdict => {
  const directAnswer = /show me|give me the answer|just solve/i.test(message);
  if (directAnswer) {
    return {
      status: "modified",
      reason: "No final answers for graded homework",
      studentFacingMessage: "I can guide you with a similar example instead.",
      policyClause: "Do not provide final answer to graded problems"
    };
  }

  return {
    status: "approved",
    reason: "No policy conflict detected",
    studentFacingMessage: "",
    policyClause: ""
  };
};

const buildReflection = (): ReflectionPrompt => ({
  prompt: "How would you explain chain rule in one sentence?",
  kind: "metacognitive",
  optional: true
});

const hop = (agent: AgentHop["agent"], confidence: number, outputSummary: string, internalDetails: string): AgentHop => ({
  id: newId(),
  turnId: "",
  agent,
  startedAt: nowIso(),
  durationMs: 20,
  confidence,
  outputSummary,
  internalDetails
});

export class MockOrchestratorService {
  run(input: OrchestratorInput): OrchestratorOutput {
    const inference = buildInference(input.message);
    const dialogue = buildDialogue(input.selectedChip);
    const execution = buildExecution();
    const validation = buildValidation(input.message);
    const reflection = buildReflection();

    const trace: AgentHop[] = [
      hop("inference", inference.confidence, `Intent=${inference.intent}`, inference.rationale),
      hop("dialogue", 0.8, dialogue.question, `chips=${dialogue.chips.join("|")}`),
      hop("execution", 0.85, execution.scaffold, `examples=${execution.workedExamples.length}`),
      hop("validation", 0.9, `status=${validation.status}`, `clause=${validation.policyClause || "none"}`),
      hop("reflection", 0.78, reflection.prompt, `kind=${reflection.kind}`)
    ];

    return {
      inference,
      dialogue,
      execution,
      validation,
      reflection,
      trace
    };
  }
}
