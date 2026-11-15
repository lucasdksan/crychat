"use client";

import { Star } from 'lucide-react';
import { useState } from 'react';
import type { AnalyticsSummary, Tenant } from '@/backend/modules/experience/domain/types';
import { formatNumber, formatShortDateTime } from '@/frontend/lib/format';

interface DashboardAnalyticsProps {
  activeTenant: Tenant;
  analytics: AnalyticsSummary | null;
  onOpenExperience: () => void;
}

const CONTEXT_LABELS: Record<'chat' | 'busca' | 'comparacao', string> = {
  chat: 'Assistente IA',
  busca: 'Busca Inteligente',
  comparacao: 'Comparação',
};

export function DashboardAnalytics({
  activeTenant,
  analytics,
  onOpenExperience,
}: DashboardAnalyticsProps) {
  const [chartView, setChartView] = useState<'usage' | 'quality'>('usage');

  if (!analytics) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <h1 className="font-heading text-lg font-semibold text-foreground">
          Sem métricas disponíveis ainda
        </h1>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Conecte uma integração de catálogo e interaja com a vitrine para gerar eventos.
        </p>
        <button
          type="button"
          onClick={onOpenExperience}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
        >
          Abrir Vitrine
        </button>
      </div>
    );
  }

  const maxSearches = Math.max(...analytics.dailySeries.map((d) => d.searches), 1);
  const maxRatings = Math.max(
    ...analytics.dailySeries.map((d) => d.positiveRatings + d.negativeRatings),
    1,
  );
  const ctrRate =
    analytics.conversationsCount > 0
      ? ((analytics.recommendationClicksCount / analytics.conversationsCount) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-8">
      {/* Header Row */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Visão Geral e Qualidade
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Descoberta de produtos, engajamento e satisfação dos consumidores em {activeTenant.name}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenExperience}
          className="rounded-md border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground hover:border-primary/60"
        >
          Testar na Vitrine
        </button>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Pesquisas Inteligentes</p>
          <p className="mt-2 font-heading text-2xl font-semibold text-foreground tabular-nums">
            {formatNumber(analytics.searchesCount)}
          </p>
          <p className="mt-1 text-xs text-status-ok tabular-nums">
            {formatNumber(analytics.productViewsCount)} visualizações de produto
          </p>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Conversas Assistidas</p>
          <p className="mt-2 font-heading text-2xl font-semibold text-foreground tabular-nums">
            {formatNumber(analytics.conversationsCount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {formatNumber(analytics.comparisonsCount)} comparações técnicas
          </p>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Cliques em Recomendações</p>
          <p className="mt-2 font-heading text-2xl font-semibold text-foreground tabular-nums">
            {formatNumber(analytics.recommendationClicksCount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            Taxa de engajamento: {ctrRate}%
          </p>
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Índice de Satisfação (CSAT)</p>
          <p className="mt-2 font-heading text-2xl font-semibold text-foreground tabular-nums">
            {analytics.satisfactionPercent.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-brand-secondary tabular-nums">
            Nota {analytics.averageRating.toFixed(1)} / 5,0 · {formatNumber(analytics.totalFeedbackCount)} avaliações
          </p>
        </div>
      </div>

      {/* Chart + Zero-Result Gaps */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                {chartView === 'usage'
                  ? 'Volume Diário de Buscas e Conversas'
                  : 'Satisfação Diária dos Usuários'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {chartView === 'usage'
                  ? 'Quantidade diária de pesquisas na vitrine, interações no chat e taxa CSAT do dia'
                  : 'Proporção diária entre avaliações úteis e avaliações que pediram melhoria'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                role="tablist"
                aria-label="Modo do gráfico diário"
                className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={chartView === 'usage'}
                  onClick={() => setChartView('usage')}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                    chartView === 'usage'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Uso Diário
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={chartView === 'quality'}
                  onClick={() => setChartView('quality')}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                    chartView === 'quality'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Qualidade (CSAT)
                </button>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
            {chartView === 'usage' ? (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-xs bg-primary" />
                  Buscas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-xs bg-brand-secondary" />
                  Conversas no Chat
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-xs bg-status-ok" />
                  Avaliações úteis
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-xs bg-destructive" />
                  Precisou melhorar
                </span>
              </>
            )}
          </div>

          <div className="flex h-52 items-end gap-3 border-b border-border pb-3">
            {analytics.dailySeries.map((point) => {
              const totalDayRatings = point.positiveRatings + point.negativeRatings;
              const dayCsat =
                totalDayRatings > 0
                  ? Math.round((point.positiveRatings / totalDayRatings) * 100)
                  : 100;

              if (chartView === 'usage') {
                const searchHeight = Math.max(
                  10,
                  Math.round((point.searches / maxSearches) * 100),
                );
                const convHeight = Math.max(
                  8,
                  Math.round((point.conversations / maxSearches) * 100),
                );

                return (
                  <div
                    key={point.day}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div className="flex h-36 w-full items-end justify-center gap-1.5">
                      <div
                        title={`${point.searches} buscas`}
                        style={{ height: `${searchHeight}%` }}
                        className="w-4 rounded-t-xs bg-primary transition-all"
                      />
                      <div
                        title={`${point.conversations} conversas`}
                        style={{ height: `${convHeight}%` }}
                        className="w-4 rounded-t-xs bg-brand-secondary transition-all"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-medium text-foreground tabular-nums">
                        {point.day}
                      </p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {dayCsat}% CSAT
                      </p>
                    </div>
                  </div>
                );
              }

              const posHeight = Math.max(
                10,
                Math.round((point.positiveRatings / maxRatings) * 100),
              );
              const negHeight =
                point.negativeRatings > 0
                  ? Math.max(
                      6,
                      Math.round((point.negativeRatings / maxRatings) * 100),
                    )
                  : 0;

              return (
                <div
                  key={point.day}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-36 w-full items-end justify-center gap-1.5">
                    <div
                      title={`${point.positiveRatings} avaliações úteis`}
                      style={{ height: `${posHeight}%` }}
                      className="w-4 rounded-t-xs bg-status-ok transition-all"
                    />
                    <div
                      title={`${point.negativeRatings} avaliações negativas`}
                      style={{ height: `${negHeight}%` }}
                      className="w-4 rounded-t-xs bg-destructive transition-all"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-medium text-foreground tabular-nums">
                      {point.day}
                    </p>
                    <p className="text-[10px] text-status-ok tabular-nums">
                      {point.positiveRatings}/{totalDayRatings} ({dayCsat}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-6">
          <h2 className="font-heading text-base font-semibold text-foreground">
            Pesquisas sem Resultados
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Demandas detectadas sem correspondência no catálogo atual
          </p>

          <div className="mt-4 divide-y divide-border">
            {analytics.zeroResultQueries.length === 0 ? (
              <p className="py-6 text-xs text-muted-foreground">
                Nenhuma pesquisa sem resultado registrada.
              </p>
            ) : (
              analytics.zeroResultQueries.map((item) => (
                <div
                  key={item.query}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">
                      “{item.query}”
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                      Última ocorrência: {formatShortDateTime(item.lastSeenAt)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-medium text-status-untested tabular-nums">
                    {item.count}x
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Quality Feedbacks + Top Intents */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Feedbacks de Qualidade
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Avaliações enviadas pelos usuários durante o uso
              </p>
            </div>
            <span className="text-xs font-medium text-status-ok tabular-nums">
              {formatNumber(analytics.helpfulResponsesCount)} úteis
            </span>
          </div>

          <div className="mt-4 divide-y divide-border">
            {analytics.recentFeedbacks.length === 0 ? (
              <p className="py-6 text-xs text-muted-foreground">
                Nenhuma avaliação registrada ainda.
              </p>
            ) : (
              analytics.recentFeedbacks.slice(0, 5).map((fb) => (
                <div key={fb.id} className="py-3 first:pt-1 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {CONTEXT_LABELS[fb.context]}
                      {fb.reason ? ` · ${fb.reason}` : ''}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-foreground tabular-nums shrink-0">
                      <Star className="h-3 w-3 fill-status-untested text-status-untested" />
                      {fb.rating}/5
                    </span>
                  </div>
                  {fb.comment && (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      “{fb.comment}”
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                    {formatShortDateTime(fb.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-border bg-card lg:col-span-2">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-heading text-base font-semibold text-foreground">
              Principais Intenções de Compra Identificadas
            </h2>
            <p className="text-xs text-muted-foreground">
              Agrupamento semântico das necessidades e índice de satisfação por jornada
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Intenção do Consumidor</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 text-right font-medium">Consultas</th>
                  <th className="px-4 py-3 text-right font-medium">CTR</th>
                  <th className="px-6 py-3 text-right font-medium">Satisfação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.topIntents.map((intent) => (
                  <tr key={intent.intent} className="hover:bg-muted/25">
                    <td className="px-6 py-3.5 font-medium text-foreground">
                      {intent.intent}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {intent.category}
                    </td>
                    <td className="px-4 py-3.5 text-right text-foreground tabular-nums">
                      {formatNumber(intent.queries)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-foreground tabular-nums">
                      {intent.ctrPercent.toFixed(1)}%
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-brand-secondary tabular-nums">
                      {intent.satisfactionPercent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
