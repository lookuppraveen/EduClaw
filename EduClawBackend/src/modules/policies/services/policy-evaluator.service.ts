import type { ExecutionResponse, InferenceDiagnosis, ValidationStatus, ValidationVerdict } from "../../../types/conversations.js";
import type { PolicyClause, PolicyViolationAction, ValidationPolicy } from "../../../types/policies.js";

export interface PolicyEvaluationContext {
  studentInput: string;
  selectedChip: string | null;
  courseId: string;
  assignmentId: string | null;
  inference: InferenceDiagnosis;
  execution: ExecutionResponse;
}

export interface PolicyEvaluationViolation {
  policyId: string;
  policyTitle: string;
  clause: PolicyClause;
  score: number;
  status: ValidationStatus;
  reason: string;
  studentFacingMessage: string;
}

export interface PolicyEvaluationResult {
  validation: ValidationVerdict;
  violation: PolicyEvaluationViolation | null;
}

interface ClauseMatchCandidate {
  policy: ValidationPolicy;
  clause: PolicyClause;
  score: number;
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "provide",
  "student",
  "students",
  "asks",
  "request",
  "requests",
  "when",
  "rule"
]);

const ACTION_RANK: Record<PolicyViolationAction, number> = {
  block: 3,
  modify: 2,
  flag: 1
};

const statusForAction = (action: PolicyViolationAction): ValidationStatus => {
  if (action === "block") return "blocked";
  return "modified";
};

const normalizeToken = (token: string): string => {
  const lower = token.toLowerCase();
  if (lower.endsWith("ing") && lower.length > 6) return lower.slice(0, -3);
  if (lower.endsWith("ed") && lower.length > 5) return lower.slice(0, -2);
  if (lower.endsWith("ly") && lower.length > 5) return lower.slice(0, -2);
  if (lower.endsWith("s") && lower.length > 4) return lower.slice(0, -1);
  return lower;
};

const tokenize = (value: string): Set<string> => {
  const tokens = value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map(normalizeToken)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

  return new Set(tokens);
};

const scoreClause = (context: PolicyEvaluationContext, clause: PolicyClause): number => {
  const policyTokens = tokenize(`${clause.when} ${clause.rule}`);
  const contentTokens = tokenize([
    context.studentInput,
    context.selectedChip ?? "",
    context.inference.intent,
    context.inference.knowledgeGap,
    context.execution.scaffold,
    context.execution.suggestedAction
  ].join(" "));

  let score = 0;
  for (const token of policyTokens) {
    if (contentTokens.has(token)) {
      score += 1;
    }
  }

  return score;
};

const sortCandidate = (left: ClauseMatchCandidate, right: ClauseMatchCandidate): number => {
  const actionDelta = ACTION_RANK[right.clause.onViolation] - ACTION_RANK[left.clause.onViolation];
  if (actionDelta !== 0) return actionDelta;
  return right.score - left.score;
};

export class PolicyEvaluatorService {
  evaluate(context: PolicyEvaluationContext, policies: ValidationPolicy[], fallback: ValidationVerdict): PolicyEvaluationResult {
    const matches = policies.flatMap((policy) =>
      policy.clauses
        .map((clause) => ({ policy, clause, score: scoreClause(context, clause) }))
        .filter((candidate) => candidate.score >= 2)
    );

    if (matches.length === 0) {
      return { validation: fallback, violation: null };
    }

    const selected = matches.sort(sortCandidate)[0];
    const status = statusForAction(selected.clause.onViolation);
    const reason = `Policy "${selected.policy.title}" matched clause "${selected.clause.rule}"`;
    const studentFacingMessage = status === "blocked"
      ? "I cannot help with that request under your course policy. I can still help you reason through the concept."
      : "I adjusted the response to follow your course policy.";

    return {
      validation: {
        status,
        reason,
        studentFacingMessage,
        policyClause: selected.clause.rule
      },
      violation: {
        policyId: selected.policy.id,
        policyTitle: selected.policy.title,
        clause: selected.clause,
        score: selected.score,
        status,
        reason,
        studentFacingMessage
      }
    };
  }
}