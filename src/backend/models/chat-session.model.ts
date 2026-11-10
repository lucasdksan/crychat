import type { ChatMessageRole } from "@/generated/prisma/client";
import { prisma } from "@/backend/models/prisma";

export function createChatSession(storeId: string, userId?: string) {
  return prisma.chatSession.create({
    data: { storeId, userId },
  });
}

export function findChatSession(sessionId: string, storeId: string) {
  return prisma.chatSession.findFirst({
    where: { id: sessionId, storeId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });
}

export function appendChatMessage(input: {
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  productRefs?: unknown;
  toolCalls?: unknown;
  intent?: string;
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
}) {
  return prisma.chatMessage.create({
    data: {
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      productRefs: input.productRefs as object | undefined,
      toolCalls: input.toolCalls as object | undefined,
      intent: input.intent,
      latencyMs: input.latencyMs,
      tokensIn: input.tokensIn,
      tokensOut: input.tokensOut,
    },
  });
}
