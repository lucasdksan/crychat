import { z } from "zod";

import { auth } from "@/backend/auth";
import {
  getOrCreateAnalytics,
  getRuntimeTenant,
  listExperienceProducts,
  listRuntimeTenants,
  replaceAnalytics,
  updateRuntimeTenant,
  ensureRuntimeTenantForStore,
} from "@/backend/modules/experience/application/runtime-store";
import {
  runAIShoppingTurn,
  runVisualSearch,
} from "@/backend/modules/chat/application/shopping-assistant";
import { executeHybridSearch } from "@/backend/modules/search/application/catalog-filter-search";
import {
  createStore,
  findStoreForOwner,
  listStoresByOwner,
} from "@/backend/models/store.model";
import { setActiveStore } from "@/backend/models/user.model";
import { connectStoreIntegration } from "@/backend/modules/commerce/application/connect-store";
import type { SearchFilters } from "@/backend/modules/experience/domain/types";

async function requireOwnedStore(storeId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: Response.json({ error: "Não autenticado." }, { status: 401 }) };
  }
  const store = await findStoreForOwner(storeId, session.user.id);
  if (!store) {
    return { error: Response.json({ error: "Loja não encontrada." }, { status: 404 }) };
  }
  return { store, userId: session.user.id };
}

async function loadOwnedTenant(
  storeId: string,
  store: NonNullable<Awaited<ReturnType<typeof findStoreForOwner>>>,
) {
  return (
    (await getRuntimeTenant(storeId)) ?? (await ensureRuntimeTenantForStore(store))
  );
}

export async function handleTenantsGet() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const stores = await listStoresByOwner(session.user.id);
  if (stores.length === 0) {
    return Response.json({ tenants: [] });
  }

  return Response.json({ tenants: await listRuntimeTenants(stores) });
}

const createDemoTenantSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  domain: z.string().min(3).max(120).optional(),
});

export async function handleCreateDemoTenantPost(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => ({}));
  const parsed = createDemoTenantSchema.safeParse(rawBody ?? {});
  if (!parsed.success) {
    return Response.json({ error: "Dados da loja inválidos." }, { status: 400 });
  }

  const store = await createStore({
    ownerId: session.user.id,
    name: parsed.data.name?.trim() || "Minha loja",
    domain: parsed.data.domain?.trim() || undefined,
    platform: "vtex",
  });
  await setActiveStore(session.user.id, store.id);

  const tenant = await ensureRuntimeTenantForStore(store);
  return Response.json({ tenant }, { status: 201 });
}

export async function handleProductsGet(storeId: string) {
  const owned = await requireOwnedStore(storeId);
  if ("error" in owned) {
    return owned.error;
  }

  const products = await listExperienceProducts(storeId);
  return Response.json({ products });
}

const updateTenantConfigSchema = z.object({
  defaultMode: z.enum(["hybrid", "discover", "classic"]).optional(),
  aiConfig: z
    .object({
      provider: z
        .enum(["google-gemini", "openai", "anthropic", "groq", "mistral"])
        .optional(),
      quotaMode: z.enum(["crychat-managed", "customer-byok"]).optional(),
      model: z.string().optional(),
      tone: z.enum(["Consultivo", "Técnico", "Objetivo"]).optional(),
      temperature: z.number().min(0).max(1).optional(),
      maxRecommendations: z.number().min(1).max(4).optional(),
      monthlyTokenLimit: z.number().optional(),
      welcomeMessage: z.string().optional(),
      starterPrompts: z.array(z.string()).optional(),
    })
    .optional(),
  visualConfig: z
    .object({
      primaryColor: z.string().optional(),
      borderRadiusPx: z.number().min(0).max(16).optional(),
      cardDensity: z.enum(["detalhado", "compacto"]).optional(),
      widgetPosition: z.enum(["bottom-right", "bottom-left"]).optional(),
      installTarget: z
        .enum(["floating-widget", "search-bar", "hybrid-page", "custom-slot"])
        .optional(),
      customCss: z.string().optional(),
    })
    .optional(),
});

