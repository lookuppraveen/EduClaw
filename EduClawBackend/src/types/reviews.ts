export type FlaggedTurnStatus = "pending" | "resolved";

export type ReviewDecisionType = "approve" | "override" | "escalate";

export interface FlaggedTurn {
  id: string;
  turnId: string;
  policyId: string;
  clauseId: string;
  courseId: string;
  learnerId: string;
  status: FlaggedTurnStatus;
  reason: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface FlaggedTurnCreateInput {
  turnId: string;
  policyId: string;
  clauseId: string;
  courseId: string;
  learnerId: string;
  reason: string;
}

export interface ReviewDecision {
  id: string;
  flagId: string;
  reviewerId: string;
  decision: ReviewDecisionType;
  note: string;
  policyId: string;
  clauseId: string;
  courseId: string;
  createdAt: string;
}

export interface ReviewDecisionCreateInput {
  flagId: string;
  reviewerId: string;
  decision: ReviewDecisionType;
  note: string;
}

export interface FlaggedTurnDetail extends FlaggedTurn {
  decisions: ReviewDecision[];
}