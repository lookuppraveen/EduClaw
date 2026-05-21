import { HttpError } from "../../common/errors.js";
import { hasConsentScope } from "../../repositories/prisma/consent.repository.js";
import { sharesCourseWithLearner } from "../../repositories/prisma/course.repository.js";
import type { UserRole } from "../../types/auth.js";

const hasRole = (roles: UserRole[], role: UserRole): boolean => roles.includes(role);

export const assertLearnerReadAccess = async (actorUserId: string, actorRoles: UserRole[], learnerId: string): Promise<void> => {
  if (hasRole(actorRoles, "admin")) {
    return;
  }

  if (actorUserId === learnerId) {
    return;
  }

  if (hasRole(actorRoles, "faculty")) {
    if (await sharesCourseWithLearner(actorUserId, learnerId)) {
      return;
    }
    throw new HttpError(403, "LEARNER_STATE_FORBIDDEN", "Faculty user is not assigned to learner course context");
  }

  if (hasRole(actorRoles, "advisor")) {
    if (!(await hasConsentScope(learnerId, "advisor_visibility"))) {
      throw new HttpError(403, "CONSENT_REQUIRED", "Advisor visibility consent is required");
    }
    if (await sharesCourseWithLearner(actorUserId, learnerId)) {
      return;
    }
    throw new HttpError(403, "LEARNER_STATE_FORBIDDEN", "Advisor has no shared context for this learner");
  }

  throw new HttpError(403, "LEARNER_STATE_FORBIDDEN", "Insufficient permissions for learner state access");
};

export const assertConsentWriteAccess = (actorUserId: string, learnerId: string): void => {
  if (actorUserId !== learnerId) {
    throw new HttpError(403, "CONSENT_FORBIDDEN", "Only learner can update own consent settings");
  }
};

export const assertLearnerWriteAccess = (actorUserId: string, learnerId: string): void => {
  if (actorUserId !== learnerId) {
    throw new HttpError(403, "LEARNER_STATE_FORBIDDEN", "Only learner can update own learner state");
  }
};