export async function handleTenantConfigPost(
  storeId: string,
  request: Request,
) {
  const owned = await requireOwnedStore(storeId);
  if ("error" in owned) {
    return owned.error;
  }

  const tenant = await loadOwnedTenant(storeId, owned.store);
  const json = await request.json().catch(() => null);
  const parsed = updateTenantConfigSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Configuração inválida.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.defaultMode) {
    tenant.defaultMode = parsed.data.defaultMode;
  }
  if (parsed.data.aiConfig) {
    tenant.aiConfig = { ...tenant.aiConfig, ...parsed.data.aiConfig };
  }
  if (parsed.data.visualConfig) {
    tenant.visualConfig = { ...tenant.visualConfig, ...parsed.data.visualConfig };
  }

  await updateRuntimeTenant(storeId, tenant);
  return Response.json({ tenant });
}

const updatePineconeSchema = z.object({
  mode: z.enum(["crychat-quota", "customer-token"]),
  indexName: z.string().optional(),
  accessToken: z.string().optional(),
});

export async function handleTenantPineconePost(
  storeId: string,
  request: Request,
) {
  const owned = await requireOwnedStore(storeId);
  if ("error" in owned) {
    return owned.error;
  }

  const tenant = await loadOwnedTenant(storeId, owned.store);
  const parsed = updatePineconeSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: "Dados do Pinecone inválidos." }, { status: 400 });
  }

  const products = await listExperienceProducts(storeId);
  const now = new Date().toISOString();

  let tokenMasked = "Gerenciado pela cota CryChat";
  let finalIndexName = "crychat-catalog-prod";

  if (parsed.data.mode === "customer-token") {
    const idx = parsed.data.indexName?.trim();
    if (!idx || idx.length < 2) {
      return Response.json(
        { error: "Informe o nome do Index do Pinecone." },
        { status: 400 },
      );
    }
    finalIndexName = idx;
    const raw = parsed.data.accessToken?.trim();
    if (raw) {
      tokenMasked =
        raw.length > 8 ? `${raw.slice(0, 6)}••••${raw.slice(-4)}` : "pcsk_••••config";
    } else if (
      tenant.pineconeConfig.mode === "customer-token" &&
      tenant.pineconeConfig.tokenMasked &&
      !tenant.pineconeConfig.tokenMasked.includes("Gerenciado")
    ) {
      tokenMasked = tenant.pineconeConfig.tokenMasked;
    } else {
      return Response.json(
        { error: "Informe o token de acesso do Pinecone." },
        { status: 400 },
      );
    }
  }

  tenant.pineconeConfig = {
    mode: parsed.data.mode,
    indexName: finalIndexName,
    region: "auto",
    namespace: storeId,
    tokenMasked,
    dimensions: 1536,
    vectorsCount: products.length,
    lastIndexedAt: now,
  };

  await updateRuntimeTenant(storeId, tenant);
  return Response.json({ tenant, indexedCount: products.length });
}

const syncIntegrationSchema = z.object({
  publicDomain: z.string().optional(),
  storeDomain: z.string().optional(),
  webhookActive: z.boolean().optional(),
  fields: z.record(z.string(), z.string()).optional(),
});

