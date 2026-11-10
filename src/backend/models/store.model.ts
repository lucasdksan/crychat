import type { CommercePlatform } from "@/generated/prisma/client";
import { prisma } from "@/backend/models/prisma";
import {
  decryptStorePayload,
  encryptStorePayload,
} from "@/backend/lib/account/store-credentials-crypto";

export type VtexCredentialPayload = {
  accountName: string;
  environment: string;
  appKey: string;
  appToken: string;
};

export type StoreCredentialPayload = VtexCredentialPayload;

export function createStore(input: {
  ownerId: string;
  name: string;
  domain?: string;
  platform: CommercePlatform;
}) {
  return prisma.store.create({ data: input });
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
): StoreCredentialPayload {
  const json = decryptStorePayload(storeId, encryptedPayload);
  return JSON.parse(json) as StoreCredentialPayload;
}
