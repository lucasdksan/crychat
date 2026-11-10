"use client";

import Image from "next/image";

import type { ProductRef } from "@/backend/modules/chat/domain/intent";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/lib/utils";

type ProductCardProps = {
  product: ProductRef;
  storeId: string;
  sessionId?: string;
  className?: string;
};

export function ProductCard({
  product,
  storeId,
  sessionId,
  className,
}: ProductCardProps) {
  async function trackClick() {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        sessionId,
        productId: product.id,
        type: "product_click",
      }),
    });
  }

  return (
    <article
      className={cn(
        "flex gap-3 rounded-[var(--radius-md)] border border-border bg-card p-3",
        className,
      )}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <p className="truncate text-sm font-semibold">{product.name}</p>
          {product.price != null ? (
            <p className="text-sm text-brand-secondary">
              R$ {product.price.toFixed(2)}
            </p>
          ) : null}
        </div>
        <ProductActions product={product} onTrack={trackClick} />
      </div>
    </article>
  );
}

function ProductActions({
  product,
  onTrack,
}: {
  product: ProductRef;
  onTrack: () => void;
}) {
  if (!product.url) {
    return null;
  }
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="h-8 w-fit"
      onClick={() => {
        onTrack();
        window.open(product.url!, "_blank", "noopener,noreferrer");
      }}
    >
      Ver produto
    </Button>
  );
}
