import {
  readStoreCredentials,
  updateStoreConnection,
  upsertStoreCredentials,
} from "@/backend/models/store.model";
import { importConnectorProducts } from "@/backend/modules/catalog/application/import-catalog";
import {
  buildCredentialPayload,
  describeSavedCredentials,
  normalizeStoredCredential,
  storeDomainFromCredentials,
} from "@/backend/modules/commerce/application/credential-payload";
import { createConnectorFromPayload } from "@/backend/modules/commerce/infra/factory";

export async function connectStoreIntegration(input: {
  storeId: string;
  provider: string;
  fields: Record<string, string>;
  existingEncrypted?: string | null;
  publicDomain?: string;
}) {
  const existing = input.existingEncrypted
    ? normalizeStoredCredential(
        readStoreCredentials(input.storeId, input.existingEncrypted),
      )
    : null;
  const built = buildCredentialPayload({
    provider: input.provider,
    fields: input.fields,
    existing,
  });
  if ("error" in built) {
    throw new Error(built.error);
  }

  const payload = built.payload;
  const connector = createConnectorFromPayload(payload);
  const valid = await connector.validateCredentials();
  if (!valid) {
    throw new Error(
      "Credenciais recusadas pela plataforma. Confira os tokens e as permissões de leitura do catálogo.",
    );
  }

  await updateStoreConnection(input.storeId, {
    platform: payload.platform,
    domain: input.publicDomain?.trim() || undefined,
  });
  await upsertStoreCredentials(input.storeId, payload.platform, payload);

  const imported = await importConnectorProducts(input.storeId, connector);
  return {
    imported,
    payload,
    masked: describeSavedCredentials(payload),
    storeDomain: storeDomainFromCredentials(payload),
  };
}
