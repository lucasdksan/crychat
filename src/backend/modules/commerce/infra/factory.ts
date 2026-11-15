import type { CommercePlatform } from "@/generated/prisma/client";
import type { CommerceConnector } from "@/backend/modules/commerce/domain/types";
import { readStoreCredentials } from "@/backend/models/store.model";
import type { CommerceCredentialPayload } from "@/backend/modules/commerce/application/credential-payload";
import { CustomConnector } from "@/backend/modules/commerce/infra/custom-connector";
import { NuvemshopConnector } from "@/backend/modules/commerce/infra/nuvemshop-connector";
import { ShopifyConnector } from "@/backend/modules/commerce/infra/shopify-connector";
import { VtexConnector } from "@/backend/modules/commerce/infra/vtex-connector";
import { WooCommerceConnector } from "@/backend/modules/commerce/infra/woocommerce-connector";

export function createConnectorFromPayload(
  payload: CommerceCredentialPayload,
): CommerceConnector {
  switch (payload.platform) {
    case "vtex":
      return new VtexConnector({
        accountName: payload.accountName,
        environment: payload.environment,
        appKey: payload.appKey,
        appToken: payload.appToken,
      });
    case "shopify":
      return new ShopifyConnector(payload.shopDomain, payload.accessToken);
    case "woocommerce":
      return new WooCommerceConnector(
        payload.storeUrl,
        payload.consumerKey,
        payload.consumerSecret,
      );
    case "nuvemshop":
      return new NuvemshopConnector(payload.storeId, payload.accessToken);
    case "custom":
      return new CustomConnector(payload.baseUrl, payload.accessToken);
  }
}

export function createCommerceConnector(
  platform: CommercePlatform,
  storeId: string,
  encryptedPayload: string,
): CommerceConnector {
  const payload = readStoreCredentials(storeId, encryptedPayload);
  if (payload.platform !== platform) {
    throw new Error(`Credenciais não correspondem à plataforma ${platform}.`);
  }
  return createConnectorFromPayload(payload);
}
