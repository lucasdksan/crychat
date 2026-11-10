import type { AiProvider } from "@/backend/modules/ai/domain/ai-provider";
import type { CommerceConnector } from "@/backend/modules/commerce/domain/types";
import type { VectorStore } from "@/backend/modules/search/domain/vector-store";
import type { ChatEngineResult, ChatIntent } from "@/backend/modules/chat/domain/intent";
import { buildStoreAssistantSystemPrompt } from "@/backend/modules/chat/application/prompts/system-prompt";
import { searchProductsTool } from "@/backend/modules/chat/application/tools/search-products";
import {
  recordAnalyticsEvent,
} from "@/backend/models/analytics.model";
import { recordSearchEvent } from "@/backend/models/search-event.model";

function detectIntent(message: string): ChatIntent {
  const lower = message.toLowerCase();
  if (/(compar|diferença|versus|vs\b)/.test(lower)) {
    return "compare";
  }
  if (/(promo|desconto|oferta|black)/.test(lower)) {
    return "promotion";
  }
  if (/(detalhe|especifica|ficha)/.test(lower)) {
    return "product_detail";
  }
  if (/(procuro|quero|preciso|busca|tem\b|mostra)/.test(lower)) {
    return "product_search";
  }
  return "smalltalk";
}

export type ChatEngineInput = {
  storeId: string;
  storeName: string;
  sessionId: string;
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  ai: AiProvider;
  connector?: CommerceConnector | null;
  vectorStore?: VectorStore | null;
};

export async function runChatEngine(
  input: ChatEngineInput,
): Promise<ChatEngineResult> {
  const started = Date.now();
  const intent = detectIntent(input.message);
  let products: ChatEngineResult["products"] = [];

  if (intent === "product_search" || intent === "compare" || intent === "promotion") {
    products = await searchProductsTool({
      storeId: input.storeId,
      query: input.message,
      ai: input.ai,
      vectorStore: input.vectorStore,
    });

    if (input.connector) {
      products = await Promise.all(
        products.map(async (product) => {
          const livePrice = await input.connector?.getLivePrice(product.externalId);
          const liveStock = await input.connector?.getLiveStock(product.externalId);
          return {
            ...product,
            price: livePrice ?? product.price,
            available: liveStock ?? undefined,
          };
        }),
      );
    }
  }

  const catalogContext =
    products.length > 0
      ? products
          .map(
            (p, i) =>
              `${i + 1}. ${p.name} — R$ ${p.price?.toFixed(2) ?? "consultar"} — id:${p.externalId}`,
          )
          .join("\n")
      : "Nenhum produto recuperado para esta consulta.";

  const system = buildStoreAssistantSystemPrompt(input.storeName);
  const userAugmented = [
    `Mensagem do cliente: ${input.message}`,
    `Intenção detectada: ${intent}`,
    "Produtos recuperados:",
    catalogContext,
  ].join("\n\n");

  const completion = await input.ai.generate({
    system,
    messages: [...input.history, { role: "user", content: userAugmented }],
  });

  await recordSearchEvent({
    storeId: input.storeId,
    sessionId: input.sessionId,
    query: input.message,
    resultCount: products.length,
    intent,
    productIds: products.map((p) => p.id),
  });

  await recordAnalyticsEvent({
    storeId: input.storeId,
    type: "chat_turn",
    payload: {
      sessionId: input.sessionId,
      intent,
      resultCount: products.length,
      latencyMs: Date.now() - started,
    },
  });

  return {
    reply: completion.text.trim(),
    intent,
    products,
    latencyMs: Date.now() - started,
    tokensIn: completion.tokensIn,
    tokensOut: completion.tokensOut,
  };
}
