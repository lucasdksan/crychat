import { describe, expect, it, vi } from "vitest";

vi.mock("@/backend/models/prisma", () => ({
  prisma: {},
}));

import {
  buildTenantFromStore,
  isLegacyDemoStore,
  listRuntimeTenants,
} from "@/backend/modules/experience/application/runtime-store";

describe("buildTenantFromStore", () => {
  it("constrói Tenant com slug, namespace e integração conectada quando há credencial", () => {
    const tenant = buildTenantFromStore({
      id: "store_123",
      ownerId: "user_1",
      name: "Loja Áudio & Tech",
      domain: "audiotech.com.br",
      platform: "vtex",
      experienceSettings: {
        defaultMode: "discover",
        aiConfig: { tone: "Técnico" },
      },
      experienceAnalytics: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      credential: { id: "cred_1" },
    } as never);

    expect(tenant.id).toBe("store_123");
    expect(tenant.slug).toBe("loja-audio-tech");
    expect(tenant.domain).toBe("audiotech.com.br");
    expect(tenant.defaultMode).toBe("discover");
    expect(tenant.aiConfig.tone).toBe("Técnico");
    expect(tenant.aiConfig.welcomeMessage).not.toContain("Vértice");
    expect(tenant.pineconeConfig.namespace).toBe("store_123");

    const vtex = tenant.integrations.find((i) => i.provider === "vtex");
    expect(vtex?.connected).toBe(true);
    expect(vtex?.storeDomain).toBe("audiotech.com.br");
  });

  it("marca integração como desconectada quando não há credencial", () => {
    const tenant = buildTenantFromStore({
      id: "store_demo",
      ownerId: "user_1",
      name: "Demo Store",
      domain: null,
      platform: "vtex",
      experienceSettings: null,
      experienceAnalytics: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      credential: null,
    } as never);

    expect(tenant.domain).toBe("demo-store.com.br");
    const vtex = tenant.integrations.find((i) => i.provider === "vtex");
    expect(vtex?.connected).toBe(false);
  });

  it("não lista a loja de demonstração Vértice", async () => {
    expect(
      isLegacyDemoStore({
        name: "Vértice Tech Demo",
        domain: "verticetech.com.br",
      }),
    ).toBe(true);

    const tenants = await listRuntimeTenants([
      {
        id: "store_demo",
        name: "Vértice Tech Demo",
        domain: "verticetech.com.br",
        platform: "vtex",
        experienceSettings: null,
        experienceAnalytics: null,
      } as never,
      {
        id: "store_real",
        name: "Loja Áudio & Tech",
        domain: "audiotech.com.br",
        platform: "vtex",
        experienceSettings: null,
        experienceAnalytics: null,
      } as never,
    ]);

    expect(tenants.map((tenant) => tenant.id)).toEqual(["store_real"]);
  });
});