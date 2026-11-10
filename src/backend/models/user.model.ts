import { prisma } from "@/backend/models/prisma";

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { activeStore: true, stores: { take: 1, orderBy: { createdAt: "asc" } } },
  });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function setActiveStore(userId: string, storeId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { activeStoreId: storeId },
  });
}
