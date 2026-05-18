import { HttpError } from "../../../common/errors.js";
import { hasCourseEnrollmentRole, listCourseIdsForEnrollmentRole } from "../../../repositories/prisma/course.repository.js";
import {
  createReviewDecision,
  findFlaggedTurnById,
  listFlaggedTurns
} from "../../../repositories/prisma/flagged-turn.repository.js";
import type { UserRole } from "../../../types/auth.js";
import type { FlaggedTurn, FlaggedTurnDetail, FlaggedTurnStatus, ReviewDecision, ReviewDecisionType } from "../../../types/reviews.js";

export interface ReviewActorContext {
  userId: string;
  roles: UserRole[];
}

export interface FlaggedReviewFilters {
  courseId?: string;
  status?: FlaggedTurnStatus;
}

export interface ReviewDecisionInput {
  decision: ReviewDecisionType;
  note: string;
}

const hasRole = (roles: UserRole[], role: UserRole): boolean => roles.includes(role);

export class ReviewService {
  async listFlaggedReviews(actor: ReviewActorContext, filters: FlaggedReviewFilters): Promise<FlaggedTurn[]> {
    await this.assertReviewRole(actor);

    if (filters.courseId) {
      await this.assertCourseReviewAccess(actor, filters.courseId);
      return await listFlaggedTurns({ courseId: filters.courseId, status: filters.status });
    }

    if (hasRole(actor.roles, "admin")) {
      return await listFlaggedTurns({ status: filters.status });
    }

    const courseIds = await listCourseIdsForEnrollmentRole(actor.userId, ["faculty"]);
    if (courseIds.length === 0) {
      return [];
    }

    return await listFlaggedTurns({ courseIds, status: filters.status });
  }

  async getFlaggedReview(actor: ReviewActorContext, flagId: string): Promise<FlaggedTurnDetail> {
    await this.assertReviewRole(actor);
    const flag = await findFlaggedTurnById(flagId);
    if (!flag) {
      throw new HttpError(404, "FLAGGED_TURN_NOT_FOUND", "Flagged turn not found");
    }

    await this.assertCourseReviewAccess(actor, flag.courseId);
    return flag;
  }

  async createDecision(actor: ReviewActorContext, flagId: string, input: ReviewDecisionInput): Promise<ReviewDecision> {
    const flag = await this.getFlaggedReview(actor, flagId);
    return await createReviewDecision({
      flagId: flag.id,
      reviewerId: actor.userId,
      decision: input.decision,
      note: input.note
    });
  }

  private async assertReviewRole(actor: ReviewActorContext): Promise<void> {
    if (hasRole(actor.roles, "admin") || hasRole(actor.roles, "faculty")) {
      return;
    }

    throw new HttpError(403, "REVIEW_FORBIDDEN", "Insufficient permissions for flagged turn reviews");
  }

  private async assertCourseReviewAccess(actor: ReviewActorContext, courseId: string): Promise<void> {
    if (hasRole(actor.roles, "admin")) {
      return;
    }

    if (hasRole(actor.roles, "faculty") && (await hasCourseEnrollmentRole(actor.userId, courseId, ["faculty"]))) {
      return;
    }

    throw new HttpError(403, "REVIEW_FORBIDDEN", "No review access for this course");
  }
}