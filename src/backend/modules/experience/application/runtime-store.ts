import type { Store } from "@/generated/prisma/client";
import { mapCatalogProductToExperienceProduct } from "@/backend/modules/experience/application/map-catalog-product";
import { listCatalogProductsByStore } from "@/backend/models/catalog-product.model";
import {
  findStoreExperienceAnalyticsJson,
  findStoreWithCredentialForExperience,
  getStoreExperienceFields,
  saveExperienceAnalytics,
  saveExperienceSettings,
  tenantToExperienceSettings,
  type StoreExperienceSettings,
} from "@/backend/models/store-experience.model";
import type {
  AnalyticsSummary,
  IntegrationConfig,
  Product,
  Tenant,
} from "@/backend/modules/experience/domain/types";
import { INTEGRATION_PROVIDERS } from "@/backend/modules/commerce/domain/integration-providers";

const SEEDED_FEEDBACK_IDS = new Set(["fb-1", "fb-2", "fb-3", "fb-k1"]);
const DEMO_STORE_DOMAINS = new Set([
  "verticetech.vtexcommercestable.com.br",
  "kroma-studio-br.myshopify.com",
]);

export function isLegacyDemoStore(store: {
  name: string;
  domain?: string | null;
}) {
  const name = store.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const domain = (store.domain ?? "").toLowerCase();
  return (
    name.includes("vertice") ||
    name.includes("kroma") ||
    domain.includes("verticetech") ||
    domain.includes("kroma") ||
    DEMO_STORE_DOMAINS.has(domain)
  );
}

function emptyIntegrations(): IntegrationConfig[] {
  return INTEGRATION_PROVIDERS.map((provider) => ({
    provider: provider.id,
    label: provider.label,
    connected: false,
    storeDomain: "",
    appKeyMasked: "",
    webhookActive: false,
    lastSyncAt: null,
    indexedVectors: 0,
    syncStatus: "pending" as const,
  }));
}

function blankTenant(): Tenant {
  return {
    id: "",
    name: "",
    slug: "",
    domain: "",
    defaultMode: "hybrid",
    integrations: emptyIntegrations(),
    pineconeConfig: {
      mode: "crychat-quota",
      indexName: "crychat-catalog",
      region: "auto",
      namespace: "",
      tokenMasked: "Gerenciado pela cota CryChat",
      dimensions: 1536,
      vectorsCount: 0,
      lastIndexedAt: null,
    },
    aiConfig: {
      provider: "google-gemini",
      quotaMode: "crychat-managed",
      model: "gemini-2.5-flash",
      tone: "Consultivo",
      temperature: 0.3,
      maxRecommendations: 3,
      monthlyTokenLimit: 0,
      tokensUsed: 0,
      welcomeMessage:
        "Olá! Posso ajudar a encontrar produtos desta loja. Diga o que você procura.",
      starterPrompts: [],
    },
    visualConfig: {
      primaryColor: "#8234e9",
      borderRadiusPx: 5,
      cardDensity: "detalhado",
      widgetPosition: "bottom-right",
      installTarget: "hybrid-page",
      customCss: "",
    },
  };
}

export function emptyAnalytics(storeId: string): AnalyticsSummary {
  return {
    tenantId: storeId,
    searchesCount: 0,
    conversationsCount: 0,
    productViewsCount: 0,
    recommendationClicksCount: 0,
    comparisonsCount: 0,
    satisfactionPercent: 0,
    averageRating: 0,
    totalFeedbackCount: 0,
    helpfulResponsesCount: 0,
    unhelpfulResponsesCount: 0,
    recentFeedbacks: [],
    zeroResultQueries: [],
    topIntents: [],
    dailySeries: [],
  };
}

