import type { Prisma } from "@prisma/client";
import type { AgentHop, Citation, Conversation, ConversationTurn } from "../../../types/conversations.js";
import type { ConversationRepository } from "./conversation.repository.js";
import { prisma } from "../../../db/prisma.js";

const parseReflectionKind = (value: "metacognitive" | "goal_check"): "metacognitive" | "goal-check" => {
  if (value === "goal_check") return "goal-check";
  return "metacognitive";
};

const parseConversation = (row: {
  id: string;
  learnerId: string;
  courseId: string;
  assignmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Conversation => ({
  id: row.id,
  learnerId: row.learnerId,
  courseId: row.courseId,
  assignmentId: row.assignmentId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString()
});

const parseTurn = (row: {
  id: string;
  conversationId: string;
  learnerId: string;
  courseId: string;
  assignmentId: string | null;
  studentInput: string;
  selectedChip: string | null;
  inferenceIntent: string;
  inferenceConfusion: string;
  inferenceGap: string;
  inferenceUrgency: string;
  inferenceConfidence: number;
  inferenceRationale: string;
  inferenceNextAgent: "inference" | "dialogue" | "execution" | "validation" | "reflection";
  dialogueQuestion: string;
  dialogueChips: string[];
  executionScaffold: string;
  executionExamples: string[];
  executionCitations: unknown;
  executionAction: string;
  validationStatus: "approved" | "modified" | "blocked";
  validationReason: string;
  validationMessage: string;
  validationClause: string;
  reflectionPrompt: string;
  reflectionKind: "metacognitive" | "goal_check";
  reflectionOptional: boolean;
  createdAt: Date;
}): ConversationTurn => ({
  id: row.id,
  conversationId: row.conversationId,
  learnerId: row.learnerId,
  courseId: row.courseId,
  assignmentId: row.assignmentId,
  studentInput: row.studentInput,
  selectedChip: row.selectedChip,
  inference: {
    intent: row.inferenceIntent,
    confusionLevel: row.inferenceConfusion as "low" | "medium" | "high",
    knowledgeGap: row.inferenceGap,
    urgency: row.inferenceUrgency as "low" | "medium" | "high",
    confidence: row.inferenceConfidence,
    rationale: row.inferenceRationale,
    recommendedNextAgent: row.inferenceNextAgent
  },
  dialogue: {
    question: row.dialogueQuestion,
    chips: row.dialogueChips
  },
  execution: {
    scaffold: row.executionScaffold,
    workedExamples: row.executionExamples,
    citations: (row.executionCitations as Citation[]) ?? [],
    suggestedAction: row.executionAction
  },
  validation: {
    status: row.validationStatus,
    reason: row.validationReason,
    studentFacingMessage: row.validationMessage,
    policyClause: row.validationClause
  },
  reflection: {
    prompt: row.reflectionPrompt,
    kind: parseReflectionKind(row.reflectionKind),
    optional: row.reflectionOptional
  },
  createdAt: row.createdAt.toISOString()
});

const parseTrace = (row: {
  id: string;
  turnId: string;
  agent: "inference" | "dialogue" | "execution" | "validation" | "reflection";
  startedAt: Date;
  durationMs: number;
  confidence: number;
  outputSummary: string;
  internalDetails: string;
}): AgentHop => ({
  id: row.id,
  turnId: row.turnId,
  agent: row.agent,
  startedAt: row.startedAt.toISOString(),
  durationMs: row.durationMs,
  confidence: row.confidence,
  outputSummary: row.outputSummary,
  internalDetails: row.internalDetails
});

export class PrismaConversationRepository implements ConversationRepository {
  async createConversation(conversation: Conversation): Promise<Conversation> {
    const row = await prisma.conversation.create({
      data: {
        id: conversation.id,
        learnerId: conversation.learnerId,
        courseId: conversation.courseId,
        assignmentId: conversation.assignmentId,
        createdAt: new Date(conversation.createdAt),
        updatedAt: new Date(conversation.updatedAt)
      }
    });
    return parseConversation(row);
  }

  async getConversationById(conversationId: string): Promise<Conversation | null> {
    const row = await prisma.conversation.findFirst({
      where: { id: conversationId, deletedAt: null }
    });
    if (!row) return null;
    return parseConversation(row);
  }

  async saveTurn(turn: ConversationTurn, trace: AgentHop[]): Promise<ConversationTurn> {
    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const turnRow = await tx.conversationTurn.create({
        data: {
          id: turn.id,
          conversationId: turn.conversationId,
          learnerId: turn.learnerId,
          courseId: turn.courseId,
          assignmentId: turn.assignmentId,
          studentInput: turn.studentInput,
          selectedChip: turn.selectedChip,
          inferenceIntent: turn.inference.intent,
          inferenceConfusion: turn.inference.confusionLevel,
          inferenceGap: turn.inference.knowledgeGap,
          inferenceUrgency: turn.inference.urgency,
          inferenceConfidence: turn.inference.confidence,
          inferenceRationale: turn.inference.rationale,
          inferenceNextAgent: turn.inference.recommendedNextAgent,
          dialogueQuestion: turn.dialogue.question,
          dialogueChips: turn.dialogue.chips,
          executionScaffold: turn.execution.scaffold,
          executionExamples: turn.execution.workedExamples,
          executionCitations: turn.execution.citations as unknown as Prisma.InputJsonValue,
          executionAction: turn.execution.suggestedAction,
          validationStatus: turn.validation.status,
          validationReason: turn.validation.reason,
          validationMessage: turn.validation.studentFacingMessage,
          validationClause: turn.validation.policyClause,
          reflectionPrompt: turn.reflection.prompt,
          reflectionKind: turn.reflection.kind === "goal-check" ? "goal_check" : "metacognitive",
          reflectionOptional: turn.reflection.optional,
          createdAt: new Date(turn.createdAt)
        }
      });

      if (trace.length > 0) {
        await tx.agentTrace.createMany({
          data: trace.map((hop) => ({
            id: hop.id,
            turnId: turn.id,
            agent: hop.agent,
            startedAt: new Date(hop.startedAt),
            durationMs: hop.durationMs,
            confidence: hop.confidence,
            outputSummary: hop.outputSummary,
            internalDetails: hop.internalDetails
          }))
        });
      }

      return turnRow;
    });

    return parseTurn(created);
  }

  async listTurnsByConversationId(conversationId: string): Promise<ConversationTurn[]> {
    const rows = await prisma.conversationTurn.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" }
    });
    return rows.map(parseTurn);
  }

  async getTurnById(turnId: string): Promise<ConversationTurn | null> {
    const row = await prisma.conversationTurn.findUnique({ where: { id: turnId } });
    if (!row) return null;
    return parseTurn(row);
  }

  async getTurnTrace(turnId: string): Promise<AgentHop[]> {
    const rows = await prisma.agentTrace.findMany({
      where: { turnId },
      orderBy: { createdAt: "asc" }
    });
    return rows.map(parseTrace);
  }

  async updateConversationUpdatedAt(conversationId: string, updatedAt: string): Promise<void> {
    await prisma.conversation.updateMany({
      where: { id: conversationId, deletedAt: null },
      data: { updatedAt: new Date(updatedAt) }
    });
  }
}
