import type { Conversation, ConversationTurn } from "../../../types/conversations.js";

export interface ConversationListItemDto {
  id: string;
  learnerId: string;
  courseId: string;
  assignmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetailDto {
  conversation: ConversationListItemDto;
}

export interface ConversationTurnsDto {
  turns: ConversationTurn[];
}

export const mapConversationDto = (conversation: Conversation): ConversationListItemDto => ({
  id: conversation.id,
  learnerId: conversation.learnerId,
  courseId: conversation.courseId,
  assignmentId: conversation.assignmentId,
  createdAt: conversation.createdAt,
  updatedAt: conversation.updatedAt
});
