"use client";

import { CheckCircle2, Star, X } from 'lucide-react';
import { useState } from 'react';

interface QualitySurveyCardProps {
  context: 'chat' | 'busca' | 'comparacao';
  primaryColor?: string;
  onSubmit: (payload: {
    rating: number;
    helpful: boolean;
    context: 'chat' | 'busca' | 'comparacao';
    reason?: string;
    comment?: string;
  }) => Promise<void> | void;
  onDismiss?: () => void;
}

const POSITIVE_REASONS = [
  'Encontrei o produto ideal',
  'Comparação clara',
  'Respostas rápidas',
  'Filtros precisos',
];

const IMPROVEMENT_REASONS = [
  'Faltou opção no catálogo',
  'Filtro não entendeu o pedido',
  'Resposta pouco objetiva',
];

export function QualitySurveyCard({
  context,
  primaryColor = '#8234e9',
  onSubmit,
  onDismiss,
}: QualitySurveyCardProps) {
  const [rating, setRating] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-md border border-status-ok/40 bg-status-ok/10 p-3.5 text-xs text-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-status-ok" />
          <span className="font-medium">
            Obrigado! Sua avaliação foi registrada no painel de qualidade.
          </span>
        </div>
      </div>
    );
  }

  const reasons =
    rating > 0 && rating <= 3 ? IMPROVEMENT_REASONS : POSITIVE_REASONS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        rating,
        helpful: rating >= 4,
        context,
        reason: reason || undefined,
        comment: comment.trim() || undefined,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-border bg-background p-3.5 text-xs"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-xs font-semibold text-foreground">
            Pesquisa rápida de satisfação
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Como está sendo sua experiência usando o CryChat para escolher?
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fechar pesquisa"
            className="rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 1-5 Star Rating */}
      <div className="mt-3 flex items-center gap-1.5" role="radiogroup" aria-label="Nota de 1 a 5">
        {[1, 2, 3, 4, 5].map((value) => {
          const active = value <= rating;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                setRating(value);
                setReason('');
              }}
              aria-label={`${value} estrelas`}
              className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                active
                  ? 'border-status-untested/60 bg-status-untested/15 text-status-untested'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <Star
                className={`h-4 w-4 ${active ? 'fill-status-untested' : ''}`}
              />
            </button>
          );
        })}
        {rating > 0 && (
          <span className="ml-1.5 text-[11px] font-medium text-foreground tabular-nums">
            {rating}/5
          </span>
        )}
      </div>

      {rating > 0 && (
        <div className="mt-3 space-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((item) => {
              const selected = reason === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setReason(selected ? '' : item)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
                    selected
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comentário opcional sobre a resposta ou busca..."
            className="h-8 w-full rounded-md border border-border bg-input px-2.5 text-[11px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: primaryColor }}
            className="w-full rounded-md py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Enviar avaliação'}
          </button>
        </div>
      )}
    </form>
  );
}
