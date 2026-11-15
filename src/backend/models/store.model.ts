import type { CommercePlatform } from "@/generated/prisma/client";
import { prisma } from "@/backend/models/prisma";
import {
  decryptStorePayload,
  encryptStorePayload,
} from "@/backend/lib/account/store-credentials-crypto";
import {
  normalizeStoredCredential,
  type CommerceCredentialPayload,
} from "@/backend/modules/commerce/application/credential-payload";

export type {
  CommerceCredentialPayload,
  VtexCredentialPayload,
} from "@/backend/modules/commerce/application/credential-payload";

export type StoreCredentialPayload = CommerceCredentialPayload;

export function createStore(input: {
  ownerId: string;
  name: string;
  domain?: string;
  platform: CommercePlatform;
}) {
  return prisma.store.create({ data: input });
}

export function deleteStore(storeId: string) {
  return prisma.store.delete({ where: { id: storeId } });
}

export function updateStoreConnection(
  storeId: string,
  input: { platform: CommercePlatform; domain?: string },
) {
  return prisma.store.update({
    where: { id: storeId },
    data: {
      platform: input.platform,
      ...(input.domain ? { domain: input.domain } : {}),
    },
  });
}

export function listStoresByOwner(ownerId: string) {
  return prisma.store.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { credential: true, aiConfigs: true },
  });
}

export function findStoreForOwner(storeId: string, ownerId: string) {
  return prisma.store.findFirst({
    where: { id: storeId, ownerId },
    include: { credential: true, aiConfigs: true },
  });
}

export async function upsertStoreCredentials(
  storeId: string,
  platform: CommercePlatform,
  payload: StoreCredentialPayload,
) {
  const encryptedPayload = encryptStorePayload(
    storeId,
    JSON.stringify(payload),
  );
  return prisma.storeCredential.upsert({
    where: { storeId },
    create: { storeId, platform, encryptedPayload },
    update: { platform, encryptedPayload },
  });
}

export function readStoreCredentials(
  storeId: string,
  encryptedPayload: string,
): CommerceCredentialPayload {
  const json = decryptStorePayload(storeId, encryptedPayload);
  const payload = normalizeStoredCredential(JSON.parse(json) as unknown);
  if (!payload) {
    throw new Error("Credenciais da loja em formato desconhecido.");
  }
  return payload;
}
