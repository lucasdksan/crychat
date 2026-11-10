import { hybridProductSearch } from "@/backend/modules/search/application/hybrid-search";
import type { AiProvider } from "@/backend/modules/ai/domain/ai-provider";
import type { VectorStore } from "@/backend/modules/search/domain/vector-store";
import type { ProductRef } from "@/backend/modules/chat/domain/intent";

export async function searchProductsTool(input: {
  storeId: string;
  query: string;
  ai: AiProvider;
  vectorStore?: VectorStore | null;
  limit?: number;
}): Promise<ProductRef[]> {
  const rows = await hybridProductSearch({
    storeId: input.storeId,
    query: input.query,
    ai: input.ai,
    vectorStore: input.vectorStore,
    limit: input.limit ?? 8,
  });

  return rows.map((p) => ({
    id: p.id,
    externalId: p.externalId,
    name: p.name,
    price: p.price ? Number(p.price) : null,
    imageUrl: p.imageUrl,
    url: p.url,
  }));
}
