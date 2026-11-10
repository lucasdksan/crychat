import type { CommerceConnector } from "@/backend/modules/commerce/domain/types";
import type { AiProvider } from "@/backend/modules/ai/domain/ai-provider";
import type { VectorStore } from "@/backend/modules/search/domain/vector-store";
import { upsertCatalogProduct } from "@/backend/models/catalog-product.model";
import { prisma } from "@/backend/models/prisma";

export async function runCatalogSyncJob(input: {
  storeId: string;
  connector: CommerceConnector;
  ai: AiProvider;
  vectorStore?: VectorStore | null;
  jobId: string;
}) {
  await prisma.syncJob.update({
    where: { id: input.jobId },
    data: { status: "running", progress: 0, error: null },
  });

  try {
    const products = await input.connector.listProducts({ maxPages: 10 });
    const batchSize = 20;
    let processed = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const vectorBatch: Array<{
        id: string;
        values: number[];
        metadata: {
          storeId: string;
          externalId: string;
          name: string;
          sku?: string;
          category?: string;
          price?: number;
          available?: boolean;
        };
      }> = [];

      for (const product of batch) {
        let embeddingId: string | undefined;
        if (input.vectorStore) {
          const text = [product.name, product.brand, product.category, product.description]
            .filter(Boolean)
            .join(" ");
          const embedding = await input.ai.embed(text);
          embeddingId = `${input.storeId}:${product.externalId}`;
          vectorBatch.push({
            id: embeddingId,
            values: embedding.values,
            metadata: {
              storeId: input.storeId,
              externalId: product.externalId,
              name: product.name,
              sku: product.sku,
              category: product.category,
              price: product.price,
              available: product.available,
            },
          });
        }

        await upsertCatalogProduct(input.storeId, {
          externalId: product.externalId,
          sku: product.sku,
          name: product.name,
          brand: product.brand,
          category: product.category,
          description: product.description,
          price: product.price,
          listPrice: product.listPrice,
          available: product.available,
          url: product.url,
          imageUrl: product.imageUrl,
          embeddingId,
        });
      }

      if (input.vectorStore && vectorBatch.length > 0) {
        await input.vectorStore.upsert(input.storeId, vectorBatch);
      }

      processed += batch.length;
      const progress = Math.round((processed / products.length) * 100);
      await prisma.syncJob.update({
        where: { id: input.jobId },
        data: { progress },
      });
    }

    await prisma.syncJob.update({
      where: { id: input.jobId },
      data: { status: "completed", progress: 100 },
    });

    return { imported: products.length };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha na sincronização.";
    await prisma.syncJob.update({
      where: { id: input.jobId },
      data: { status: "failed", error: message },
    });
    throw error;
  }
}
