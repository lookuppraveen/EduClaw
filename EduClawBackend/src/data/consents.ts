import { newId } from "../common/crypto.js";
import type { ConsentEvent, ConsentRecord, ConsentScope, ConsentScopeKey } from "../types/learner-state.js";

const consentRecords = new Map<string, ConsentRecord>([
  [
    "usr_student_1",
    {
      learnerId: "usr_student_1",
      scopes: [
        { key: "course_context", enabled: true },
        { key: "prior_conversations", enabled: true },
        { key: "advisor_visibility", enabled: false },
        { key: "third_party_tools", enabled: false }
      ],
      updatedAt: "2026-05-10T09:00:00.000Z"
    }
  ]
]);

const consentEvents: ConsentEvent[] = [];

export const getConsentRecord = (learnerId: string): ConsentRecord | null => {
  return consentRecords.get(learnerId) ?? null;
};

export const hasConsentScope = (learnerId: string, key: ConsentScopeKey): boolean => {
  const record = consentRecords.get(learnerId);
  if (!record) return false;
  const scope = record.scopes.find((item) => item.key === key);
  return scope?.enabled ?? false;
};

export const updateConsentRecord = (
  learnerId: string,
  actorUserId: string,
  scopes: ConsentScope[],
  reason: string | null
): ConsentRecord => {
  const updatedAt = new Date().toISOString();
  const nextRecord: ConsentRecord = {
    learnerId,
    scopes,
    updatedAt
  };

  consentRecords.set(learnerId, nextRecord);

  consentEvents.push({
    id: newId(),
    learnerId,
    actorUserId,
    reason,
    changedScopes: scopes,
    createdAt: updatedAt
  });

  return nextRecord;
};

export const listConsentEvents = (learnerId: string): ConsentEvent[] => {
  return consentEvents.filter((item) => item.learnerId === learnerId);
};
