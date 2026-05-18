import type { LearnerState } from "../types/learner-state.js";

export const learnerStates: LearnerState[] = [
  {
    learnerId: "usr_student_1",
    goals: [
      {
        id: "goal_1",
        text: "Understand chain rule for this week's homework",
        createdAt: "2026-05-01T10:00:00.000Z"
      }
    ],
    mastery: [
      {
        outcomeId: "out_math_chain_rule",
        score: 0.62,
        evidence: "Homework 4",
        updatedAt: "2026-05-10T10:00:00.000Z"
      }
    ],
    reflections: [
      {
        id: "refl_1",
        prompt: "How would you explain chain rule in one sentence?",
        response: "Differentiate outer, keep inner, then multiply by derivative of inner.",
        createdAt: "2026-05-11T10:00:00.000Z"
      }
    ]
  }
];
