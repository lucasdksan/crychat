import { Pinecone } from "@pinecone-database/pinecone";

import type {
  VectorQueryMatch,
  VectorStore,
  VectorMetadata,
} from "@/backend/modules/search/domain/vector-store";

export class PineconeVectorStore implements VectorStore {
  private readonly indexName: string;
  private client: Pinecone | null = null;

  constructor(indexName?: string) {
    this.indexName = indexName ?? process.env.PINECONE_INDEX ?? "";
  }

  private getClient(): Pinecone {
    const apiKey = process.env.PINECONE_API_KEY?.trim();
    if (!apiKey || !this.indexName) {
      throw new Error("Pinecone não configurado (PINECONE_API_KEY / PINECONE_INDEX).");
    }
    if (!this.client) {
      this.client = new Pinecone({ apiKey });
    }
    return this.client;
  }

  async upsert(
    namespace: string,
    records: Array<{ id: string; values: number[]; metadata: VectorMetadata }>,
  ): Promise<void> {
    const index = this.getClient().index(this.indexName).namespace(namespace);
    await index.upsert({
      records: records.map((r) => ({
        id: r.id,
        values: r.values,
        metadata: r.metadata as Record<string, string | number | boolean>,
      })),
    });
  }

  async query(
    namespace: string,
    vector: number[],
    topK = 12,
    filter?: Record<string, unknown>,
  ): Promise<VectorQueryMatch[]> {
    const index = this.getClient().index(this.indexName).namespace(namespace);
    const response = await index.query({
      vector,
      topK,
      includeMetadata: true,
      filter,
    });
    return (response.matches ?? [])
      .filter((m) => m.metadata)
      .map((m) => ({
        id: m.id,
        score: m.score ?? 0,
        metadata: m.metadata as unknown as VectorMetadata,
      }));
  }

  async deleteNamespace(namespace: string): Promise<void> {
    const index = this.getClient().index(this.indexName).namespace(namespace);
    await index.deleteAll();
  }
}
