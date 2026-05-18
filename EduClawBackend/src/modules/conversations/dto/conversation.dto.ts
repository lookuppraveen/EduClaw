import { z } from "zod";

export const createConversationSchema = z.object({
  learnerId: z.string().min(1),
  courseId: z.string().min(1),
  assignmentId: z.string().min(1).nullable().optional()
});

export const createTurnSchema = z.object({
  message: z.string().min(1).max(5000),
  courseId: z.string().min(1),
  assignmentId: z.string().min(1).nullable().optional(),
  selectedChip: z.string().min(1).nullable().optional()
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type CreateTurnInput = z.infer<typeof createTurnSchema>;
