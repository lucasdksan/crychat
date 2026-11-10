"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { auth } from "@/backend/auth";
import { createCommerceConnector } from "@/backend/modules/commerce/infra/factory";
import { resolveAiProviderForStore } from "@/backend/modules/ai/application/resolve-provider";
import { runCatalogSyncJob } from "@/backend/modules/catalog/application/sync-catalog";
import { PineconeVectorStore } from "@/backend/modules/search/infra/pinecone-vector-store";
import {
  createStore,
  findStoreForOwner,
  upsertStoreCredentials,
  type VtexCredentialPayload,
} from "@/backend/models/store.model";
import { setActiveStore } from "@/backend/models/user.model";
import { prisma } from "@/backend/models/prisma";

const vtexStoreSchema = z.object({
  name: z.string().min(2),
  domain: z.string().optional(),
  accountName: z.string().min(2),
  environment: z.string().default("vtexcommercestable"),
  appKey: z.string().min(2),
  appToken: z.string().min(2),
});

export type StoreActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createVtexStoreAction(
  _prev: StoreActionState,
  formData: FormData,
): Promise<StoreActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autenticado." };
  }

  const parsed = vtexStoreSchema.safeParse({
    name: formData.get("name"),
    domain: formData.get("domain") || undefined,
    accountName: formData.get("accountName"),
    environment: formData.get("environment") || "vtexcommercestable",
    appKey: formData.get("appKey"),
    appToken: formData.get("appToken"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const payload: VtexCredentialPayload = {
    accountName: parsed.data.accountName,
    environment: parsed.data.environment,
    appKey: parsed.data.appKey,
    appToken: parsed.data.appToken,
  };

  const store = await createStore({
    ownerId: session.user.id,
    name: parsed.data.name,
    domain: parsed.data.domain,
    platform: "vtex",
  });

  await upsertStoreCredentials(store.id, "vtex", payload);
  await setActiveStore(session.user.id, store.id);

  const connector = createCommerceConnector(
    "vtex",
    store.id,
    (await findStoreForOwner(store.id, session.user.id))!.credential!
      .encryptedPayload,
  );

  const valid = await connector.validateCredentials();
  if (!valid) {
    return { error: "Credenciais VTEX inválidas. Verifique App Key e App Token." };
  }

  redirect("/admin");
}

export async function startCatalogSyncFormAction(formData: FormData) {
  const storeId = String(formData.get("storeId") ?? "");
  if (!storeId) {
    throw new Error("Loja inválida.");
  }
  await startCatalogSyncAction(storeId);
}

export async function startCatalogSyncAction(storeId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado.");
  }

  const store = await findStoreForOwner(storeId, session.user.id);
  if (!store?.credential) {
    throw new Error("Loja sem credenciais.");
  }

  const job = await prisma.syncJob.create({
    data: { storeId, platform: store.platform, status: "pending" },
  });

  const connector = createCommerceConnector(
    store.platform,
    store.id,
    store.credential.encryptedPayload,
  );
  const ai = await resolveAiProviderForStore(storeId);
  const vectorStore = process.env.PINECONE_API_KEY
    ? new PineconeVectorStore()
    : null;

  void runCatalogSyncJob({
    storeId,
    connector,
    ai,
    vectorStore,
    jobId: job.id,
  });

  return { jobId: job.id };
}
