import { HttpError } from "../../../common/errors.js";
import { newId } from "../../../common/crypto.js";
import { hasConsentScope } from "../../../repositories/prisma/consent.repository.js";
import { hasCourseEnrollment, hasCourseEnrollmentRole } from "../../../repositories/prisma/course.repository.js";
import { createFlaggedTurn } from "../../../repositories/prisma/flagged-turn.repository.js";
import { updateMasteryFromCompletedTurn } from "../../../repositories/prisma/learner-state.repository.js";
import { createAuditLog } from "../../../repositories/prisma/admin.repository.js";
import { listPublishedPoliciesForTurn } from "../../../repositories/prisma/policy.repository.js";
import type { UserRole } from "../../../types/auth.js";
import type { AgentHop, Conversation, ConversationTurn, ValidationVerdict } from "../../../types/conversations.js";
import type { CreateConversationInput, CreateTurnInput } from "../dto/conversation.dto.js";
import type { ConversationRepository } from "../repositories/conversation.repository.js";
import { PolicyEvaluatorService } from "../../policies/services/policy-evaluator.service.js";
import type { OrchestratorService } from "./orchestrator.service.js";

export interface ActorContext {
  userId: string;
  roles: UserRole[];
}

export class ConversationService {
  constructor(
    private readonly repository: ConversationRepository,
    private readonly orchestrator: OrchestratorService,
    private readonly policyEvaluator: PolicyEvaluatorService
  ) {}

  async createConversation(actor: ActorContext, input: CreateConversationInput): Promise<Conversation> {
    const canCreateForSelf = actor.userId === input.learnerId;
    const canAdmin = actor.roles.includes("admin");
    const canFaculty = actor.roles.includes("faculty")
      && (await hasCourseEnrollmentRole(actor.userId, input.courseId, ["faculty"]))
      && (await hasCourseEnrollment(input.learnerId, input.courseId));

    if (!canCreateForSelf && !canAdmin && !canFaculty) {
      throw new HttpError(403, "CONVERSATION_FORBIDDEN", "Cannot create conversation for this learner");
    }

    if (!(await hasCourseEnrollment(input.learnerId, input.courseId))) {
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
    await this.assertPriorConversationConsent(actor, conversation.learnerId);
    return await this.repository.listTurnsByConversationId(conversationId);
  }

  async createTurn(actor: ActorContext, conversationId: string, input: CreateTurnInput): Promise<ConversationTurn> {
    const conversation = await this.getConversation(actor, conversationId);

    if (conversation.courseId !== input.courseId) {
      throw new HttpError(422, "CONVERSATION_COURSE_MISMATCH", "Turn courseId must match conversation courseId");
    }

    if (!(await hasCourseEnrollment(conversation.learnerId, input.courseId))) {
      throw new HttpError(403, "CONVERSATION_FORBIDDEN", "Learner is not enrolled in requested course");
    }

    if (actor.userId !== conversation.learnerId && !actor.roles.includes("admin")) {
      throw new HttpError(403, "CONVERSATION_FORBIDDEN", "Cannot create turn for this conversation");
    }

    if (actor.roles.includes("faculty") && actor.userId !== conversation.learnerId) {
      await this.assertFacultyCourseAccess(actor.userId, conversation.courseId);
    }

    await this.assertCourseContextConsent(conversation.learnerId);

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

    await updateMasteryFromCompletedTurn({
      learnerId: savedTurn.learnerId,
      courseId: savedTurn.courseId,
      turnId: savedTurn.id,
      knowledgeGap: savedTurn.inference.knowledgeGap,
      confidence: savedTurn.inference.confidence,
      validationStatus: savedTurn.validation.status
    });
    await createAuditLog({
      actorUserId: actor.userId,
      action: "conversation.turn.create",
      targetType: "conversation_turn",
      targetId: savedTurn.id,
      metadata: {
        learnerId: savedTurn.learnerId,
        courseId: savedTurn.courseId,
        validationStatus: savedTurn.validation.status
      }
    });

    if (evaluation.violation) {
      const flaggedTurn = await createFlaggedTurn({
        turnId: savedTurn.id,
        policyId: evaluation.violation.policyId,
        clauseId: evaluation.violation.clause.id,
        courseId: savedTurn.courseId,
        learnerId: savedTurn.learnerId,
        reason: evaluation.violation.reason
      });
      await createAuditLog({
        actorUserId: actor.userId,
        action: "flagged_turn.create",
        targetType: "flagged_turn",
        targetId: flaggedTurn.id,
        metadata: {
          turnId: savedTurn.id,
          policyId: flaggedTurn.policyId,
          clauseId: flaggedTurn.clauseId,
          courseId: flaggedTurn.courseId
        }
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
    await this.assertPriorConversationConsent(actor, conversation.learnerId);

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

    if (actor.roles.includes("faculty") && (await hasCourseEnrollmentRole(actor.userId, conversation.courseId, ["faculty"]))) {
      return;
    }

    throw new HttpError(403, "CONVERSATION_FORBIDDEN", "No access to this conversation");
  }

  private async assertFacultyCourseAccess(actorUserId: string, courseId: string): Promise<void> {
    if (await hasCourseEnrollmentRole(actorUserId, courseId, ["faculty"])) {
      return;
    }

    throw new HttpError(403, "CONVERSATION_FORBIDDEN", "Faculty user is not assigned to this course context");
  }

  private async assertCourseContextConsent(learnerId: string): Promise<void> {
    if (await hasConsentScope(learnerId, "course_context")) {
      return;
    }

    throw new HttpError(403, "CONSENT_REQUIRED", "Course context consent is required");
  }

  private async assertPriorConversationConsent(actor: ActorContext, learnerId: string): Promise<void> {
    if (actor.userId === learnerId || actor.roles.includes("admin") || actor.roles.includes("auditor")) {
      return;
    }

    if (await hasConsentScope(learnerId, "prior_conversations")) {
      return;
    }

    throw new HttpError(403, "CONSENT_REQUIRED", "Prior conversation consent is required");
  }
}
