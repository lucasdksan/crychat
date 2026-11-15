import type { CommercePlatform } from "@/generated/prisma/client";
import { integrationProviderSpec } from "@/backend/modules/commerce/domain/integration-providers";

export type VtexCredentialPayload = {
  platform: "vtex";
  accountName: string;
  environment: string;
  appKey: string;
  appToken: string;
};

export type ShopifyCredentialPayload = {
  platform: "shopify";
  shopDomain: string;
  accessToken: string;
};

export type WooCommerceCredentialPayload = {
  platform: "woocommerce";
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
};

export type NuvemshopCredentialPayload = {
  platform: "nuvemshop";
  storeId: string;
  accessToken: string;
};

export type CustomCredentialPayload = {
  platform: "custom";
  baseUrl: string;
  accessToken: string;
};

export type CommerceCredentialPayload =
  | VtexCredentialPayload
  | ShopifyCredentialPayload
  | WooCommerceCredentialPayload
  | NuvemshopCredentialPayload
  | CustomCredentialPayload;

const PLATFORMS = new Set<CommercePlatform>([
  "vtex",
  "shopify",
  "woocommerce",
  "nuvemshop",
  "custom",
]);

export function isCommercePlatform(value: string): value is CommercePlatform {
  return PLATFORMS.has(value as CommercePlatform);
}

export function normalizeStoredCredential(
  raw: unknown,
): CommerceCredentialPayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const record = raw as Record<string, unknown>;
  if (typeof record.platform === "string" && isCommercePlatform(record.platform)) {
    return record as CommerceCredentialPayload;
  }
  if (
    typeof record.accountName === "string" &&
    typeof record.appKey === "string" &&
    typeof record.appToken === "string"
  ) {
    return {
      platform: "vtex",
      accountName: record.accountName,
      environment:
        typeof record.environment === "string" && record.environment
          ? record.environment
          : "vtexcommercestable",
      appKey: record.appKey,
      appToken: record.appToken,
    };
  }
  return null;
}

export function maskSecret(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= 8) {
    return "••••";
  }
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

export function describeSavedCredentials(payload: CommerceCredentialPayload) {
  switch (payload.platform) {
    case "vtex":
      return `App Key ${maskSecret(payload.appKey)} · App Token ${maskSecret(payload.appToken)}`;
    case "shopify":
      return `Admin token ${maskSecret(payload.accessToken)}`;
    case "woocommerce":
      return `Consumer key ${maskSecret(payload.consumerKey)} · secret ${maskSecret(payload.consumerSecret)}`;
    case "nuvemshop":
      return `Access token ${maskSecret(payload.accessToken)}`;
    case "custom":
      return `Bearer ${maskSecret(payload.accessToken)}`;
  }
}

export function storeDomainFromCredentials(payload: CommerceCredentialPayload) {
  switch (payload.platform) {
    case "vtex":
      return `${payload.accountName}.${payload.environment}.com.br`;
    case "shopify":
      return payload.shopDomain;
    case "woocommerce":
      return payload.storeUrl.replace(/^https?:\/\//, "");
    case "nuvemshop":
      return `nuvemshop:${payload.storeId}`;
    case "custom":
      return payload.baseUrl.replace(/^https?:\/\//, "");
  }
}

function readField(
  fields: Record<string, string>,
  existing: CommerceCredentialPayload | null,
  provider: CommercePlatform,
  key: string,
  secret: boolean,
) {
  const incoming = fields[key]?.trim() ?? "";
  if (incoming) {
    return incoming;
  }
  if (secret && existing?.platform === provider) {
    const stored = existing[key as keyof CommerceCredentialPayload];
    if (typeof stored === "string" && stored.trim()) {
      return stored.trim();
    }
  }
  return "";
}

export function buildCredentialPayload(input: {
  provider: string;
  fields: Record<string, string>;
  existing?: CommerceCredentialPayload | null;
}): { payload: CommerceCredentialPayload } | { error: string } {
  if (!isCommercePlatform(input.provider)) {
    return { error: "Plataforma não suportada." };
  }
  const spec = integrationProviderSpec(input.provider);
  if (!spec) {
    return { error: "Plataforma não suportada." };
  }

  const resolved: Record<string, string> = {};
  for (const field of spec.fields) {
    const value =
      readField(
        input.fields,
        input.existing ?? null,
        input.provider,
        field.key,
        Boolean(field.secret),
      ) || field.defaultValue?.trim() || "";
    if (field.required && !value) {
      return { error: `Informe ${field.label}.` };
    }
    resolved[field.key] = value;
  }

  switch (input.provider) {
    case "vtex":
      return {
        payload: {
          platform: "vtex",
          accountName: resolved.accountName,
          environment: resolved.environment || "vtexcommercestable",
          appKey: resolved.appKey,
          appToken: resolved.appToken,
        },
      };
    case "shopify": {
      let shopDomain = resolved.shopDomain
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "");
      if (!shopDomain.includes(".")) {
        shopDomain = `${shopDomain}.myshopify.com`;
      }
      return {
        payload: {
          platform: "shopify",
          shopDomain,
          accessToken: resolved.accessToken,
        },
      };
    }
    case "woocommerce": {
      const raw = resolved.storeUrl.replace(/\/$/, "");
      const storeUrl = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
      return {
        payload: {
          platform: "woocommerce",
          storeUrl,
          consumerKey: resolved.consumerKey,
          consumerSecret: resolved.consumerSecret,
        },
      };
    }
    case "nuvemshop":
      return {
        payload: {
          platform: "nuvemshop",
          storeId: resolved.storeId.replace(/\D/g, "") || resolved.storeId,
          accessToken: resolved.accessToken,
        },
      };
    case "custom":
      return {
        payload: {
          platform: "custom",
          baseUrl: resolved.baseUrl,
          accessToken: resolved.accessToken,
        },
      };
  }
}
