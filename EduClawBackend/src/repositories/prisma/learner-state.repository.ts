import { prisma } from "../../db/prisma.js";
import { newId } from "../../common/crypto.js";
import type { LearnerGoal, LearnerMastery, LearnerState, ReflectionEntry } from "../../types/learner-state.js";

type ReflectionKind = ReflectionEntry["kind"];

const clampMasteryScore = (score: number): number => Math.max(0, Math.min(1, Number(score.toFixed(2))));

const tokenize = (value: string): string[] => {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3);
};

const findBestOutcomeId = async (courseId: string, knowledgeGap: string): Promise<string | null> => {
  const outcomes = await prisma.outcome.findMany({
    where: { courseId },
    select: { id: true, code: true, description: true }
  });

  const gapTokens = tokenize(knowledgeGap);
  if (gapTokens.length === 0) return outcomes[0]?.id ?? null;

  const scored = outcomes
    .map((outcome) => {
      const haystack = `${outcome.code} ${outcome.description}`.toLowerCase();
      const score = gapTokens.filter((token) => haystack.includes(token)).length;
      return { id: outcome.id, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0] && scored[0].score > 0 ? scored[0].id : outcomes[0]?.id ?? null;
};

export const findLearnerState = async (learnerId: string): Promise<LearnerState | null> => {
  const state = await prisma.learnerState.findUnique({
    where: { learnerId },
    include: {
      goals: { orderBy: { createdAt: "asc" } },
      mastery: { orderBy: { updatedAt: "desc" } },
      reflections: { orderBy: { createdAt: "desc" } }
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
    reflections: state.reflections.map((item: { id: string; prompt: string; response: string; kind: ReflectionKind; createdAt: Date }) => ({
      id: item.id,
      prompt: item.prompt,
      response: item.response,
      kind: item.kind,
      createdAt: item.createdAt.toISOString()
    }))
  };
};

export const replaceLearnerGoals = async (learnerId: string, goals: { text: string }[]): Promise<LearnerGoal[]> => {
  const now = new Date();
  const updatedGoals = await prisma.$transaction(async (tx) => {
    await tx.learnerState.upsert({
      where: { learnerId },
      update: {},
      create: { learnerId }
    });

    await tx.learnerGoal.deleteMany({ where: { learnerId } });

    if (goals.length > 0) {
      await tx.learnerGoal.createMany({
        data: goals.map((goal, index) => ({
          id: newId(),
          learnerId,
          text: goal.text,
          createdAt: new Date(now.getTime() + index)
        }))
      });
    }

    return tx.learnerGoal.findMany({
      where: { learnerId },
      orderBy: { createdAt: "asc" }
    });
  });

  return updatedGoals.map((item) => ({
    id: item.id,
    text: item.text,
    createdAt: item.createdAt.toISOString()
  }));
};

export const createReflectionEntry = async (
  learnerId: string,
  input: { prompt: string; response: string; kind: ReflectionKind }
): Promise<ReflectionEntry> => {
  await prisma.learnerState.upsert({
    where: { learnerId },
    update: {},
    create: { learnerId }
  });

  const reflection = await prisma.reflectionEntry.create({
    data: {
      id: newId(),
      learnerId,
      prompt: input.prompt,
      response: input.response,
      kind: input.kind,
      createdAt: new Date()
    }
  });

  return {
    id: reflection.id,
    prompt: reflection.prompt,
    response: reflection.response,
    kind: reflection.kind,
    createdAt: reflection.createdAt.toISOString()
  };
};

export const listReflectionEntries = async (
  learnerId: string,
  options: { limit: number; cursor?: string; kind?: ReflectionKind }
): Promise<{ reflections: ReflectionEntry[]; nextCursor: string | null }> => {
  const reflections = await prisma.reflectionEntry.findMany({
    where: {
      learnerId,
      kind: options.kind
    },
    orderBy: { createdAt: "desc" },
    take: options.limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {})
  });

  const page = reflections.slice(0, options.limit);
  const nextCursor = reflections.length > options.limit ? page[page.length - 1]?.id ?? null : null;

  return {
    reflections: page.map((item) => ({
      id: item.id,
      prompt: item.prompt,
      response: item.response,
      kind: item.kind,
      createdAt: item.createdAt.toISOString()
    })),
    nextCursor
  };
};

export const updateMasteryFromCompletedTurn = async (input: {
  learnerId: string;
  courseId: string;
  turnId: string;
  knowledgeGap: string;
  confidence: number;
  validationStatus: "approved" | "modified" | "blocked";
}): Promise<LearnerMastery | null> => {
  if (input.validationStatus === "blocked") {
    return null;
  }

  const outcomeId = await findBestOutcomeId(input.courseId, input.knowledgeGap);
  if (!outcomeId) {
    return null;
  }

  const now = new Date();
  const delta = input.validationStatus === "approved" ? 0.04 : 0.02;
  const confidenceAdjustedScore = clampMasteryScore(input.confidence * 0.75);

  const mastery = await prisma.$transaction(async (tx) => {
    await tx.learnerState.upsert({
      where: { learnerId: input.learnerId },
      update: {},
      create: { learnerId: input.learnerId }
    });

    const existing = await tx.learnerMastery.findFirst({
      where: { learnerId: input.learnerId, outcomeId },
      orderBy: { updatedAt: "desc" }
    });

    const evidence = `Conversation turn ${input.turnId}`;

    if (existing) {
      return tx.learnerMastery.update({
        where: { id: existing.id },
        data: {
          score: clampMasteryScore(Math.max(existing.score + delta, confidenceAdjustedScore)),
          evidence,
          updatedAt: now
        }
      });
    }

    return tx.learnerMastery.create({
      data: {
        id: newId(),
        learnerId: input.learnerId,
        outcomeId,
        score: confidenceAdjustedScore,
        evidence,
        updatedAt: now
      }
    });
  });

  return {
    outcomeId: mastery.outcomeId,
    score: mastery.score,
    evidence: mastery.evidence,
    updatedAt: mastery.updatedAt.toISOString()
  };
};
