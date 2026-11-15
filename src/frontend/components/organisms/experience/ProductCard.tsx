"use client";

import { GitCompare, Package, Plus, Star } from 'lucide-react';
import { useState } from 'react';
import { productImageSrc } from '@/frontend/lib/product-images';
import type { Product } from '@/backend/modules/experience/domain/types';
import { formatBRL } from '@/frontend/lib/format';

interface ProductCardProps {
  product: Product;
  isCompared: boolean;
  isHighlighted?: boolean;
  primaryColor?: string;
  borderRadiusPx?: number;
  density?: 'detalhado' | 'compacto';
  onToggleCompare: (productId: string) => void;
  onInspect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({
  product,
  isCompared,
  isHighlighted = false,
  primaryColor = '#8234e9',
  borderRadiusPx = 5,
  density = 'detalhado',
  onToggleCompare,
  onInspect,
  onAddToCart,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const imageSrc = productImageSrc(product);

  const specLine = [
    product.specs.ramGb ? `${product.specs.ramGb} GB RAM` : null,
    product.specs.processor ?? null,
    product.specs.storage ?? null,
    !product.specs.processor && product.specs.display ? product.specs.display : null,
    !product.specs.processor && product.specs.battery ? product.specs.battery : null,
  ]
    .filter(Boolean)
    .slice(0, 3)
    .join(' · ');

  return (
    <article
      style={{
        borderRadius: `${borderRadiusPx}px`,
        borderColor: isHighlighted ? primaryColor : undefined,
      }}
      className={`group flex flex-col overflow-hidden border bg-card transition-transform duration-150 hover:-translate-y-0.5 ${
        isHighlighted ? 'ring-1 ring-primary/40' : 'border-border'
      }`}
    >
      {/* 4:3 Studio Product Stage */}
      <button
        type="button"
        onClick={() => onInspect(product)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {imageSrc && !imgError ? (
          <img
            src={imageSrc}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-secondary p-4 text-center">
            <Package className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{product.name}</span>
          </div>
        )}
      </button>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Clean unboxed metadata line */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">
            {product.brand} · {product.category}
          </span>
          <span className="flex items-center gap-1 shrink-0 tabular-nums text-foreground/85">
            <Star className="h-3 w-3 fill-status-untested text-status-untested" />
            {product.rating.toFixed(1)}
          </span>
        </div>

        {/* Title */}
        <button
          type="button"
          onClick={() => onInspect(product)}
          className="mt-1.5 text-left font-heading text-base font-semibold leading-snug text-foreground hover:text-link transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          {product.name}
        </button>

        {/* Key Specs */}
        {specLine && (
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-1">
            {specLine}
          </p>
        )}

        {density === 'detalhado' && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* Price & Stock */}
        <div className="mt-auto pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              {product.originalPrice && (
                <span className="mr-2 text-xs text-muted-foreground line-through tabular-nums">
                  {formatBRL(product.originalPrice)}
                </span>
              )}
              <span className="font-heading text-lg font-semibold text-foreground tabular-nums">
                {formatBRL(product.price)}
              </span>
            </div>
            <span className="text-xs text-status-ok tabular-nums">
              {product.stock > 0 ? `${product.stock} em estoque` : 'Indisponível'}
            </span>
          </div>

          {product.promotionLabel && (
            <p className="mt-0.5 text-xs font-medium text-brand-secondary">
              {product.promotionLabel}
            </p>
          )}

          {/* Action Row */}
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => onToggleCompare(product.id)}
              aria-pressed={isCompared}
              className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isCompared
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              {isCompared ? 'Comparando' : 'Comparar'}
            </button>

            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={product.stock === 0}
              style={{ backgroundColor: primaryColor, borderRadius: `${borderRadiusPx}px` }}
              className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
