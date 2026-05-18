import { sha256 } from "../../common/crypto.js";
import { prisma } from "../../db/prisma.js";

export interface SessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: number;
  createdAt: number;
  revokedAt?: number;
}

export const saveSession = async (session: SessionRecord): Promise<void> => {
  await prisma.session.upsert({
    where: { id: session.id },
    update: {
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      expiresAt: new Date(session.expiresAt),
      revokedAt: session.revokedAt ? new Date(session.revokedAt) : null
    },
    create: {
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      createdAt: new Date(session.createdAt),
      expiresAt: new Date(session.expiresAt),
      revokedAt: session.revokedAt ? new Date(session.revokedAt) : null
    }
  });
};

export const getSession = async (sessionId: string): Promise<SessionRecord | undefined> => {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, deletedAt: null }
  });
  if (!session) return undefined;
  return {
    id: session.id,
    userId: session.userId,
    refreshTokenHash: session.refreshTokenHash,
    expiresAt: session.expiresAt.getTime(),
    createdAt: session.createdAt.getTime(),
    revokedAt: session.revokedAt?.getTime()
  };
};

export const revokeSession = async (sessionId: string): Promise<void> => {
  await prisma.session.updateMany({
    where: { id: sessionId, deletedAt: null },
    data: { revokedAt: new Date() }
  });
};

export const isRefreshTokenValid = async (sessionId: string, refreshToken: string): Promise<boolean> => {
  const session = await getSession(sessionId);
  if (!session) return false;
  if (session.revokedAt) return false;
  if (session.expiresAt < Date.now()) return false;
  return session.refreshTokenHash === sha256(refreshToken);
};