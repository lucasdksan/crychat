import type { AiProvider } from "@/backend/modules/ai/domain/ai-provider";
import type { VectorStore } from "@/backend/modules/search/domain/vector-store";
import {
  findCatalogProductsByIds,
  searchCatalogLexical,
} from "@/backend/models/catalog-product.model";

export async function hybridProductSearch(input: {
  storeId: string;
  query: string;
  ai: AiProvider;
  vectorStore?: VectorStore | null;
  limit?: number;
}) {
  const limit = input.limit ?? 12;
  const lexical = await searchCatalogLexical(input.storeId, input.query, limit);

  if (!input.vectorStore || !process.env.PINECONE_API_KEY) {
    return lexical;
  }

  try {
    const embedding = await input.ai.embed(input.query);
    const matches = await input.vectorStore.query(
      input.storeId,
      embedding.values,
      limit,
      { storeId: input.storeId },
    );
    const { findCatalogProductByExternalId } = await import(
      "@/backend/models/catalog-product.model"
    );
    const ids: string[] = [];
    for (const match of matches) {
      const fromLexical = lexical.find(
        (p) => p.externalId === match.metadata.externalId,
      );
      if (fromLexical) {
        ids.push(fromLexical.id);
        continue;
      }
      const found = await findCatalogProductByExternalId(
        input.storeId,
        match.metadata.externalId,
      );
      if (found) {
        ids.push(found.id);
      }
    }
    const semantic = await findCatalogProductsByIds(input.storeId, ids);

    const merged = [...semantic, ...lexical];
    const seen = new Set<string>();
    return merged.filter((p) => {
      if (seen.has(p.id)) {
        return false;
      }
      seen.add(p.id);
      return true;
    }).slice(0, limit);
  } catch {
    return lexical;
  }
}
