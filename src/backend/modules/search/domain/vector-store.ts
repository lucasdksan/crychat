export type VectorMetadata = {
  storeId: string;
  externalId: string;
  name: string;
  sku?: string;
  category?: string;
  price?: number;
  available?: boolean;
};

export type VectorQueryMatch = {
  id: string;
  score: number;
  metadata: VectorMetadata;
};

export interface VectorStore {
  upsert(
    namespace: string,
    records: Array<{ id: string; values: number[]; metadata: VectorMetadata }>,
  ): Promise<void>;
  query(
    namespace: string,
    vector: number[],
    topK?: number,
    filter?: Record<string, unknown>,
  ): Promise<VectorQueryMatch[]>;
  deleteNamespace(namespace: string): Promise<void>;
}
