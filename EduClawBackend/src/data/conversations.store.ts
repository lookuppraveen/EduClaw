import type { AgentHop, Conversation, ConversationTurn } from "../types/conversations.js";

export const conversationStore = new Map<string, Conversation>();
export const conversationTurnsStore = new Map<string, ConversationTurn[]>();
export const turnIndexStore = new Map<string, ConversationTurn>();
export const turnTraceStore = new Map<string, AgentHop[]>();
