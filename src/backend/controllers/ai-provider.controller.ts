"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { auth } from "@/backend/auth";
import { encryptStorePayload } from "@/backend/lib/account/store-credentials-crypto";
import { isAiProviderKind } from "@/backend/lib/ai/provider-catalog";
import { findStoreForOwner } from "@/backend/models/store.model";
import { prisma } from "@/backend/models/prisma";

const schema = z.object({
  storeId: z.string(),
  provider: z.string(),
  model: z.string().min(1),
  apiKey: z.string().min(8),
  baseUrl: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export type AiProviderActionState = { error?: string };

export async function saveAiProviderAction(
  _prev: AiProviderActionState,
  formData: FormData,
): Promise<AiProviderActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autenticado." };
  }

  const provider = String(formData.get("provider") ?? "");
  if (!isAiProviderKind(provider)) {
    return { error: "Provedor inválido." };
  }

  const parsed = schema.safeParse({
    storeId: formData.get("storeId"),
    provider,
    model: formData.get("model"),
    apiKey: formData.get("apiKey"),
    baseUrl: formData.get("baseUrl") || undefined,
    isDefault: formData.get("isDefault") === "on",
  });

  if (!parsed.success) {
    return { error: "Preencha provedor, modelo e chave de API." };
  }

  const store = await findStoreForOwner(parsed.data.storeId, session.user.id);
  if (!store) {
    return { error: "Loja não encontrada." };
  }

  const encryptedApiKey = encryptStorePayload(
    store.id,
    parsed.data.apiKey,
  );

  if (parsed.data.isDefault) {
    await prisma.aiProviderConfig.updateMany({
      where: { storeId: store.id },
      data: { isDefault: false },
    });
  }

  await prisma.aiProviderConfig.upsert({
    where: {
      storeId_provider: { storeId: store.id, provider },
    },
    create: {
      storeId: store.id,
      provider,
      model: parsed.data.model,
      encryptedApiKey,
      baseUrl: parsed.data.baseUrl,
      isDefault: parsed.data.isDefault ?? true,
    },
    update: {
      model: parsed.data.model,
      encryptedApiKey,
      baseUrl: parsed.data.baseUrl,
      isDefault: parsed.data.isDefault ?? true,
    },
  });

  redirect("/admin/ia");
}
