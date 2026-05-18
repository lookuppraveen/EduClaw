import { prisma } from "../../db/prisma.js";
import type { User } from "../../types/auth.js";

const mapRole = (role: string): User["roles"][number] => role as User["roles"][number];

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null }
  });
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, roles: [mapRole(user.role)] };
};

export const findUserById = async (id: string): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null }
  });
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, roles: [mapRole(user.role)] };
};

export const findFirstUser = async (): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" }
  });
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, roles: [mapRole(user.role)] };
};
