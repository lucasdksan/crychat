import { describe, expect, it } from "vitest";

import type { Product } from "@/experience/commerce-types";
import {
  executeHybridSearch,
  extractQueryIntent,
} from "@/backend/modules/search/application/catalog-filter-search";

const sampleCatalog: Product[] = [
  {
    id: "p1",
    tenantId: "t1",
    sku: "NB-1",
    name: "Notebook Dev 16GB",
    brand: "Acer",
    category: "Notebooks",
    price: 4500,
    stock: 3,
    rating: 4.5,
    reviewCount: 12,
    imageKey: "laptop_dev",
    specs: { ramGb: 16, storage: "512GB SSD" },
    shortDescription: "Ultrabook",
    highlights: ["16 GB RAM"],
    semanticKeywords: ["notebook", "dev"],
    vectorIndexedAt: new Date().toISOString(),
  },
  {
    id: "p2",
    tenantId: "t1",
    sku: "HP-1",
    name: "Fone ANC Studio",
    brand: "Sony",
    category: "Áudio",
    price: 899,
    stock: 10,
    rating: 4.8,
    reviewCount: 40,
    imageKey: "headphones",
    specs: {},
    shortDescription: "Headphone",
    highlights: ["ANC"],
    semanticKeywords: ["fone"],
    vectorIndexedAt: new Date().toISOString(),
  },
];

describe("extractQueryIntent", () => {
  it("detecta categoria notebook e RAM mínima", () => {
    const intent = extractQueryIntent(
      "notebook para programação com 16 GB de RAM até R$ 5.000",
    );
    expect(intent.detectedCategory).toBe("Notebooks");
    expect(intent.detectedMinRamGb).toBe(16);
    expect(intent.detectedMaxPrice).toBe(5000);
  });
});

describe("executeHybridSearch", () => {
  it("filtra por categoria e ordena por preço", () => {
    const result = executeHybridSearch(
      sampleCatalog,
      {
        query: "",
        category: "Notebooks",
        minRamGb: 16,
        maxPrice: null,
        brand: "Todas",
        sortBy: "price_asc",
      },
      { inferIntentFromQuery: false },
    );
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.id).toBe("p1");
  });
});