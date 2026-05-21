export type ConsentScopeKey = "course_context" | "prior_conversations" | "advisor_visibility" | "third_party_tools";

export interface LearnerGoal {
  id: string;
  text: string;
  createdAt: string;
}

export interface LearnerMastery {
  outcomeId: string;
  score: number;
  evidence: string;
  updatedAt: string;
}

export interface ReflectionEntry {
  id: string;
  prompt: string;
  response: string;
  kind: "metacognitive" | "goal_check";
  createdAt: string;
}

export interface LearnerState {
  learnerId: string;
  goals: LearnerGoal[];
  mastery: LearnerMastery[];
  reflections: ReflectionEntry[];
}

export interface ConsentScope {
  key: ConsentScopeKey;
  enabled: boolean;
}

export interface ConsentRecord {
  learnerId: string;
  scopes: ConsentScope[];
  updatedAt: string;
}

export interface ConsentEvent {
  id: string;
  learnerId: string;
  actorUserId: string;
  reason: string | null;
  changedScopes: ConsentScope[];
  createdAt: string;
}
