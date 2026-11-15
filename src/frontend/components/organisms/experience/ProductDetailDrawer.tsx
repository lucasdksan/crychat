"use client";

import { Check, GitCompare, Plus, Star, X } from 'lucide-react';
import { productImageSrc } from '@/frontend/lib/product-images';
import type { Product } from '@/backend/modules/experience/domain/types';
import { formatBRL } from '@/frontend/lib/format';

interface ProductDetailDrawerProps {
  product: Product | null;
  isCompared: boolean;
  primaryColor?: string;
  onClose: () => void;
  onToggleCompare: (productId: string) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductDetailDrawer({
  product,
  isCompared,
  primaryColor = '#8234e9',
  onClose,
  onToggleCompare,
  onAddToCart,
}: ProductDetailDrawerProps) {
  if (!product) return null;

  const specEntries: [string, string | undefined][] = [
    ['Processador', product.specs.processor],
    ['Memória RAM', product.specs.ramGb ? `${product.specs.ramGb} GB` : undefined],
    ['Armazenamento', product.specs.storage],
    ['Tela', product.specs.display],
    ['Câmera', product.specs.camera],
    ['Bateria', product.specs.battery],
    ['Conectividade', product.specs.connectivity],
    ['Peso', product.specs.weight],
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${product.name}`}
      className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs"
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="text-xs text-muted-foreground">
            {product.brand} · {product.category} · {product.sku}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
            <img
              src={productImageSrc(product)}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-xl font-semibold text-foreground">
                {product.name}
              </h2>
              <span className="flex items-center gap-1 text-xs font-medium text-foreground tabular-nums shrink-0">
                <Star className="h-3.5 w-3.5 fill-status-untested text-status-untested" />
                {product.rating.toFixed(1)} ({product.reviewCount})
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-heading text-2xl font-semibold text-foreground tabular-nums">
                {formatBRL(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through tabular-nums">
                  {formatBRL(product.originalPrice)}
                </span>
              )}
              {product.promotionLabel && (
                <span className="text-xs font-medium text-brand-secondary">
                  {product.promotionLabel}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {product.shortDescription}
            </p>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-xs font-semibold text-foreground">
              Destaques do Produto
            </h3>
            <ul className="mt-3 space-y-2">
              {product.highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-secondary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-xs font-semibold text-foreground">
              Ficha Técnica Verificada
            </h3>
            <dl className="mt-3 divide-y divide-border border-y border-border text-xs">
              {specEntries
                .filter(([, value]) => Boolean(value))
                .map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium text-foreground tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>

        <div className="border-t border-border bg-card p-6">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Disponibilidade</span>
            <span className="font-medium text-status-ok tabular-nums">
              {product.stock} unidades para envio imediato
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleCompare(product.id)}
              className={`flex items-center justify-center gap-1.5 rounded-md border px-4 py-2.5 text-xs font-medium transition-colors ${
                isCompared
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border bg-secondary/40 text-foreground hover:bg-secondary'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              {isCompared ? 'Na comparação' : 'Comparar'}
            </button>
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              style={{ backgroundColor: primaryColor }}
              className="flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
