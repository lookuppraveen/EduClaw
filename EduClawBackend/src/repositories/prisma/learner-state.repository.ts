import { prisma } from "../../db/prisma.js";
import type { LearnerState } from "../../types/learner-state.js";

export const findLearnerState = async (learnerId: string): Promise<LearnerState | null> => {
  const state = await prisma.learnerState.findUnique({
    where: { learnerId },
    include: {
      goals: true,
      mastery: true,
      reflections: true
    }
  });
  if (!state) return null;
  return {
    learnerId: state.learnerId,
    goals: state.goals.map((item: { id: string; text: string; createdAt: Date }) => ({ id: item.id, text: item.text, createdAt: item.createdAt.toISOString() })),
    mastery: state.mastery.map((item: { outcomeId: string; score: number; evidence: string; updatedAt: Date }) => ({
      outcomeId: item.outcomeId,
      score: item.score,
      evidence: item.evidence,
      updatedAt: item.updatedAt.toISOString()
    })),
    reflections: state.reflections.map((item: { id: string; prompt: string; response: string; createdAt: Date }) => ({
      id: item.id,
      prompt: item.prompt,
      response: item.response,
      createdAt: item.createdAt.toISOString()
    }))
  };
};
