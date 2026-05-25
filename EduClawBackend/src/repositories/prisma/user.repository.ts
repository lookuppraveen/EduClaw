import { prisma } from "../../db/prisma.js";
import type { User, UserRole } from "../../types/auth.js";

const mapRole = (role: string): User["roles"][number] => role as User["roles"][number];

const mapUser = (user: {
  id: string;
  name: string;
  email: string;
  role: string;
}): User => ({
  id: user.id,
  name: user.name,
  email: user.email,
  roles: [mapRole(user.role)]
});

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null }
  });
  if (!user) return null;
  return mapUser(user);
};

export const findUserById = async (id: string): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null }
  });
  if (!user) return null;
  return mapUser(user);
};

export const listUsers = async (): Promise<User[]> => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" }
  });
  return users.map(mapUser);
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<User | null> => {
  const existing = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true }
  });
  if (!existing) return null;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role }
  });
  return mapUser(user);
};