export async function handleIntegrationSyncPost(
  storeId: string,
  provider: string,
  request: Request,
) {
  const owned = await requireOwnedStore(storeId);
  if ("error" in owned) {
    return owned.error;
  }

  const tenant = await loadOwnedTenant(storeId, owned.store);
  const integration = tenant.integrations.find((i) => i.provider === provider);
  if (!integration) {
    return Response.json({ error: "Provedor não encontrado." }, { status: 404 });
  }

  const parsed = syncIntegrationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: "Dados da integração inválidos." }, { status: 400 });
  }

  let connected: Awaited<ReturnType<typeof connectStoreIntegration>>;
  try {
    connected = await connectStoreIntegration({
      storeId,
      provider,
      fields: parsed.data.fields ?? {},
      existingEncrypted: owned.store.credential?.encryptedPayload,
      publicDomain: parsed.data.publicDomain?.trim() || parsed.data.storeDomain?.trim(),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao sincronizar o catálogo.",
      },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  for (const item of tenant.integrations) {
    if (item.provider !== provider) {
      item.connected = false;
      continue;
    }
    item.connected = true;
    item.storeDomain = connected.storeDomain;
    item.appKeyMasked = connected.masked;
    item.webhookActive = parsed.data.webhookActive ?? item.webhookActive;
    item.lastSyncAt = now;
    item.indexedVectors = connected.imported;
    item.syncStatus = "ok";
  }
  tenant.domain =
    parsed.data.publicDomain?.trim() ||
    parsed.data.storeDomain?.trim() ||
    tenant.domain;
  tenant.pineconeConfig.vectorsCount = connected.imported;
  tenant.pineconeConfig.lastIndexedAt = now;

  await updateRuntimeTenant(storeId, tenant);
  return Response.json({
    tenant,
    syncedCount: connected.imported,
    syncedAt: now,
  });
}

const searchSchema = z.object({
  tenantId: z.string(),
  filters: z.object({
    query: z.string(),
    category: z.enum(["Todos", "Notebooks", "Smartphones", "Áudio", "Monitores"]),
    minRamGb: z.number().nullable(),
    maxPrice: z.number().nullable(),
    brand: z.string(),
    sortBy: z.enum(["relevance", "price_asc", "price_desc", "rating"]),
  }),
  inferIntentFromQuery: z.boolean().optional(),
});

export async function handleSearchPost(request: Request) {
  const parsed = searchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Parâmetros de busca inválidos." }, { status: 400 });
  }

  const owned = await requireOwnedStore(parsed.data.tenantId);
  if ("error" in owned) {
    return owned.error;
  }

  const catalog = await listExperienceProducts(parsed.data.tenantId);
  const result = executeHybridSearch(
    catalog,
    parsed.data.filters as SearchFilters,
    { inferIntentFromQuery: parsed.data.inferIntentFromQuery },
  );

  const analytics = await getOrCreateAnalytics(parsed.data.tenantId);
  if (parsed.data.filters.query.trim().length > 1) {
    analytics.searchesCount += 1;
    if (result.products.length === 0) {
      const existing = analytics.zeroResultQueries.find(
        (z) =>
          z.query.toLowerCase() === parsed.data.filters.query.trim().toLowerCase(),
      );
      if (existing) {
        existing.count += 1;
        existing.lastSeenAt = new Date().toISOString();
      } else {
        analytics.zeroResultQueries.unshift({
          query: parsed.data.filters.query.trim(),
          count: 1,
          lastSeenAt: new Date().toISOString(),
        });
      }
    }
    await replaceAnalytics(parsed.data.tenantId, analytics);
  }

  return Response.json(result);
}

const experienceChatSchema = z.object({
  tenantId: z.string(),
  message: z.string().min(1),
  currentFilters: z.object({
    query: z.string(),
    category: z.enum(["Todos", "Notebooks", "Smartphones", "Áudio", "Monitores"]),
    minRamGb: z.number().nullable(),
    maxPrice: z.number().nullable(),
    brand: z.string(),
    sortBy: z.enum(["relevance", "price_asc", "price_desc", "rating"]),
  }),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .default([]),
});

export async function handleExperienceChatPost(request: Request) {
  const parsed = experienceChatSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: "Mensagem inválida." }, { status: 400 });
  }

  const owned = await requireOwnedStore(parsed.data.tenantId);
  if ("error" in owned) {
    return owned.error;
  }

  const tenant = await loadOwnedTenant(parsed.data.tenantId, owned.store);
  const catalog = await listExperienceProducts(parsed.data.tenantId);

  try {
    const turn = await runAIShoppingTurn({
      tenantName: tenant.name,
      aiConfig: tenant.aiConfig,
      catalog,
      currentFilters: parsed.data.currentFilters as SearchFilters,
      history: parsed.data.history,
      userMessage: parsed.data.message,
    });

    tenant.aiConfig.tokensUsed += turn.tokensEstimated;
    await updateRuntimeTenant(parsed.data.tenantId, tenant);

    const analytics = await getOrCreateAnalytics(parsed.data.tenantId);
    analytics.conversationsCount += parsed.data.history.length === 0 ? 1 : 0;
    if (turn.compareProductIds.length >= 2) {
      analytics.comparisonsCount += 1;
    }
    await replaceAnalytics(parsed.data.tenantId, analytics);

    return Response.json(turn);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Erro ao consultar modelo de IA.";
    return Response.json({ error: errorMessage }, { status: 502 });
  }
}

