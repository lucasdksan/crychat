"use client";

import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { productImageSrc } from '@/frontend/lib/product-images';
import type { CartItem } from '@/backend/modules/experience/domain/types';
import { formatBRL } from '@/frontend/lib/format';
import { QualitySurveyCard } from './QualitySurveyCard';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  primaryColor?: string;
  onClose: () => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCompleteOrder: () => void;
  onSubmitFeedback: (payload: {
    rating: number;
    helpful: boolean;
    context: 'chat' | 'busca' | 'comparacao';
    reason?: string;
    comment?: string;
  }) => Promise<void> | void;
}

export function CartDrawer({
  open,
  items,
  primaryColor = '#8234e9',
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCompleteOrder,
  onSubmitFeedback,
}: CartDrawerProps) {
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  if (!open) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const shipping = subtotal >= 1000 || subtotal === 0 ? 0 : 39;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    if (items.length === 0) return;
    const orderNum = `CC-${Math.floor(1040 + Math.random() * 8900)}`;
    setConfirmedTotal(total);
    setConfirmedOrderId(orderNum);
    onCompleteOrder();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Carrinho de compras"
      className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-foreground" />
            <h2 className="font-heading text-base font-semibold text-foreground">
              Sacola de Compras
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrderId(null);
              onClose();
            }}
            aria-label="Fechar carrinho"
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {confirmedOrderId ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-background p-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-brand-secondary" />
                <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
                  Pedido {confirmedOrderId} Confirmado
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Simulação concluída na vitrine da loja.
                </p>
                <div className="mt-4 border-t border-border pt-4 text-sm font-medium text-foreground tabular-nums">
                  Total: {formatBRL(confirmedTotal)}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedOrderId(null);
                    onClose();
                  }}
                  className="mt-5 w-full rounded-md border border-border bg-secondary px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Continuar explorando
                </button>
              </div>

              <QualitySurveyCard
                context="busca"
                primaryColor={primaryColor}
                onSubmit={onSubmitFeedback}
              />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">
                Sua sacola está vazia
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Adicione produtos da vitrine ou peça uma recomendação ao assistente.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3 py-4 first:pt-0">
                  <img
                    src={productImageSrc(item.product)}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="h-16 w-20 shrink-0 rounded object-cover bg-muted"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatBRL(item.product.price)}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded border border-border bg-background">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          aria-label="Diminuir quantidade"
                          className="px-2 py-1 text-muted-foreground hover:text-foreground"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2.5 text-xs font-medium text-foreground tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          aria-label="Aumentar quantidade"
                          className="px-2 py-1 text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.product.id)}
                        aria-label={`Remover ${item.product.name}`}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!confirmedOrderId && items.length > 0 && (
          <div className="border-t border-border bg-card p-6">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatBRL(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Frete</span>
                <span className="tabular-nums text-status-ok">
                  {shipping === 0 ? 'Grátis' : formatBRL(shipping)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold text-foreground">
                <span>Total</span>
                <span className="tabular-nums">{formatBRL(total)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              style={{ backgroundColor: primaryColor }}
              className="mt-4 w-full rounded-md px-4 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Finalizar pedido simulado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
