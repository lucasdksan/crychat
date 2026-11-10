import type { CommercePlatform } from "@/generated/prisma/client";
import type { CommerceConnector } from "@/backend/modules/commerce/domain/types";
import {
  readStoreCredentials,
  type StoreCredentialPayload,
} from "@/backend/models/store.model";
import { NuvemshopConnector } from "@/backend/modules/commerce/infra/nuvemshop-connector";
import { VtexConnector } from "@/backend/modules/commerce/infra/vtex-connector";

export function createCommerceConnector(
  platform: CommercePlatform,
  storeId: string,
  encryptedPayload: string,
): CommerceConnector {
  const payload = readStoreCredentials(storeId, encryptedPayload);

  switch (platform) {
    case "vtex": {
      const creds = payload as StoreCredentialPayload;
      return new VtexConnector({
        accountName: creds.accountName,
        environment: creds.environment,
        appKey: creds.appKey,
        appToken: creds.appToken,
      });
    }
    case "nuvemshop":
      return new NuvemshopConnector();
    default:
      throw new Error(`Plataforma ${platform} ainda não suportada.`);
  }
}
