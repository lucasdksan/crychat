import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/backend/models/prisma";
import type {
  AIConfig,
  AnalyticsSummary,
  ExperienceMode,
  IntegrationConfig,
  PineconeConfig,
  VisualCustomization,
} from "@/backend/modules/experience/domain/types";

export type StoreExperienceSettings = {
  defaultMode: ExperienceMode;
  aiConfig: AIConfig;
  visualConfig: VisualCustomization;
  pineconeConfig: PineconeConfig;
  integrations: IntegrationConfig[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseExperienceSettings(
  json: Prisma.JsonValue | null | undefined,
): Partial<StoreExperienceSettings> | null {
  if (!json || !isRecord(json)) {
    return null;
  }
  return json as Partial<StoreExperienceSettings>;
}

export function parseExperienceAnalytics(
  json: Prisma.JsonValue | null | undefined,
): AnalyticsSummary | null {
  if (!json || !isRecord(json)) {
    return null;
  }
  const tenantId = json.tenantId;
  if (typeof tenantId !== "string") {
    return null;
  }
  return json as unknown as AnalyticsSummary;
}

export function tenantToExperienceSettings(tenant: {
  defaultMode: ExperienceMode;
  aiConfig: AIConfig;
  visualConfig: VisualCustomization;
  pineconeConfig: PineconeConfig;
  integrations: IntegrationConfig[];
}): StoreExperienceSettings {
  return {
    defaultMode: tenant.defaultMode,
    aiConfig: tenant.aiConfig,
    visualConfig: tenant.visualConfig,
    pineconeConfig: tenant.pineconeConfig,
    integrations: tenant.integrations,
  };
}

export async function saveExperienceSettings(
  storeId: string,
  settings: StoreExperienceSettings,
) {
  return prisma.store.update({
    where: { id: storeId },
    data: {
      experienceSettings: settings as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function saveExperienceAnalytics(
  storeId: string,
  analytics: AnalyticsSummary,
) {
  return prisma.store.update({
    where: { id: storeId },
    data: {
      experienceAnalytics: analytics as unknown as Prisma.InputJsonValue,
    },
  });
}

export function getStoreExperienceFields(store: {
  experienceSettings: Prisma.JsonValue | null;
  experienceAnalytics: Prisma.JsonValue | null;
}) {
  return {
    settings: parseExperienceSettings(store.experienceSettings),
    analytics: parseExperienceAnalytics(store.experienceAnalytics),
  };
}

export function findStoreWithCredentialForExperience(storeId: string) {
  return prisma.store.findUnique({
    where: { id: storeId },
    include: { credential: true },
  });
}

export function findStoreExperienceAnalyticsJson(storeId: string) {
  return prisma.store.findUnique({
    where: { id: storeId },
    select: { experienceAnalytics: true },
  });
}