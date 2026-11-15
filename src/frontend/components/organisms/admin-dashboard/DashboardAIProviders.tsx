"use client";

import { CheckCircle2, Save } from 'lucide-react';
import { useState } from 'react';
import type {
  AIConfig,
  AIProviderId,
  AIQuotaMode,
  ExperienceMode,
  Tenant,
} from '@/backend/modules/experience/domain/types';
import { AiProviderForm } from '@/frontend/components/organisms/ai-provider-form';
import { formatNumber } from '@/frontend/lib/format';

interface DashboardAIProvidersProps {
  activeTenant: Tenant;
  onTenantUpdated: (tenant: Tenant) => void;
}

const PROVIDER_CATALOG: {
  id: AIProviderId;
  name: string;
  vendor: string;
  description: string;
  models: { id: string; label: string }[];
}[] = [
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    vendor: 'Google DeepMind',
    description: 'Baixa latência com raciocínio multimodal nativo para busca por texto e imagem.',
    models: [
      { id: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen (Recomendado)' },
      { id: 'gemini-4-argon', label: 'Gemini 4 Argon (Alta complexidade)' },
      { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite (Ultra rápido)' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    vendor: 'OpenAI',
    description: 'Modelos GPT para orquestração conversacional e chamadas de ferramentas.',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'o3-mini', label: 'o3-mini (Raciocínio)' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    vendor: 'Anthropic',
    description: 'Respostas consultivas com forte aderência a instruções de tom de marca.',
    models: [
      { id: 'claude-sonnet-4', label: 'Claude Sonnet 4' },
      { id: 'claude-haiku-3.5', label: 'Claude Haiku 3.5' },
    ],
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    vendor: 'Groq LPU',
    description: 'Inferência de altíssima velocidade com modelos Llama abertos.',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    vendor: 'Mistral',
    description: 'Alternativa europeia otimizada para catálogos multilíngues.',
    models: [
      { id: 'mistral-large-latest', label: 'Mistral Large' },
      { id: 'mistral-small-latest', label: 'Mistral Small' },
    ],
  },
];

function DashboardAIProvidersForm({
  activeTenant,
  onTenantUpdated,
}: DashboardAIProvidersProps) {
  const [defaultMode, setDefaultMode] = useState<ExperienceMode>(
    activeTenant.defaultMode,
  );
  const [aiConfig, setAiConfig] = useState<AIConfig>(activeTenant.aiConfig);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const activeProviderMeta =
    PROVIDER_CATALOG.find((p) => p.id === aiConfig.provider) ??
    PROVIDER_CATALOG[0];

  const handleSelectProvider = (providerId: AIProviderId) => {
    const meta = PROVIDER_CATALOG.find((p) => p.id === providerId);
    setAiConfig((prev) => ({
      ...prev,
      provider: providerId,
      model: meta?.models[0]?.id ?? prev.model,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(null);
    try {
      const res = await fetch(`/api/tenants/${activeTenant.id}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultMode,
          aiConfig: {
            provider: aiConfig.provider,
            quotaMode: aiConfig.quotaMode,
            model: aiConfig.model,
            tone: aiConfig.tone,
            temperature: aiConfig.temperature,
            maxRecommendations: aiConfig.maxRecommendations,
            monthlyTokenLimit: aiConfig.monthlyTokenLimit,
            welcomeMessage: aiConfig.welcomeMessage,
            starterPrompts: aiConfig.starterPrompts,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao salvar provedor de IA.');
      }
      onTenantUpdated(data.tenant);
      setSavedNotice('Configuração de provedor e comportamento salva.');
    } catch (err) {
      setSavedNotice(
        err instanceof Error ? err.message : 'Erro ao atualizar provedor.',
      );
    } finally {
      setSaving(false);
    }
  };

  const tokenPercent = Math.min(
    100,
    Math.round(
      (aiConfig.tokensUsed / Math.max(aiConfig.monthlyTokenLimit, 1)) * 100,
    ),
  );

  return (
    <div className="space-y-12">
    <form onSubmit={handleSave} className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Provedores de Inteligência Artificial
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Selecione o provedor, modelo de linguagem e perfil do vendedor digital sem alterar a lógica da loja.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </button>
      </div>

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-md border border-status-ok/40 bg-status-ok/10 px-4 py-3 text-xs text-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-status-ok" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Multi-provider selector grid */}
      <div>
        <h2 className="mb-3 text-xs font-semibold text-muted-foreground">
          Provedores Disponíveis
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {PROVIDER_CATALOG.map((provider) => {
            const selected = aiConfig.provider === provider.id;
            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => handleSelectProvider(provider.id)}
                className={`flex flex-col rounded-md border p-4 text-left transition-colors ${
                  selected
                    ? 'border-primary bg-accent/40'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <span className="text-[11px] text-muted-foreground">
                  {provider.vendor}
                </span>
                <span className="mt-0.5 font-heading text-sm font-semibold text-foreground">
                  {provider.name}
                </span>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                  {provider.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model, Quota & Behavior Configuration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-base font-semibold text-foreground">
            Modelo e Modo de Cota · {activeProviderMeta.name}
          </h2>

          <div>
            <label
              htmlFor="ai-model-select"
              className="block text-xs font-medium text-foreground"
            >
              Modelo Ativo
            </label>
            <select
              id="ai-model-select"
              value={aiConfig.model}
              onChange={(e) =>
                setAiConfig((prev) => ({ ...prev, model: e.target.value }))
              }
              className="mt-1.5 h-9 w-full rounded-md border border-border bg-input px-3 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {activeProviderMeta.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">
              Modelo de Faturamento e Cota
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {(
                [
                  {
                    id: 'crychat-managed',
                    title: 'Gerenciado pelo CryChat',
                    desc: 'Usa a cota mensal incluída no seu plano.',
                  },
                  {
                    id: 'customer-byok',
                    title: 'Conta Própria (BYOK)',
                    desc: 'Usa a organização configurada pelo lojista.',
                  },
                ] as { id: AIQuotaMode; title: string; desc: string }[]
              ).map((option) => {
                const active = aiConfig.quotaMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      setAiConfig((prev) => ({ ...prev, quotaMode: option.id }))
                    }
                    className={`rounded-md border p-3 text-left transition-colors ${
                      active
                        ? 'border-primary bg-accent/40'
                        : 'border-border bg-background hover:border-primary/50'
                    }`}
                  >
                    <p className="text-xs font-semibold text-foreground">
                      {option.title}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {option.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="ai-temp" className="font-medium text-foreground">
                  Temperatura
                </label>
                <span className="font-mono text-muted-foreground tabular-nums">
                  {aiConfig.temperature.toFixed(1)}
                </span>
              </div>
              <input
                id="ai-temp"
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={aiConfig.temperature}
                onChange={(e) =>
                  setAiConfig((prev) => ({
                    ...prev,
                    temperature: Number(e.target.value),
                  }))
                }
                className="mt-2 w-full accent-primary"
              />
            </div>

            <div>
              <label
                htmlFor="max-recs"
                className="block text-xs font-medium text-foreground"
              >
                Recomendações por Resposta
              </label>
              <select
                id="max-recs"
                value={aiConfig.maxRecommendations}
                onChange={(e) =>
                  setAiConfig((prev) => ({
                    ...prev,
                    maxRecommendations: Number(e.target.value),
                  }))
                }
                className="mt-1.5 h-9 w-full rounded-md border border-border bg-input px-3 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value={2}>Até 2 produtos</option>
                <option value={3}>Até 3 produtos</option>
                <option value={4}>Até 4 produtos</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Consumo mensal de tokens</span>
              <span className="font-medium text-foreground tabular-nums">
                {formatNumber(aiConfig.tokensUsed)} /{' '}
                {formatNumber(aiConfig.monthlyTokenLimit)} ({tokenPercent}%)
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background">
              <div
                style={{ width: `${tokenPercent}%` }}
                className="h-full bg-primary"
              />
            </div>
          </div>
        </section>

        <section className="rounded-md border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-base font-semibold text-foreground">
            Comportamento do Vendedor Digital
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="ai-tone"
                className="block text-xs font-medium text-foreground"
              >
                Perfil de Atendimento
              </label>
              <select
                id="ai-tone"
                value={aiConfig.tone}
                onChange={(e) =>
                  setAiConfig((prev) => ({
                    ...prev,
                    tone: e.target.value as AIConfig['tone'],
                  }))
                }
                className="mt-1.5 h-9 w-full rounded-md border border-border bg-input px-3 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Consultivo">Consultivo (Especialista)</option>
                <option value="Técnico">Técnico (Especificações)</option>
                <option value="Objetivo">Objetivo (Direto ao ponto)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="default-mode"
                className="block text-xs font-medium text-foreground"
              >
                Modalidade Padrão na Loja
              </label>
              <select
                id="default-mode"
                value={defaultMode}
                onChange={(e) =>
                  setDefaultMode(e.target.value as ExperienceMode)
                }
                className="mt-1.5 h-9 w-full rounded-md border border-border bg-input px-3 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="hybrid">Hybrid (Vitrine + Chat Lateral)</option>
                <option value="discover">Discover (Busca Inteligente)</option>
                <option value="classic">Classic (Widget Flutuante)</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="welcome-message"
              className="block text-xs font-medium text-foreground"
            >
              Mensagem Inicial do Assistente
            </label>
            <textarea
              id="welcome-message"
              rows={4}
              value={aiConfig.welcomeMessage}
              onChange={(e) =>
                setAiConfig((prev) => ({
                  ...prev,
                  welcomeMessage: e.target.value,
                }))
              }
              className="mt-1.5 w-full rounded-md border border-border bg-input p-3 text-xs leading-relaxed text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="starter-prompts"
              className="block text-xs font-medium text-foreground"
            >
              Sugestões Iniciais (uma por linha)
            </label>
            <textarea
              id="starter-prompts"
              rows={4}
              value={aiConfig.starterPrompts.join('\n')}
              onChange={(e) =>
                setAiConfig((prev) => ({
                  ...prev,
                  starterPrompts: e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
              className="mt-1.5 w-full rounded-md border border-border bg-input p-3 text-xs leading-relaxed text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </section>
      </div>
    </form>

    <section
      className="rounded-md border border-border bg-card p-6"
      aria-labelledby="byok-heading"
    >
      <h2
        id="byok-heading"
        className="font-heading text-lg font-semibold text-foreground"
      >
        Chaves de API (runtime CryChat)
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Salva no banco via Prisma (BYOK). Complementa a configuração visual acima,
        usada pelo motor de chat e embeddings em produção.
      </p>
      <div className="mt-5">
        <AiProviderForm storeId={activeTenant.id} />
      </div>
    </section>
    </div>
  );
}

export function DashboardAIProviders(props: DashboardAIProvidersProps) {
  return <DashboardAIProvidersForm key={props.activeTenant.id} {...props} />;
}