const visualSearchSchema = z.object({
  tenantId: z.string(),
  imageBase64: z.string().min(10),
  mimeType: z.string().min(5),
});

export async function handleVisualSearchPost(request: Request) {
  const parsed = visualSearchSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: "Imagem inválida para busca visual." }, { status: 400 });
  }

  const owned = await requireOwnedStore(parsed.data.tenantId);
  if ("error" in owned) {
    return owned.error;
  }

  const catalog = await listExperienceProducts(parsed.data.tenantId);

  try {
    const result = await runVisualSearch({
      imageBase64: parsed.data.imageBase64,
      mimeType: parsed.data.mimeType,
      catalog,
    });

    const analytics = await getOrCreateAnalytics(parsed.data.tenantId);
    analytics.searchesCount += 1;
    await replaceAnalytics(parsed.data.tenantId, analytics);

    return Response.json(result);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Falha ao processar imagem na busca visual.";
    return Response.json({ error: errorMessage }, { status: 502 });
  }
}

export async function handleAnalyticsGet(storeId: string) {
  const owned = await requireOwnedStore(storeId);
  if ("error" in owned) {
    return owned.error;
  }

  return Response.json({ analytics: await getOrCreateAnalytics(storeId) });
}

const eventSchema = z.object({
  tenantId: z.string(),
  type: z.enum([
    "product_view",
    "recommendation_click",
    "comparison",
    "conversation_start",
  ]),
});

export async function handleExperienceEventPost(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Evento inválido." }, { status: 400 });
  }

  const owned = await requireOwnedStore(parsed.data.tenantId);
  if ("error" in owned) {
    return owned.error;
  }

  const analytics = await getOrCreateAnalytics(parsed.data.tenantId);
  switch (parsed.data.type) {
    case "product_view":
      analytics.productViewsCount += 1;
      break;
    case "recommendation_click":
      analytics.recommendationClicksCount += 1;
      break;
    case "comparison":
      analytics.comparisonsCount += 1;
      break;
    case "conversation_start":
      analytics.conversationsCount += 1;
      break;
  }
  await replaceAnalytics(parsed.data.tenantId, analytics);
  return Response.json({ analytics });
}

const feedbackSchema = z.object({
  tenantId: z.string(),
  rating: z.number().min(1).max(5),
  helpful: z.boolean(),
  context: z.enum(["chat", "busca", "comparacao"]).default("chat"),
  reason: z.string().max(120).optional(),
  comment: z.string().max(500).optional(),
});

export async function handleFeedbackPost(request: Request) {
  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Avaliação inválida." }, { status: 400 });
  }

  const owned = await requireOwnedStore(parsed.data.tenantId);
  if ("error" in owned) {
    return owned.error;
  }

  const analytics = await getOrCreateAnalytics(parsed.data.tenantId);
  const prevTotal = analytics.totalFeedbackCount;
  const nextTotal = prevTotal + 1;
  analytics.averageRating = Number(
    ((analytics.averageRating * prevTotal + parsed.data.rating) / nextTotal).toFixed(2),
  );
  analytics.totalFeedbackCount = nextTotal;

  if (parsed.data.helpful || parsed.data.rating >= 4) {
    analytics.helpfulResponsesCount += 1;
    if (analytics.dailySeries.length > 0) {
      analytics.dailySeries[analytics.dailySeries.length - 1].positiveRatings += 1;
    }
  } else {
    analytics.unhelpfulResponsesCount += 1;
    if (analytics.dailySeries.length > 0) {
      analytics.dailySeries[analytics.dailySeries.length - 1].negativeRatings += 1;
    }
  }

  analytics.satisfactionPercent = Number(
    ((analytics.helpfulResponsesCount / nextTotal) * 100).toFixed(1),
  );

  analytics.recentFeedbacks.unshift({
    id: `fb-${Date.now()}`,
    rating: parsed.data.rating,
    helpful: parsed.data.helpful,
    context: parsed.data.context,
    reason: parsed.data.reason?.trim() || undefined,
    comment: parsed.data.comment?.trim() || undefined,
    createdAt: new Date().toISOString(),
  });
  analytics.recentFeedbacks = analytics.recentFeedbacks.slice(0, 12);
  await replaceAnalytics(parsed.data.tenantId, analytics);

  return Response.json({ analytics });
}