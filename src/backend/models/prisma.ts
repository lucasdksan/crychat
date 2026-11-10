import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function resolveConnectionString(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const directUrl = process.env.DIRECT_URL;
  if (process.env.NODE_ENV !== "production" && directUrl) {
    return directUrl;
  }
  return databaseUrl;
}

function getPgPool(): Pool {
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new Pool({
      connectionString: resolveConnectionString(),
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    });
  }
  return globalForPrisma.pgPool;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg(getPgPool());
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
