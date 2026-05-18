import { sha256 } from "../common/crypto.js";

export interface SessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: number;
  createdAt: number;
  revokedAt?: number;
}

const sessions = new Map<string, SessionRecord>();

export const saveSession = (session: SessionRecord): void => {
  sessions.set(session.id, session);
};

export const getSession = (sessionId: string): SessionRecord | undefined => {
  return sessions.get(sessionId);
};

export const revokeSession = (sessionId: string): void => {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.revokedAt = Date.now();
  sessions.set(sessionId, session);
};

export const isRefreshTokenValid = (sessionId: string, refreshToken: string): boolean => {
  const session = sessions.get(sessionId);
  if (!session) return false;
  if (session.revokedAt) return false;
  if (session.expiresAt < Date.now()) return false;
  return session.refreshTokenHash === sha256(refreshToken);
};
