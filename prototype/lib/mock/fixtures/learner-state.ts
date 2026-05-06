import type { LearnerState } from "../types";

export const mayaState: LearnerState = {
  learnerId: "u_student_1",
  goals: {
    explicit: ["Pass MATH 1550 with a B or better", "Build daily study habit"],
    inferred: ["Wants confidence with derivative rules", "Prefers worked examples"],
  },
  mastery: [
    { outcomeId: "o_limits", estimate: 0.78, evidence: ["quiz-2", "homework-3"] },
    { outcomeId: "o_deriv", estimate: 0.62, evidence: ["homework-4", "in-class"] },
    { outcomeId: "o_chain", estimate: 0.34, evidence: ["homework-5 partial"] },
    { outcomeId: "o_optim", estimate: 0.0, evidence: [] },
  ],
  consentLedger: [
    {
      id: "scope_course_context",
      label: "Course context",
      description: "Let EduClaw see which course, module, and assignment you're working on.",
      granted: true,
      updatedAt: "2026-04-30T10:12:00Z",
    },
    {
      id: "scope_prior_conversations",
      label: "Prior conversations",
      description: "Let EduClaw remember your previous chats so it doesn't ask the same questions twice.",
      granted: true,
      updatedAt: "2026-04-30T10:12:00Z",
    },
    {
      id: "scope_advisor_visibility",
      label: "Advisor visibility",
      description: "Let your academic advisor see a summary of your EduClaw activity.",
      granted: false,
      updatedAt: "2026-04-30T10:12:00Z",
    },
    {
      id: "scope_third_party_tools",
      label: "Third-party tools",
      description: "Let EduClaw use your library and scheduling tools to help you act on suggestions.",
      granted: true,
      updatedAt: "2026-04-30T10:12:00Z",
    },
  ],
  reflections: [
    {
      id: "r_1",
      prompt: "In one sentence, when does the chain rule apply?",
      response: "When you have a function inside another function — derivative of the outside times derivative of the inside.",
      createdAt: "2026-05-04T15:32:00Z",
      outcomeId: "o_chain",
    },
  ],
};
