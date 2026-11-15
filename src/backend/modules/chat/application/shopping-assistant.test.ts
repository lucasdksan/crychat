import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateContentMock = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: (...args: unknown[]) => generateContentMock(...args),
    },
  })),
  Type: {
    OBJECT: "OBJECT",
    STRING: "STRING",
    ARRAY: "ARRAY",
    BOOLEAN: "BOOLEAN",
    INTEGER: "INTEGER",
    NUMBER: "NUMBER",
  },
}));

import { INITIAL_PRODUCTS, INITIAL_TENANTS } from "@/backend/modules/experience/application/catalog";
import {
  runAIShoppingTurn,
  runVisualSearch,
} from "@/backend/modules/chat/application/shopping-assistant";

describe("shopping-assistant", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it("lança erro quando GEMINI_API_KEY não está configurada", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(
      runAIShoppingTurn({
        tenantName: "Vértice",
        aiConfig: INITIAL_TENANTS[0].aiConfig,
        catalog: INITIAL_PRODUCTS,
        currentFilters: {
          query: "",
          category: "Todos",
          minRamGb: null,
          maxPrice: null,
          brand: "Todas",
          sortBy: "relevance",
        },
        history: [],
        userMessage: "Quero um notebook",
      }),
    ).rejects.toThrow("GEMINI_API_KEY");
  });

  it("filtra IDs inválidos, aplica limite de recomendações e converte 0 para null nos filtros", async () => {
    const validId1 = INITIAL_PRODUCTS[0].id;
    const validId2 = INITIAL_PRODUCTS[1].id;
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({
        reply: "Aqui estão os melhores notebooks.",
        recommendedProductIds: [validId1, "id-inexistente", validId2],
        compareProductIds: [validId1, "id-fantasma", validId2],
        filterUpdate: {
          shouldUpdate: true,
          category: "Notebooks",
          minRamGb: 0,
          maxPrice: 5000,
          sortBy: "price_asc",
        },
        suggestedFollowUps: ["Ver detalhes", "Comparar", "Outro", "Excesso"],
        escalatedToHuman: false,
      }),
    });

    const result = await runAIShoppingTurn({
      tenantName: "Vértice",
      aiConfig: { ...INITIAL_TENANTS[0].aiConfig, maxRecommendations: 2 },
      catalog: INITIAL_PRODUCTS,
      currentFilters: {
        query: "",
        category: "Todos",
        minRamGb: null,
        maxPrice: null,
        brand: "Todas",
        sortBy: "relevance",
      },
      history: [],
      userMessage: "Notebook até 5000",
    });

    expect(result.recommendedProductIds).toEqual([validId1, validId2]);
    expect(result.compareProductIds).toEqual([validId1, validId2]);
    expect(result.appliedFilters).toEqual({
      category: "Notebooks",
      minRamGb: null,
      maxPrice: 5000,
      sortBy: "price_asc",
    });
    expect(result.suggestedFollowUps).toHaveLength(3);
  });

  it("runVisualSearch valida categoria e filtra IDs fora do catálogo", async () => {
    const validId = INITIAL_PRODUCTS[0].id;
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({
        visualSummary: "Notebook prata ultrafino",
        detectedCategory: "CategoriaInvalida",
        matchedProductIds: [validId, "fake-id"],
        keywords: ["notebook", "prata"],
      }),
    });

    const res = await runVisualSearch({
      imageBase64: "dGVzdGUtYmFzZTY0LWltYWdl",
      mimeType: "image/jpeg",
      catalog: INITIAL_PRODUCTS,
    });

    expect(res.detectedCategory).toBe("Todos");
    expect(res.matchedProductIds).toEqual([validId]);
    expect(res.keywords).toEqual(["notebook", "prata"]);
  });
});