import { prisma } from "../../db/prisma.js";
import type { User, UserRole } from "../../types/auth.js";

const mapUser = (user: {
  id: string;
  name: string;
  email: string;
  roles: { roleName: UserRole }[];
}): User => ({
  id: user.id,
  name: user.name,
  email: user.email,
  roles: user.roles.map((item) => item.roleName)
});

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null },
    include: { roles: { orderBy: { roleName: "asc" } } }
  });
  if (!user) return null;
  return mapUser(user);
};

export const findUserById = async (id: string): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { roles: { orderBy: { roleName: "asc" } } }
  });
  if (!user) return null;
  return mapUser(user);
};

export const listUsers = async (): Promise<User[]> => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    include: { roles: { orderBy: { roleName: "asc" } } },
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

  const user = await prisma.$transaction(async (tx) => {
    await tx.userRoleAssignment.deleteMany({ where: { userId } });
    await tx.userRoleAssignment.create({
      data: { userId, roleName: role }
    });

    return tx.user.findUnique({
      where: { id: userId },
      include: { roles: { orderBy: { roleName: "asc" } } }
    });
  });
  if (!user) return null;
  return mapUser(user);
};
