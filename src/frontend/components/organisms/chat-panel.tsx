"use client";

import { useMemo, useState } from "react";

import type { ProductRef } from "@/backend/modules/chat/domain/intent";
import { ChatBubble } from "@/frontend/components/molecules/chat-bubble";
import { ProductCard } from "@/frontend/components/molecules/product-card";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: ProductRef[];
};

type ChatPanelProps = {
  storeId?: string;
};

export function ChatPanel({ storeId }: ChatPanelProps) {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou o assistente da sua loja. O que você está procurando hoje?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const products = useMemo(
    () => messages.flatMap((m) => m.products ?? []),
    [messages],
  );

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || pending) {
      return;
    }
    setError(null);
    setPending(true);
    setInput("");

    const userMessage: UiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          storeId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível enviar a mensagem.");
      }
      setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          products: data.products,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no chat.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ChatMessageList messages={messages} sessionId={sessionId} storeId={storeId} />
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      <div className="sticky bottom-0 mt-auto flex flex-col gap-2 border-t border-border bg-background/95 p-3 backdrop-blur sm:p-4">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          rows={3}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendMessage();
            }
          }}
        />
        <Button
          type="button"
          disabled={pending || !input.trim()}
          onClick={() => void sendMessage()}
        >
          {pending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
      <ProductGridDesktop products={products} storeId={storeId} sessionId={sessionId} />
    </div>
  );
}

function ChatMessageList({
  messages,
  sessionId,
  storeId,
}: {
  messages: UiMessage[];
  sessionId?: string;
  storeId?: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-4 sm:px-4">
      {messages.map((message) => (
        <div key={message.id} className="flex flex-col gap-2">
          <ChatBubble role={message.role}>{message.content}</ChatBubble>
          {message.products && message.products.length > 0 ? (
            <div className="grid gap-2 md:hidden">
              {message.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  storeId={storeId ?? ""}
                  sessionId={sessionId}
                />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ProductGridDesktop({
  products,
  storeId,
  sessionId,
}: {
  products: ProductRef[];
  storeId?: string;
  sessionId?: string;
}) {
  if (products.length === 0) {
    return null;
  }
  return (
    <ChatAside
      products={products}
      storeId={storeId}
      sessionId={sessionId}
    />
  );
}

function ChatAside({
  products,
  storeId,
  sessionId,
}: {
  products: ProductRef[];
  storeId?: string;
  sessionId?: string;
}) {
  return (
    <aside className="hidden border-t border-border bg-card/40 p-4 lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:w-[min(420px,38vw)] lg:flex-col lg:border-l lg:border-t-0">
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        Produtos em destaque
      </h2>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {products.slice(0, 12).map((product) => (
          <ProductCard
            key={`aside-${product.id}`}
            product={product}
            storeId={storeId ?? ""}
            sessionId={sessionId}
          />
        ))}
      </div>
    </aside>
  );
}
