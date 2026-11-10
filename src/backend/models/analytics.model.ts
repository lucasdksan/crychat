import type { AnalyticsEventType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/backend/models/prisma";

export function recordAnalyticsEvent(input: {
  storeId: string;
  type: AnalyticsEventType;
  payload: Record<string, unknown>;
}) {
  return prisma.analyticsEvent.create({
    data: {
      storeId: input.storeId,
      type: input.type,
      payload: input.payload as Prisma.InputJsonValue,
    },
  });
}

export async function getStoreMetricsSummary(storeId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    searchCount,
    zeroResultCount,
    sessionCount,
    clickCount,
    topQueries,
  ] = await Promise.all([
    prisma.searchEvent.count({
      where: { storeId, createdAt: { gte: since } },
    }),
    prisma.searchEvent.count({
      where: { storeId, createdAt: { gte: since }, zeroResults: true },
    }),
    prisma.chatSession.count({
      where: { storeId, createdAt: { gte: since } },
    }),
    prisma.productClickEvent.count({
      where: { storeId, createdAt: { gte: since } },
    }),
    prisma.searchEvent.groupBy({
      by: ["query"],
      where: { storeId, createdAt: { gte: since } },
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 10,
    }),
  ]);

  const searchesByDay = await prisma.$queryRaw<
    { day: Date; count: bigint }[]
  >`
    SELECT date_trunc('day', "createdAt") as day, count(*)::bigint as count
    FROM "SearchEvent"
    WHERE "storeId" = ${storeId} AND "createdAt" >= ${since}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  return {
    searchCount,
    zeroResultCount,
    sessionCount,
    clickCount,
    zeroResultRate: searchCount === 0 ? 0 : zeroResultCount / searchCount,
    topQueries: topQueries.map((row) => ({
      query: row.query,
      count: row._count.query,
    })),
    searchesByDay: searchesByDay.map((row) => ({
      day: row.day.toISOString().slice(0, 10),
      count: Number(row.count),
    })),
  };
}
