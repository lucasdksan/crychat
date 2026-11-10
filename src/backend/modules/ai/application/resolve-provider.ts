import type { AiProviderKind } from "@/generated/prisma/client";
import type { AiProvider } from "@/backend/modules/ai/domain/ai-provider";
import { GeminiProvider } from "@/backend/modules/ai/infra/gemini-provider";
import { OpenAiProvider } from "@/backend/modules/ai/infra/openai-provider";
import { prisma } from "@/backend/models/prisma";
import { decryptStorePayload } from "@/backend/lib/account/store-credentials-crypto";

function decryptApiKey(storeId: string, ciphertext?: string | null) {
  if (!ciphertext) {
    return null;
  }
  try {
    return decryptStorePayload(storeId, ciphertext);
  } catch {
    return null;
  }
}

export async function resolveAiProviderForStore(
  storeId: string,
): Promise<AiProvider> {
  const config = await prisma.aiProviderConfig.findFirst({
    where: { storeId, isDefault: true },
  });

  if (config) {
    const apiKey = decryptApiKey(storeId, config.encryptedApiKey);
    if (config.provider === "openai" && apiKey) {
      return new OpenAiProvider(apiKey, config.model, config.baseUrl ?? undefined);
    }
    if (config.provider === "gemini" && apiKey) {
      return new GeminiProvider(apiKey, config.model);
    }
    if (config.provider === "custom" && apiKey) {
      return new OpenAiProvider(apiKey, config.model, config.baseUrl ?? undefined);
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    return new GeminiProvider(geminiKey);
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return new OpenAiProvider(openaiKey);
  }

  throw new Error("Nenhum provedor de IA configurado.");
}

export function providerKindToLabel(kind: AiProviderKind): string {
  switch (kind) {
    case "gemini":
      return "Google Gemini";
    case "openai":
      return "OpenAI";
    case "custom":
      return "Custom";
    default:
      return kind;
  }
}
