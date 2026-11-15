import type { CatalogProduct } from "@/generated/prisma/client";
import type { Product, ProductCategory } from "@/backend/modules/experience/domain/types";

const CATEGORY_VALUES: ProductCategory[] = [
  "Notebooks",
  "Smartphones",
  "Áudio",
  "Monitores",
];

function normalizeCategory(raw?: string | null): ProductCategory {
  if (!raw) {
    return "Notebooks";
  }
  const found = CATEGORY_VALUES.find(
    (c) => c.toLowerCase() === raw.toLowerCase(),
  );
  return found ?? "Notebooks";
}

function pickImageKey(name: string): string {
  const lower = name.toLowerCase();
  if (/fone|headphone|áudio|audio/.test(lower)) {
    return "headphones_studio_anc";
  }
  if (/monitor|tela|display/.test(lower)) {
    return "monitor_desk_4k";
  }
  if (/celular|smartphone|iphone/.test(lower)) {
    return "smartphone_camera_pro";
  }
  if (/ultrabook|silver/.test(lower)) {
    return "laptop_ultrabook_silver";
  }
  return "laptop_dev_pro";
}

export function mapCatalogProductToExperienceProduct(
  row: CatalogProduct,
): Product {
  const price = row.price ? Number(row.price) : 0;
  const listPrice = row.listPrice ? Number(row.listPrice) : undefined;
  return {
    id: row.id,
    tenantId: row.storeId,
    sku: row.sku ?? row.externalId,
    name: row.name,
    brand: row.brand ?? "Marca",
    category: normalizeCategory(row.category),
    price,
    originalPrice: listPrice && listPrice > price ? listPrice : undefined,
    stock: row.available ? 1 : 0,
    rating: 0,
    reviewCount: 0,
    imageUrl: row.imageUrl ?? undefined,
    imageKey: pickImageKey(row.name),
    shortDescription:
      row.description?.slice(0, 160) ??
      "Produto do catálogo sincronizado da sua loja.",
    highlights: [],
    specs: {},
    semanticKeywords: [
      row.name,
      row.brand ?? "",
      row.category ?? "",
    ].filter(Boolean),
    promotionLabel:
      listPrice && listPrice > price ? "Oferta" : undefined,
    vectorIndexedAt: row.updatedAt.toISOString(),
  };
}