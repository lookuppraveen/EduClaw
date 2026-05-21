import type { ConsentScope } from "./learner-state.js";

export interface FerpaScopeRecord {
  learnerId: string;
  scopes: ConsentScope[];
  updatedAt: string;
  latestEvent: {
    id: string;
    actorUserId: string;
    reason: string | null;
    createdAt: string;
  } | null;
}
