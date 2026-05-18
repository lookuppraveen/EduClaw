import type { AgentHop, Conversation, ConversationTurn } from "../../../types/conversations.js";

export interface ConversationRepository {
  createConversation(conversation: Conversation): Promise<Conversation>;
  getConversationById(conversationId: string): Promise<Conversation | null>;
  saveTurn(turn: ConversationTurn, trace: AgentHop[]): Promise<ConversationTurn>;
  listTurnsByConversationId(conversationId: string): Promise<ConversationTurn[]>;
  getTurnById(turnId: string): Promise<ConversationTurn | null>;
  getTurnTrace(turnId: string): Promise<AgentHop[]>;
  updateConversationUpdatedAt(conversationId: string, updatedAt: string): Promise<void>;
}
