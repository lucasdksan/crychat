"use client";

import { Check, Plus, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useState } from 'react';
import { productImageSrc } from '@/frontend/lib/product-images';
import type { Product } from '@/experience/commerce-types';
import { formatBRL } from '@/frontend/lib/format';

interface ComparisonModalProps {
  products: Product[];
  primaryColor?: string;
  onClose: () => void;
  onRemoveProduct: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onSubmitComparisonFeedback: (helpful: boolean) => void;
}

export function ComparisonModal({
  products,
  primaryColor = '#8234e9',
  onClose,
  onRemoveProduct,
  onAddToCart,
  onSubmitComparisonFeedback,
}: ComparisonModalProps) {
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null);

  if (products.length === 0) return null;

  const bestPriceId = [...products].sort((a, b) => a.price - b.price)[0]?.id;
  const bestRatingId = [...products].sort((a, b) => b.rating - a.rating)[0]?.id;

  const rows: { label: string; render: (p: Product) => string }[] = [
    { label: 'SKU', render: (p) => p.sku },
    { label: 'Categoria', render: (p) => p.category },
    { label: 'Processador', render: (p) => p.specs.processor ?? '—' },
    {
      label: 'Memória RAM',
      render: (p) => (p.specs.ramGb ? `${p.specs.ramGb} GB` : '—'),
    },
    { label: 'Armazenamento', render: (p) => p.specs.storage ?? '—' },
    { label: 'Tela', render: (p) => p.specs.display ?? '—' },
    { label: 'Câmera', render: (p) => p.specs.camera ?? '—' },
    { label: 'Bateria', render: (p) => p.specs.battery ?? '—' },
    { label: 'Conectividade', render: (p) => p.specs.connectivity ?? '—' },
    {
      label: 'Avaliação',
      render: (p) => `${p.rating.toFixed(1)} / 5,0 (${p.reviewCount} avaliações)`,
    },
    { label: 'Disponibilidade', render: (p) => `${p.stock} unidades` },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comparação de produtos"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Comparativo Técnico de Produtos
            </h2>
            <p className="text-xs text-muted-foreground">
              Comparação lado a lado sincronizada com os dados do catálogo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar comparação"
            className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border align-top">
                <th className="w-40 pb-4 pr-4 text-xs font-medium text-muted-foreground">
                  Especificação
                </th>
                {products.map((product) => (
                  <th key={product.id} className="pb-4 px-3 font-normal">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {product.brand}
                        </p>
                        <p className="font-heading text-sm font-semibold text-foreground">
                          {product.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveProduct(product.id)}
                        aria-label={`Remover ${product.name} da comparação`}
                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
                      <img
                        src={productImageSrc(product)}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="font-heading text-base font-semibold text-foreground tabular-nums">
                        {formatBRL(product.price)}
                      </span>
                      {product.id === bestPriceId && (
                        <span className="text-xs font-medium text-brand-secondary">
                          Menor preço
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddToCart(product)}
                      style={{ backgroundColor: primaryColor }}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar ao carrinho
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {rows.map((row) => (
                <tr key={row.label} className="hover:bg-muted/40">
                  <td className="py-3 pr-4 font-medium text-muted-foreground">
                    {row.label}
                  </td>
                  {products.map((product) => (
                    <td
                      key={product.id}
                      className="px-3 py-3 text-foreground tabular-nums"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{row.render(product)}</span>
                        {row.label === 'Avaliação' && product.id === bestRatingId && (
                          <Check className="h-3.5 w-3.5 text-brand-secondary shrink-0" />
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Comparison Quality Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background px-6 py-3 text-xs">
          <span className="text-muted-foreground">
            Esta tabela comparativa ajudou na sua escolha?
          </span>
          {voted ? (
            <span className="text-status-ok font-medium">
              Obrigado pela avaliação!
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setVoted('yes');
                  onSubmitComparisonFeedback(true);
                }}
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:border-status-ok"
              >
                <ThumbsUp className="h-3.5 w-3.5 text-status-ok" />
                Sim, ajudou
              </button>
              <button
                type="button"
                onClick={() => {
                  setVoted('no');
                  onSubmitComparisonFeedback(false);
                }}
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                Faltou detalhe
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
