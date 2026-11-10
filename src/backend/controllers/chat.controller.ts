import { z } from "zod";

import { auth } from "@/backend/auth";
import { runChatEngine } from "@/backend/modules/chat/application/chat-engine";
import { resolveAiProviderForStore } from "@/backend/modules/ai/application/resolve-provider";
import { createCommerceConnector } from "@/backend/modules/commerce/infra/factory";
import { PineconeVectorStore } from "@/backend/modules/search/infra/pinecone-vector-store";
import {
  appendChatMessage,
  createChatSession,
  findChatSession,
} from "@/backend/models/chat-session.model";
import { findStoreForOwner } from "@/backend/models/store.model";
import { findUserById, setActiveStore } from "@/backend/models/user.model";

const chatBodySchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().optional(),
  storeId: z.string().optional(),
});

export async function handleChatPost(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = chatBodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Entrada inválida." }, { status: 400 });
  }

  const user = await findUserById(session.user.id);
  if (!user) {
    return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const storeId = parsed.data.storeId ?? user.activeStoreId ?? user.stores[0]?.id;
  if (!storeId) {
    return Response.json(
      { error: "Cadastre uma loja no admin antes de usar o chat." },
      { status: 400 },
    );
  }

  if (!user.activeStoreId) {
    await setActiveStore(user.id, storeId);
  }

  const store = await findStoreForOwner(storeId, user.id);
  if (!store) {
    return Response.json({ error: "Loja não encontrada." }, { status: 404 });
  }

  let chatSession = parsed.data.sessionId
    ? await findChatSession(parsed.data.sessionId, storeId)
    : null;
  if (!chatSession) {
    const created = await createChatSession(storeId, user.id);
    chatSession = await findChatSession(created.id, storeId);
  }
  if (!chatSession) {
    return Response.json({ error: "Sessão inválida." }, { status: 500 });
  }

  await appendChatMessage({
    sessionId: chatSession.id,
    role: "user",
    content: parsed.data.message,
  });

  const history = chatSession.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const ai = await resolveAiProviderForStore(storeId);
  const vectorStore = process.env.PINECONE_API_KEY
    ? new PineconeVectorStore()
    : null;
  const connector =
    store.credential &&
    createCommerceConnector(
      store.platform,
      store.id,
      store.credential.encryptedPayload,
    );

  const result = await runChatEngine({
    storeId,
    storeName: store.name,
    sessionId: chatSession.id,
    message: parsed.data.message,
    history,
    ai,
    connector,
    vectorStore,
  });

  await appendChatMessage({
    sessionId: chatSession.id,
    role: "assistant",
    content: result.reply,
    productRefs: result.products,
    intent: result.intent,
    latencyMs: result.latencyMs,
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
  });

  return Response.json({
    sessionId: chatSession.id,
    reply: result.reply,
    intent: result.intent,
    products: result.products,
    latencyMs: result.latencyMs,
  });
}
