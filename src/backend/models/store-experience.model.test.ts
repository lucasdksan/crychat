import { describe, expect, it, vi } from "vitest";

vi.mock("@/backend/models/prisma", () => ({
  prisma: {},
}));

import { INITIAL_ANALYTICS, INITIAL_TENANTS } from "@/backend/modules/experience/application/catalog";
import {
  getStoreExperienceFields,
  parseExperienceAnalytics,
  parseExperienceSettings,
  tenantToExperienceSettings,
} from "@/backend/models/store-experience.model";

describe("store-experience.model helpers", () => {
  it("parseExperienceSettings retorna null para valores não-objeto", () => {
    expect(parseExperienceSettings(null)).toBeNull();
    expect(parseExperienceSettings(["a"])).toBeNull();
    expect(parseExperienceSettings("str")).toBeNull();
  });

  it("parseExperienceAnalytics valida existência de tenantId", () => {
    expect(parseExperienceAnalytics(null)).toBeNull();
    expect(parseExperienceAnalytics({ searchesCount: 10 })).toBeNull();

    const sample = INITIAL_ANALYTICS["tenant-vertice"];
    expect(parseExperienceAnalytics(sample as unknown as never)).toEqual(sample);
  });

  it("tenantToExperienceSettings extrai apenas os campos persistíveis", () => {
    const template = INITIAL_TENANTS[0];
    const extracted = tenantToExperienceSettings(template);
    expect(extracted).toEqual({
      defaultMode: template.defaultMode,
      aiConfig: template.aiConfig,
      visualConfig: template.visualConfig,
      pineconeConfig: template.pineconeConfig,
      integrations: template.integrations,
    });
  });

  it("getStoreExperienceFields faz parse combinado de settings e analytics", () => {
    const sample = INITIAL_ANALYTICS["tenant-vertice"];
    const result = getStoreExperienceFields({
      experienceSettings: { defaultMode: "discover" },
      experienceAnalytics: sample as unknown as never,
    });
    expect(result.settings).toEqual({ defaultMode: "discover" });
    expect(result.analytics?.tenantId).toBe(sample.tenantId);
  });
});