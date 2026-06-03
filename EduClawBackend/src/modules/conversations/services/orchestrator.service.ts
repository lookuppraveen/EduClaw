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

export interface OrchestratorService {
  run(input: OrchestratorInput): OrchestratorOutput;
}
