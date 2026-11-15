"use server";

import { redirect } from "next/navigation";

import { auth } from "@/backend/auth";
import { createCommerceConnector } from "@/backend/modules/commerce/infra/factory";
import { resolveAiProviderForStore } from "@/backend/modules/ai/application/resolve-provider";
import { runCatalogSyncJob } from "@/backend/modules/catalog/application/sync-catalog";
import { PineconeVectorStore } from "@/backend/modules/search/infra/pinecone-vector-store";
import { connectStoreIntegration } from "@/backend/modules/commerce/application/connect-store";
import { isCommercePlatform } from "@/backend/modules/commerce/application/credential-payload";
import {
  createStore,
  deleteStore,
  findStoreForOwner,
} from "@/backend/models/store.model";
import { setActiveStore } from "@/backend/models/user.model";
import { prisma } from "@/backend/models/prisma";
import { integrationProviderSpec } from "@/backend/modules/commerce/domain/integration-providers";

export type StoreActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createStoreAction(
  _prev: StoreActionState,
  formData: FormData,
): Promise<StoreActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autenticado." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const domain = String(formData.get("domain") ?? "").trim();
  const platform = String(formData.get("platform") ?? "vtex");
  if (name.length < 2) {
    return { fieldErrors: { name: ["Informe o nome da loja."] } };
  }
  if (!isCommercePlatform(platform)) {
    return { error: "Plataforma não suportada." };
  }

  const fields: Record<string, string> = {};
  const spec = integrationProviderSpec(platform);
  for (const field of spec?.fields ?? []) {
    fields[field.key] = String(formData.get(field.key) ?? "");
  }

  const store = await createStore({
    ownerId: session.user.id,
    name,
    domain: domain || undefined,
    platform,
  });

  try {
    await connectStoreIntegration({
      storeId: store.id,
      provider: platform,
      fields,
      publicDomain: domain || undefined,
    });
  } catch (error) {
    await deleteStore(store.id);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível conectar a loja.",
    };
  }

  await setActiveStore(session.user.id, store.id);
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
