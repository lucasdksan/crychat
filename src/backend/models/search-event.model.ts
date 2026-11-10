import { prisma } from "@/backend/models/prisma";

export function recordSearchEvent(input: {
  storeId: string;
  sessionId?: string;
  query: string;
  resultCount: number;
  source?: string;
  intent?: string;
  productIds?: string[];
}) {
  return prisma.searchEvent.create({
    data: {
      storeId: input.storeId,
      sessionId: input.sessionId,
      query: input.query,
      resultCount: input.resultCount,
      zeroResults: input.resultCount === 0,
      source: input.source ?? "chat",
      intent: input.intent,
      productIds: input.productIds ?? [],
    },
  });
}

export function recordProductClick(input: {
  storeId: string;
  sessionId?: string;
  productId: string;
  source?: string;
}) {
  return prisma.productClickEvent.create({
    data: {
      storeId: input.storeId,
      sessionId: input.sessionId,
      productId: input.productId,
      source: input.source ?? "chat",
    },
  });
}