function isSeededAnalytics(analytics: AnalyticsSummary) {
  return analytics.recentFeedbacks.some((item) =>
    SEEDED_FEEDBACK_IDS.has(item.id),
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type StoreWithCredential = Store & {
  credential?: { id: string } | null;
};

function mergeSettings(
  template: Tenant,
  stored: Partial<StoreExperienceSettings> | null,
  store: StoreWithCredential,
): Tenant {
  const baseIntegrations = template.integrations.map((integration) =>
    integration.provider === store.platform
      ? {
          ...integration,
          connected: Boolean(store.credential),
          storeDomain: store.domain ?? "",
        }
      : { ...integration, connected: false },
  );

  const integrations = stored?.integrations?.length
    ? stored.integrations.map((saved) => {
        const fallback = baseIntegrations.find(
          (item) => item.provider === saved.provider,
        );
        const merged = fallback ? { ...fallback, ...saved } : saved;
        const demoDomain =
          DEMO_STORE_DOMAINS.has(merged.storeDomain) ||
          merged.appKeyMasked.includes("vtexappkey-vertice") ||
          merged.appKeyMasked.includes("shpat_kroma");
        if (demoDomain && !(store.credential && merged.provider === store.platform)) {
          return {
            ...(fallback ?? merged),
            connected: false,
            storeDomain: store.domain ?? "",
            appKeyMasked: "",
            lastSyncAt: null,
            indexedVectors: 0,
            syncStatus: "pending" as const,
          };
        }
        return merged;
      })
    : baseIntegrations;

  return {
    ...template,
    id: store.id,
    name: store.name,
    slug: slugify(store.name),
    domain: store.domain ?? `${slugify(store.name)}.com.br`,
    defaultMode: stored?.defaultMode ?? template.defaultMode,
    aiConfig: stored?.aiConfig
      ? {
          ...template.aiConfig,
          ...stored.aiConfig,
          ...(stored.aiConfig.welcomeMessage?.includes("Vértice")
            ? {
                welcomeMessage: template.aiConfig.welcomeMessage,
                starterPrompts: template.aiConfig.starterPrompts,
              }
            : {}),
          tokensUsed:
            stored.aiConfig.tokensUsed === 642800 ||
            stored.aiConfig.tokensUsed === 218400
              ? 0
              : (stored.aiConfig.tokensUsed ?? template.aiConfig.tokensUsed),
        }
      : template.aiConfig,
    visualConfig: stored?.visualConfig
      ? { ...template.visualConfig, ...stored.visualConfig }
      : template.visualConfig,
    pineconeConfig: {
      ...(stored?.pineconeConfig ?? template.pineconeConfig),
      namespace: store.id,
    },
    integrations,
  };
}

export function buildTenantFromStore(store: StoreWithCredential): Tenant {
  const { settings } = getStoreExperienceFields(store);
  return mergeSettings(blankTenant(), settings, store);
}

export async function ensureRuntimeTenantForStore(
  store: StoreWithCredential,
): Promise<Tenant> {
  return buildTenantFromStore(store);
}

export async function listRuntimeTenants(
  stores: StoreWithCredential[],
): Promise<Tenant[]> {
  const realStores = stores.filter((store) => !isLegacyDemoStore(store));
  return Promise.all(realStores.map((store) => ensureRuntimeTenantForStore(store)));
}

export async function getRuntimeTenant(storeId: string): Promise<Tenant | null> {
  const store = await findStoreWithCredentialForExperience(storeId);
  if (!store) {
    return null;
  }
  return buildTenantFromStore(store);
}

export async function updateRuntimeTenant(storeId: string, tenant: Tenant) {
  await saveExperienceSettings(storeId, tenantToExperienceSettings(tenant));
}

export async function getOrCreateAnalytics(storeId: string): Promise<AnalyticsSummary> {
  const store = await findStoreExperienceAnalyticsJson(storeId);
  const { analytics } = getStoreExperienceFields({
    experienceSettings: null,
    experienceAnalytics: store?.experienceAnalytics ?? null,
  });
  if (analytics && !isSeededAnalytics(analytics)) {
    return { ...analytics, tenantId: storeId };
  }

  const fresh = emptyAnalytics(storeId);
  await saveExperienceAnalytics(storeId, fresh);
  return fresh;
}

export async function replaceAnalytics(
  storeId: string,
  analytics: AnalyticsSummary,
) {
  const payload = { ...analytics, tenantId: storeId };
  await saveExperienceAnalytics(storeId, payload);
}

export async function listExperienceProducts(storeId: string): Promise<Product[]> {
  const rows = await listCatalogProductsByStore(storeId, 120);

  return rows.map(mapCatalogProductToExperienceProduct);
}