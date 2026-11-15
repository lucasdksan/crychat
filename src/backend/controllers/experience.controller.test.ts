import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const listStoresByOwnerMock = vi.fn();
const findStoreForOwnerMock = vi.fn();
const createStoreMock = vi.fn();
const setActiveStoreMock = vi.fn();
const getOrCreateAnalyticsMock = vi.fn();
const replaceAnalyticsMock = vi.fn();
const listExperienceProductsMock = vi.fn();
const getRuntimeTenantMock = vi.fn();
const updateRuntimeTenantMock = vi.fn();
const ensureRuntimeTenantForStoreMock = vi.fn();

vi.mock("@/backend/models/prisma", () => ({
  prisma: {},
}));

vi.mock("@/backend/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("@/backend/models/store.model", () => ({
  listStoresByOwner: (...args: unknown[]) => listStoresByOwnerMock(...args),
  findStoreForOwner: (...args: unknown[]) => findStoreForOwnerMock(...args),
  createStore: (...args: unknown[]) => createStoreMock(...args),
}));

vi.mock("@/backend/models/user.model", () => ({
  setActiveStore: (...args: unknown[]) => setActiveStoreMock(...args),
}));

vi.mock("@/backend/modules/experience/application/runtime-store", () => ({
  getOrCreateAnalytics: (...args: unknown[]) => getOrCreateAnalyticsMock(...args),
  replaceAnalytics: (...args: unknown[]) => replaceAnalyticsMock(...args),
  listExperienceProducts: (...args: unknown[]) => listExperienceProductsMock(...args),
  getRuntimeTenant: (...args: unknown[]) => getRuntimeTenantMock(...args),
  updateRuntimeTenant: (...args: unknown[]) => updateRuntimeTenantMock(...args),
  ensureRuntimeTenantForStore: (...args: unknown[]) =>
    ensureRuntimeTenantForStoreMock(...args),
  listRuntimeTenants: vi.fn(async (stores: Array<{ id: string }>) =>
    stores.map((s) => ({ id: s.id })),
  ),
}));

import {
  handleCreateDemoTenantPost,
  handleExperienceEventPost,
  handleFeedbackPost,
  handleTenantConfigPost,
  handleTenantsGet,
} from "@/backend/controllers/experience.controller";
import { INITIAL_ANALYTICS, INITIAL_TENANTS } from "@/backend/modules/experience/application/catalog";

describe("experience.controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 em handleTenantsGet sem sessão", async () => {
    authMock.mockResolvedValue(null);
    const res = await handleTenantsGet();
    expect(res.status).toBe(401);
  });

  it("retorna lista vazia quando usuário autenticado não tem lojas", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    listStoresByOwnerMock.mockResolvedValue([]);
    const res = await handleTenantsGet();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ tenants: [] });
  });

  it("cria loja demo e define activeStore em handleCreateDemoTenantPost", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    createStoreMock.mockResolvedValue({ id: "store_new", name: "Minha Demo" });
    ensureRuntimeTenantForStoreMock.mockResolvedValue({
      ...INITIAL_TENANTS[0],
      id: "store_new",
      name: "Minha Demo",
    });

    const res = await handleCreateDemoTenantPost(
      new Request("http://localhost/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Minha Demo" }),
      }),
    );

    expect(res.status).toBe(201);
    expect(setActiveStoreMock).toHaveBeenCalledWith("user_1", "store_new");
    const json = (await res.json()) as { tenant: { id: string } };
    expect(json.tenant.id).toBe("store_new");
  });

  it("retorna 404 em handleTenantConfigPost quando loja não pertence ao usuário", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    findStoreForOwnerMock.mockResolvedValue(null);

    const res = await handleTenantConfigPost(
      "store_other",
      new Request("http://localhost/api/tenants/store_other/config", {
        method: "POST",
        body: JSON.stringify({ defaultMode: "discover" }),
      }),
    );
    expect(res).toBeDefined();
    expect(res!.status).toBe(404);
  });

  it("retorna 400 em handleTenantConfigPost com payload inválido", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    findStoreForOwnerMock.mockResolvedValue({ id: "store_1" });
    getRuntimeTenantMock.mockResolvedValue(structuredClone(INITIAL_TENANTS[0]));

    const res = await handleTenantConfigPost(
      "store_1",
      new Request("http://localhost/api/tenants/store_1/config", {
        method: "POST",
        body: JSON.stringify({ defaultMode: "invalid-mode" }),
      }),
    );
    expect(res).toBeDefined();
    expect(res!.status).toBe(400);
  });

  it("incrementa contador de analytics em handleExperienceEventPost", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    findStoreForOwnerMock.mockResolvedValue({ id: "store_1" });
    const baseAnalytics = structuredClone(INITIAL_ANALYTICS["tenant-vertice"]);
    const prevViews = baseAnalytics.productViewsCount;
    getOrCreateAnalyticsMock.mockResolvedValue(baseAnalytics);

    const res = await handleExperienceEventPost(
      new Request("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify({ tenantId: "store_1", type: "product_view" }),
      }),
    );

    expect(res).toBeDefined();
    expect(res!.status).toBe(200);
    const json = (await res!.json()) as { analytics: { productViewsCount: number } };
    expect(json.analytics.productViewsCount).toBe(prevViews + 1);
    expect(replaceAnalyticsMock).toHaveBeenCalledTimes(1);
  });

  it("registra feedback e recalcula média e satisfação em handleFeedbackPost", async () => {
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    findStoreForOwnerMock.mockResolvedValue({ id: "store_1" });
    const baseAnalytics = structuredClone(INITIAL_ANALYTICS["tenant-vertice"]);
    baseAnalytics.totalFeedbackCount = 1;
    baseAnalytics.averageRating = 4;
    baseAnalytics.helpfulResponsesCount = 1;
    baseAnalytics.unhelpfulResponsesCount = 0;
    getOrCreateAnalyticsMock.mockResolvedValue(baseAnalytics);

    const res = await handleFeedbackPost(
      new Request("http://localhost/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          tenantId: "store_1",
          rating: 2,
          helpful: false,
          context: "chat",
          comment: "Faltou estoque",
        }),
      }),
    );

    expect(res).toBeDefined();
    expect(res!.status).toBe(200);
    const json = (await res!.json()) as {
      analytics: {
        totalFeedbackCount: number;
        averageRating: number;
        unhelpfulResponsesCount: number;
        satisfactionPercent: number;
      };
    };
    expect(json.analytics.totalFeedbackCount).toBe(2);
    expect(json.analytics.averageRating).toBe(3);
    expect(json.analytics.unhelpfulResponsesCount).toBe(1);
    expect(json.analytics.satisfactionPercent).toBe(50);
  });
});