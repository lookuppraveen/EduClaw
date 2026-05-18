import type { Prisma } from "@prisma/client";
import { newId } from "../../common/crypto.js";
import { prisma } from "../../db/prisma.js";
import type { ConsentEvent, ConsentRecord, ConsentScope, ConsentScopeKey } from "../../types/learner-state.js";

const toScopes = (consent: {
  courseContext: boolean;
  priorConversations: boolean;
  advisorVisibility: boolean;
  thirdPartyTools: boolean;
}): ConsentScope[] => [
  { key: "course_context", enabled: consent.courseContext },
  { key: "prior_conversations", enabled: consent.priorConversations },
  { key: "advisor_visibility", enabled: consent.advisorVisibility },
  { key: "third_party_tools", enabled: consent.thirdPartyTools }
];

const fromScopes = (scopes: ConsentScope[]): {
  courseContext: boolean;
  priorConversations: boolean;
  advisorVisibility: boolean;
  thirdPartyTools: boolean;
} => {
  const read = (key: ConsentScopeKey): boolean => scopes.find((item) => item.key === key)?.enabled ?? false;
  return {
    courseContext: read("course_context"),
    priorConversations: read("prior_conversations"),
    advisorVisibility: read("advisor_visibility"),
    thirdPartyTools: read("third_party_tools")
  };
};

export const getConsentRecord = async (learnerId: string): Promise<ConsentRecord | null> => {
  const consent = await prisma.consent.findUnique({ where: { learnerId } });
  if (!consent) return null;
  return {
    learnerId: consent.learnerId,
    scopes: toScopes(consent),
    updatedAt: consent.updatedAt.toISOString()
  };
};

export const hasConsentScope = async (learnerId: string, key: ConsentScopeKey): Promise<boolean> => {
  const consent = await prisma.consent.findUnique({ where: { learnerId } });
  if (!consent) return false;
  return toScopes(consent).find((item) => item.key === key)?.enabled ?? false;
};

export const updateConsentRecord = async (
  learnerId: string,
  actorUserId: string,
  scopes: ConsentScope[],
  reason: string | null
): Promise<ConsentRecord> => {
  const normalized = fromScopes(scopes);
  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const consent = await tx.consent.upsert({
      where: { learnerId },
      update: {
        courseContext: normalized.courseContext,
        priorConversations: normalized.priorConversations,
        advisorVisibility: normalized.advisorVisibility,
        thirdPartyTools: normalized.thirdPartyTools
      },
      create: {
        learnerId,
        courseContext: normalized.courseContext,
        priorConversations: normalized.priorConversations,
        advisorVisibility: normalized.advisorVisibility,
        thirdPartyTools: normalized.thirdPartyTools
      }
    });

    await tx.consentHistory.create({
      data: {
        id: newId(),
        learnerId,
        actorUserId,
        reason,
        courseContext: normalized.courseContext,
        priorConversations: normalized.priorConversations,
        advisorVisibility: normalized.advisorVisibility,
        thirdPartyTools: normalized.thirdPartyTools,
        createdAt: new Date()
      }
    });

    return consent;
  });

  return {
    learnerId: updated.learnerId,
    scopes: toScopes(updated),
    updatedAt: updated.updatedAt.toISOString()
  };
};

export const listConsentEvents = async (learnerId: string): Promise<ConsentEvent[]> => {
  const history = await prisma.consentHistory.findMany({
    where: { learnerId },
    orderBy: { createdAt: "asc" }
  });

  return history.map((item: {
    id: string;
    learnerId: string;
    actorUserId: string;
    reason: string | null;
    courseContext: boolean;
    priorConversations: boolean;
    advisorVisibility: boolean;
    thirdPartyTools: boolean;
    createdAt: Date;
  }) => ({
    id: item.id,
    learnerId: item.learnerId,
    actorUserId: item.actorUserId,
    reason: item.reason,
    changedScopes: toScopes(item),
    createdAt: item.createdAt.toISOString()
  }));
};
