import { HttpError } from "../../../common/errors.js";
import { newId } from "../../../common/crypto.js";
import { hasCourseEnrollment, sharesCourseWithLearner } from "../../../repositories/prisma/course.repository.js";
import { createFlaggedTurn } from "../../../repositories/prisma/flagged-turn.repository.js";
import { listPublishedPoliciesForTurn } from "../../../repositories/prisma/policy.repository.js";
import type { UserRole } from "../../../types/auth.js";
import type { AgentHop, Conversation, ConversationTurn, ValidationVerdict } from "../../../types/conversations.js";
import type { CreateConversationInput, CreateTurnInput } from "../dto/conversation.dto.js";
import type { ConversationRepository } from "../repositories/conversation.repository.js";
import { PolicyEvaluatorService } from "../../policies/services/policy-evaluator.service.js";
import { MockOrchestratorService } from "./mock-orchestrator.service.js";

export interface ActorContext {
  userId: string;
  roles: UserRole[];
}

export class ConversationService {
  constructor(
    private readonly repository: ConversationRepository,
    private readonly orchestrator: MockOrchestratorService,
    private readonly policyEvaluator: PolicyEvaluatorService
  ) {}

  async createConversation(actor: ActorContext, input: CreateConversationInput): Promise<Conversation> {
    const canCreateForSelf = actor.userId === input.learnerId;
    const canAdmin = actor.roles.includes("admin");
    const canFaculty = actor.roles.includes("faculty") && (await sharesCourseWithLearner(actor.userId, input.learnerId));

    if (!canCreateForSelf && !canAdmin && !canFaculty) {
      throw new HttpError(403, "CONVERSATION_FORBIDDEN", "Cannot create conversation for this learner");
    }

    if (!(await hasCourseEnrollment(input.learnerId, input.courseId)) && !canAdmin) {
      throw new HttpError(403, "CONVERSATION_FORBIDDEN", "Learner is not enrolled in requested course");
    }

    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: newId(),
      learnerId: input.learnerId,
      courseId: input.courseId,
      assignmentId: input.assignmentId ?? null,
      createdAt: now,
      updatedAt: now
    };

    return await this.repository.createConversation(conversation);
  }

  async getConversation(actor: ActorContext, conversationId: string): Promise<Conversation> {
    const conversation = await this.repository.getConversationById(conversationId);
    if (!conversation) {
      throw new HttpError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
    }

    await this.assertConversationReadAccess(actor, conversation);
    return conversation;
  }

  async listTurns(actor: ActorContext, conversationId: string): Promise<ConversationTurn[]> {
    const conversation = await this.getConversation(actor, conversationId);
    await this.assertConversationReadAccess(actor, conversation);
    return await this.repository.listTurnsByConversationId(conversationId);
  }

  async createTurn(actor: ActorContext, conversationId: string, input: CreateTurnInput): Promise<ConversationTurn> {
    const conversation = await this.getConversation(actor, conversationId);

    if (conversation.courseId !== input.courseId) {
      throw new HttpError(422, "CONVERSATION_COURSE_MISMATCH", "Turn courseId must match conversation courseId");
    }

    if (actor.userId !== conversation.learnerId && !actor.roles.includes("admin") && !actor.roles.includes("faculty")) {
      throw new HttpError(403, "CONVERSATION_FORBIDDEN", "Cannot create turn for this conversation");
    }

    const orchestrated = this.orchestrator.run({
      message: input.message,
      selectedChip: input.selectedChip ?? null
    });

    const assignmentId = input.assignmentId ?? conversation.assignmentId;
    const policies = await listPublishedPoliciesForTurn(input.courseId, assignmentId);
    const evaluation = this.policyEvaluator.evaluate(
      {
        studentInput: input.message,
        selectedChip: input.selectedChip ?? null,
        courseId: input.courseId,
        assignmentId,
        inference: orchestrated.inference,
        execution: orchestrated.execution
      },
      policies,
      orchestrated.validation
    );

    const now = new Date().toISOString();
    const turnId = newId();
    const trace: AgentHop[] = this.buildTrace(orchestrated.trace, turnId, evaluation.validation);

    const turn: ConversationTurn = {
      id: turnId,
      conversationId,
      learnerId: conversation.learnerId,
      courseId: input.courseId,
      assignmentId,
      studentInput: input.message,
      selectedChip: input.selectedChip ?? null,
      inference: orchestrated.inference,
      dialogue: orchestrated.dialogue,
      execution: orchestrated.execution,
      validation: evaluation.validation,
      reflection: orchestrated.reflection,
      createdAt: now
    };

    await this.repository.updateConversationUpdatedAt(conversationId, now);
    const savedTurn = await this.repository.saveTurn(turn, trace);

    if (evaluation.violation) {
      await createFlaggedTurn({
        turnId: savedTurn.id,
        policyId: evaluation.violation.policyId,
        clauseId: evaluation.violation.clause.id,
        courseId: savedTurn.courseId,
        learnerId: savedTurn.learnerId,
        reason: evaluation.violation.reason
      });
    }

    return savedTurn;
  }

  async getTurnTrace(actor: ActorContext, turnId: string): Promise<AgentHop[]> {
    const turn = await this.repository.getTurnById(turnId);
    if (!turn) {
      throw new HttpError(404, "TURN_NOT_FOUND", "Turn not found");
    }

    const conversation = await this.getConversation(actor, turn.conversationId);
    await this.assertConversationReadAccess(actor, conversation);

    const trace = await this.repository.getTurnTrace(turnId);

    if (actor.roles.includes("admin") || actor.roles.includes("auditor")) {
      return trace;
    }

    if (actor.roles.includes("faculty")) {
      return trace.map((hop) => ({
        ...hop,
        internalDetails: hop.agent === "validation" ? hop.internalDetails : "hidden"
      }));
    }

    return trace.map((hop) => ({
      ...hop,
      internalDetails: "hidden",
      outputSummary: hop.agent === "validation" ? `status=${turn.validation.status}` : hop.outputSummary
    }));
  }

  private buildTrace(trace: AgentHop[], turnId: string, validation: ValidationVerdict): AgentHop[] {
    return trace.map((item) => {
      if (item.agent !== "validation") {
        return { ...item, turnId };
      }

      return {
        ...item,
        turnId,
        outputSummary: `status=${validation.status}`,
        internalDetails: `reason=${validation.reason}; clause=${validation.policyClause || "none"}`
      };
    });
  }

  private async assertConversationReadAccess(actor: ActorContext, conversation: Conversation): Promise<void> {
    if (actor.roles.includes("admin") || actor.roles.includes("auditor")) {
      return;
    }

    if (actor.userId === conversation.learnerId) {
      return;
    }

    if (actor.roles.includes("faculty") && (await sharesCourseWithLearner(actor.userId, conversation.learnerId))) {
      return;
    }

    throw new HttpError(403, "CONVERSATION_FORBIDDEN", "No access to this conversation");
  }
}