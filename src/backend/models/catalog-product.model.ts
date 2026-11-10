import { prisma } from "@/backend/models/prisma";

export type CanonicalProductInput = {
  externalId: string;
  sku?: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  price?: number;
  listPrice?: number;
  available?: boolean;
  url?: string;
  imageUrl?: string;
  embeddingId?: string;
};

export function upsertCatalogProduct(
  storeId: string,
  product: CanonicalProductInput,
) {
  return prisma.catalogProduct.upsert({
    where: {
      storeId_externalId: { storeId, externalId: product.externalId },
    },
    create: {
      storeId,
      ...product,
    },
    update: {
      ...product,
    },
  });
}

export function searchCatalogLexical(
  storeId: string,
  query: string,
  limit = 12,
) {
  return prisma.catalogProduct.findMany({
    where: {
      storeId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
}

export function findCatalogProductsByIds(storeId: string, ids: string[]) {
  return prisma.catalogProduct.findMany({
    where: { storeId, id: { in: ids } },
  });
}

export function findCatalogProductByExternalId(
  storeId: string,
  externalId: string,
) {
  return prisma.catalogProduct.findUnique({
    where: { storeId_externalId: { storeId, externalId } },
  });
}
