"use client";

import { createContext, useContext, type ReactNode } from "react";
import { users } from "./fixtures/users";
import { courses } from "./fixtures/courses";
import { mayaState } from "./fixtures/learner-state";
import { heroConversation } from "./fixtures/hero-conversation";
import { samplePolicy } from "./fixtures/policy";
import { flaggedTurns, type FlaggedTurn } from "./fixtures/flagged-turns";
import type {
  ConversationTurn,
  Course,
  LearnerState,
  User,
  ValidationPolicy,
  Role,
} from "./types";

type MockData = {
  users: Record<Role, User>;
  courses: Course[];
  learnerState: LearnerState;
  heroTurn: ConversationTurn;
  policies: ValidationPolicy[];
  flaggedTurns: FlaggedTurn[];
};

const defaultData: MockData = {
  users,
  courses,
  learnerState: mayaState,
  heroTurn: heroConversation,
  policies: [samplePolicy],
  flaggedTurns,
};

const MockDataContext = createContext<MockData>(defaultData);

export function MockDataProvider({
  children,
  data = defaultData,
}: {
  children: ReactNode;
  data?: MockData;
}) {
  return <MockDataContext.Provider value={data}>{children}</MockDataContext.Provider>;
}

export function useMockData() {
  return useContext(MockDataContext);
}
