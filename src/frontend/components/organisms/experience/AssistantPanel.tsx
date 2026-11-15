"use client";

import {
  ArrowRight,
  Camera,
  Headphones,
  Loader2,
  PanelRightClose,
  RotateCcw,
  Send,
  SlidersHorizontal,
  Star,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { productImageSrc } from '@/frontend/lib/product-images';
import type { ChatMessage, Product } from '@/backend/modules/experience/domain/types';
import { formatBRL } from '@/frontend/lib/format';
import { QualitySurveyCard } from './QualitySurveyCard';

interface AssistantPanelProps {
  tenantName: string;
  welcomeMessage: string;
  starterPrompts: string[];
  messages: ChatMessage[];
  productsById: Record<string, Product>;
  loading: boolean;
  error: string | null;
  primaryColor: string;
  borderRadiusPx: number;
  compact?: boolean;
  onSendMessage: (text: string) => void;
  onVisualSearchFile: (file: File) => void;
  onSelectProduct: (product: Product, fromRecommendation?: boolean) => void;
  onVoteMessage: (messageId: string, vote: 'helpful' | 'unhelpful') => void;
  onSubmitSurvey: (payload: {
    rating: number;
    helpful: boolean;
    context: 'chat' | 'busca' | 'comparacao';
    reason?: string;
    comment?: string;
  }) => Promise<void> | void;
  onResetFilters: () => void;
  onClearChat: () => void;
  onCollapse?: () => void;
}

export function AssistantPanel({
  tenantName,
  welcomeMessage,
  starterPrompts,
  messages,
  productsById,
  loading,
  error,
  primaryColor,
  borderRadiusPx,
  compact = false,
  onSendMessage,
  onVisualSearchFile,
  onSelectProduct,
  onVoteMessage,
  onSubmitSurvey,
  onResetFilters,
  onClearChat,
  onCollapse,
}: AssistantPanelProps) {
  const [input, setInput] = useState('');
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [surveyDismissed, setSurveyDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assistantTurns = messages.filter((m) => m.role === 'assistant').length;
  const shouldShowAutoSurvey =
    !surveyDismissed && (surveyOpen || assistantTurns >= 2);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, shouldShowAutoSurvey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    onSendMessage(trimmed);
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate font-heading text-sm font-semibold text-foreground">
            Assistente de Compras
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {tenantName} · Contexto sincronizado com a vitrine
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSurveyDismissed(false);
              setSurveyOpen(true);
            }}
            title="Avaliar qualidade do assistente"
            aria-label="Avaliar qualidade"
            className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Star className="h-3 w-3" />
            <span className="hidden sm:inline">Avaliar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSurveyOpen(false);
              setSurveyDismissed(false);
              onClearChat();
            }}
            title="Nova conversa"
            aria-label="Nova conversa"
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              title="Recolher painel"
              aria-label="Recolher painel do assistente"
              className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Viewport */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
      >
        <div
          style={{ borderRadius: `${borderRadiusPx}px` }}
          className="border border-border bg-background p-3.5 text-xs leading-relaxed text-foreground"
        >
          <p>{welcomeMessage}</p>
        </div>

        {messages.length === 0 && starterPrompts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Sugestões para testar a jornada
            </p>
            <div className="flex flex-col gap-1.5">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onSendMessage(prompt)}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-xs text-foreground hover:border-primary/60 hover:bg-muted/60 transition-colors"
                >
                  <span className="line-clamp-1">{prompt}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const filterParts: string[] = [];
          if (msg.appliedFilters?.category && msg.appliedFilters.category !== 'Todos') {
            filterParts.push(msg.appliedFilters.category);
          }
          if (msg.appliedFilters?.minRamGb) {
            filterParts.push(`RAM ≥ ${msg.appliedFilters.minRamGb} GB`);
          }
          if (msg.appliedFilters?.maxPrice) {
            filterParts.push(`até ${formatBRL(msg.appliedFilters.maxPrice)}`);
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                style={{
                  borderRadius: `${borderRadiusPx}px`,
                  backgroundColor: isUser ? primaryColor : undefined,
                }}
                className={`max-w-[92%] px-3.5 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? 'text-primary-foreground'
                    : 'border border-border bg-background text-foreground'
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>
              </div>

              {!isUser && filterParts.length > 0 && (
                <div className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs">
                  <span className="flex items-center gap-1.5 truncate text-muted-foreground">
                    <SlidersHorizontal className="h-3 w-3 shrink-0 text-brand-secondary" />
                    <span className="truncate">
                      Vitrine filtrada: {filterParts.join(' · ')}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="shrink-0 text-link hover:underline"
                  >
                    Limpar
                  </button>
                </div>
              )}

              {!isUser && msg.escalatedToHuman && (
                <div className="flex w-full items-center gap-2 rounded-md border border-status-ok/40 bg-status-ok/10 px-3 py-2 text-xs text-foreground">
                  <Headphones className="h-4 w-4 shrink-0 text-status-ok" />
                  <span>
                    Atendimento humano acionado. Histórico transferido para um especialista.
                  </span>
                </div>
              )}

              {!isUser &&
                msg.recommendedProductIds &&
                msg.recommendedProductIds.length > 0 && (
                  <div className="w-full space-y-2">
                    {msg.recommendedProductIds.map((pid) => {
                      const prod = productsById[pid];
                      if (!prod) return null;
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => onSelectProduct(prod, true)}
                          className="flex w-full items-center gap-3 rounded-md border border-border bg-background p-2 text-left transition-colors hover:border-primary/60"
                        >
                          <img
                            src={productImageSrc(prod)}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="h-12 w-16 shrink-0 rounded object-cover bg-muted"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {prod.name}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {prod.specs.ramGb ? `${prod.specs.ramGb} GB RAM · ` : ''}
                              {prod.specs.processor ?? prod.category}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-foreground tabular-nums">
                            {formatBRL(prod.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

              {/* Per-turn response quality feedback */}
              {!isUser && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>Esta resposta ajudou?</span>
                  <button
                    type="button"
                    onClick={() => onVoteMessage(msg.id, 'helpful')}
                    disabled={Boolean(msg.feedbackVote)}
                    aria-label="Resposta útil"
                    className={`rounded p-1 transition-colors ${
                      msg.feedbackVote === 'helpful'
                        ? 'text-status-ok'
                        : 'hover:text-foreground disabled:opacity-40'
                    }`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onVoteMessage(msg.id, 'unhelpful')}
                    disabled={Boolean(msg.feedbackVote)}
                    aria-label="Resposta não útil"
                    className={`rounded p-1 transition-colors ${
                      msg.feedbackVote === 'unhelpful'
                        ? 'text-destructive'
                        : 'hover:text-foreground disabled:opacity-40'
                    }`}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                  {msg.feedbackVote && (
                    <span className="text-muted-foreground">Registrado</span>
                  )}
                </div>
              )}

              {!isUser &&
                !compact &&
                msg.suggestedFollowUps &&
                msg.suggestedFollowUps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {msg.suggestedFollowUps.map((followUp) => (
                      <button
                        key={followUp}
                        type="button"
                        onClick={() => onSendMessage(followUp)}
                        className="rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-[11px] text-foreground hover:border-primary/60 transition-colors"
                      >
                        {followUp}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          );
        })}

        {/* Contextual Quality & Satisfaction Micro-Survey */}
        {shouldShowAutoSurvey && (
          <QualitySurveyCard
            context="chat"
            primaryColor={primaryColor}
            onSubmit={onSubmitSurvey}
            onDismiss={() => {
              setSurveyOpen(false);
              setSurveyDismissed(true);
            }}
          />
        )}

        {loading && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3.5 py-2.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>Analisando catálogo e refinando recomendações...</span>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3.5 py-2.5 text-xs text-foreground">
            {error}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border bg-card p-3"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onVisualSearchFile(file);
              e.target.value = '';
            }
          }}
        />
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Busca visual por imagem"
            aria-label="Enviar imagem para busca visual"
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <Camera className="h-4 w-4" />
          </button>

          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Descreva o que procura ou refine..."
            className="min-h-9 max-h-24 flex-1 resize-none rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              backgroundColor: primaryColor,
              borderRadius: `${borderRadiusPx}px`,
            }}
            aria-label="Enviar mensagem"
            className="flex h-9 items-center justify-center gap-1.5 px-3.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
      </form>
    </div>
  );
}
