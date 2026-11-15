"use client";

import { CheckCircle2, Database, RefreshCw, Search, Webhook } from 'lucide-react';
import { useState } from 'react';
import type {
  CommerceProvider,
  IntegrationConfig,
  PineconeQuotaMode,
  Product,
  Tenant,
} from '@/experience/commerce-types';
import { integrationProviderSpec } from '@/experience/integration-providers';
import { formatBRL, formatShortDateTime } from '@/frontend/lib/format';

function initialFields(provider: CommerceProvider) {
  const spec = integrationProviderSpec(provider);
  return Object.fromEntries(
    (spec?.fields ?? []).map((field) => [field.key, field.defaultValue ?? ""]),
  );
}

interface DashboardIntegrationsProps {
  activeTenant: Tenant;
  products: Product[];
  onTenantUpdated: (tenant: Tenant) => void;
}

function DashboardIntegrationsForm({
  activeTenant,
  products,
  onTenantUpdated,
}: DashboardIntegrationsProps) {
  const [selectedProvider, setSelectedProvider] = useState<CommerceProvider>(
    activeTenant.integrations.find((i) => i.connected)?.provider ?? 'vtex',
  );
  const currentConfig: IntegrationConfig =
    activeTenant.integrations.find((i) => i.provider === selectedProvider) ??
    activeTenant.integrations[0];

  const [publicDomain, setPublicDomain] = useState(activeTenant.domain);
  const [fields, setFields] = useState<Record<string, string>>(() =>
    initialFields(selectedProvider),
  );
  const [webhookActive, setWebhookActive] = useState(currentConfig.webhookActive);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackOk, setFeedbackOk] = useState(true);
  const providerSpec = integrationProviderSpec(selectedProvider);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Pinecone state (token + index only when BYO)
  const [pineconeMode, setPineconeMode] = useState<PineconeQuotaMode>(
    activeTenant.pineconeConfig.mode,
  );
  const [pineconeIndex, setPineconeIndex] = useState(
    activeTenant.pineconeConfig.mode === 'customer-token'
      ? activeTenant.pineconeConfig.indexName
      : '',
  );
  const [pineconeToken, setPineconeToken] = useState('');
  const [savingPinecone, setSavingPinecone] = useState(false);
  const [pineconeFeedback, setPineconeFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const handleSelectProvider = (provider: CommerceProvider) => {
    setSelectedProvider(provider);
    const found = activeTenant.integrations.find((i) => i.provider === provider);
    setFields(initialFields(provider));
    setWebhookActive(found?.webhookActive ?? true);
    setFeedback(null);
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/tenants/${activeTenant.id}/integrations/${selectedProvider}/sync`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicDomain: publicDomain.trim(),
            webhookActive,
            fields,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao sincronizar catálogo.');
      }
      onTenantUpdated(data.tenant);
      setFeedbackOk(true);
      setFeedback(
        `${data.syncedCount} produtos importados do catálogo ${currentConfig.label} para o banco.`,
      );
      setFields(initialFields(selectedProvider));
    } catch (err) {
      setFeedbackOk(false);
      setFeedback(
        err instanceof Error ? err.message : 'Falha ao sincronizar provedor.',
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleSavePinecone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPinecone(true);
    setPineconeFeedback(null);
    try {
      const res = await fetch(`/api/tenants/${activeTenant.id}/pinecone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: pineconeMode,
          indexName: pineconeMode === 'customer-token' ? pineconeIndex : undefined,
          accessToken: pineconeMode === 'customer-token' ? pineconeToken : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao salvar configuração do Pinecone.');
      }
      onTenantUpdated(data.tenant);
      setPineconeToken('');
      setPineconeFeedback({
        ok: true,
        message:
          pineconeMode === 'crychat-quota'
            ? `Cota gerenciada do CryChat ativada (${data.indexedCount} vetores sincronizados).`
            : `Índice "${pineconeIndex}" conectado com sucesso (${data.indexedCount} vetores sincronizados).`,
      });
    } catch (err) {
      setPineconeFeedback({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Erro ao atualizar configuração vetorial.',
      });
    } finally {
      setSavingPinecone(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="border-b border-border pb-5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Integrações e Infraestrutura Vetorial
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Conecte o catálogo da sua loja virtual e escolha usar a cota do CryChat ou conectar seu próprio token e index no Pinecone.
        </p>
      </div>

      {/* Section 1: E-commerce Platforms */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground">
            Plataforma de E-commerce
          </h2>
          {activeTenant.integrations.map((item) => {
            const selected = item.provider === selectedProvider;
            return (
              <button
                key={item.provider}
                type="button"
                onClick={() => handleSelectProvider(item.provider)}
                className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition-colors ${
                  selected
                    ? 'border-primary bg-accent/40'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.connected
                      ? item.storeDomain
                      : 'Aguardando configuração'}
                  </p>
                </div>
                <span
                  className={`ml-3 shrink-0 text-xs font-medium ${
                    item.connected ? 'text-status-ok' : 'text-status-missing'
                  }`}
                >
                  {item.connected ? 'Conectado' : 'Inativo'}
                </span>
              </button>
            );
          })}
        </div>

        <form
          onSubmit={handleSync}
          className="rounded-md border border-border bg-card p-6 lg:col-span-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Credenciais · {currentConfig.label}
              </h2>
              <p className="text-xs text-muted-foreground">
                Sincronização de produtos, variantes, preços e disponibilidade por tenant
              </p>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              Última sincronização: {formatShortDateTime(currentConfig.lastSyncAt)}
            </span>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {providerSpec?.summary}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="public-domain"
                className="block text-xs font-medium text-foreground"
              >
                Domínio público da loja (opcional)
              </label>
              <input
                id="public-domain"
                type="text"
                value={publicDomain}
                onChange={(e) => setPublicDomain(e.target.value)}
                placeholder="www.minhaloja.com.br"
                className="mt-1.5 h-9 w-full rounded-md border border-border bg-input px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            {(providerSpec?.fields ?? []).map((field) => (
              <div key={field.key}>
                <label
                  htmlFor={`cred-${field.key}`}
                  className="block text-xs font-medium text-foreground"
                >
                  {field.label}
                </label>
                <input
                  id={`cred-${field.key}`}
                  type={field.secret ? "password" : "text"}
                  value={fields[field.key] ?? ""}
                  onChange={(e) =>
                    setFields((current) => ({
                      ...current,
                      [field.key]: e.target.value,
                    }))
                  }
                  placeholder={
                    field.secret
                      ? currentConfig.appKeyMasked || field.placeholder
                      : field.placeholder
                  }
                  autoComplete="off"
                  className="mt-1.5 h-9 w-full rounded-md border border-border bg-input px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
            <label className="flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={webhookActive}
                onChange={(e) => setWebhookActive(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Webhook className="h-3.5 w-3.5 text-muted-foreground" />
              Atualização incremental por webhook
            </label>

            <button
              type="submit"
              disabled={syncing}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Salvar e Sincronizar Catálogo'}
            </button>
          </div>

          {feedback && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-xs text-foreground ${
                feedbackOk
                  ? "border-status-ok/40 bg-status-ok/10"
                  : "border-destructive/50 bg-destructive/10"
              }`}
            >
              <CheckCircle2
                className={`h-4 w-4 shrink-0 ${feedbackOk ? "text-status-ok" : "text-destructive"}`}
              />
              <span>{feedback}</span>
            </div>
          )}
        </form>
      </div>

      {/* Section 2: Pinecone Vector Database (Quota vs Token + Index only) */}
      <form
        onSubmit={handleSavePinecone}
        className="rounded-md border border-border bg-card p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-4 w-4 shrink-0 text-link" />
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Banco Vetorial — Pinecone
              </h2>
              <p className="text-xs text-muted-foreground">
                Use a cota gerenciada pelo CryChat ou informe seu token de acesso e o nome do index.
              </p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {activeTenant.pineconeConfig.vectorsCount} vetores sincronizados
          </span>
        </div>

        {/* Mode Selection Cards */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setPineconeMode('crychat-quota')}
            className={`rounded-md border p-4 text-left transition-colors ${
              pineconeMode === 'crychat-quota'
                ? 'border-primary bg-accent/40'
                : 'border-border bg-background hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-semibold text-foreground">
                Usar Cota Gerenciada do CryChat
              </span>
              <span className="text-xs font-medium text-brand-secondary">
                {pineconeMode === 'crychat-quota' ? 'Selecionado' : 'Incluído no plano'}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Infraestrutura gerenciada automaticamente pelo CryChat, sem necessidade de configurar chaves externas.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPineconeMode('customer-token')}
            className={`rounded-md border p-4 text-left transition-colors ${
              pineconeMode === 'customer-token'
                ? 'border-primary bg-accent/40'
                : 'border-border bg-background hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-semibold text-foreground">
                Usar Token Próprio do Pinecone
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {pineconeMode === 'customer-token' ? 'Selecionado' : 'Conta própria'}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Conecte sua própria conta informando apenas o token de acesso e o nome do index no Pinecone.
            </p>
          </button>
        </div>

        {/* Token + Index inputs ONLY when customer-token is selected */}
        {pineconeMode === 'customer-token' && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="pc-token"
                className="block text-xs font-medium text-foreground"
              >
                Token de Acesso Pinecone
              </label>
              <input
                id="pc-token"
                type="password"
                value={pineconeToken}
                onChange={(e) => setPineconeToken(e.target.value)}
                placeholder={
                  activeTenant.pineconeConfig.mode === 'customer-token'
                    ? activeTenant.pineconeConfig.tokenMasked
                    : 'pcsk_...'
                }
                className="mt-1.5 h-9 w-full rounded-md border border-border bg-input px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pc-index"
                className="block text-xs font-medium text-foreground"
              >
                Nome do Index
              </label>
              <input
                id="pc-index"
                type="text"
                value={pineconeIndex}
                onChange={(e) => setPineconeIndex(e.target.value)}
                placeholder="meu-ecommerce-index"
                className="mt-1.5 h-9 w-full rounded-md border border-border bg-input px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground tabular-nums">
            Última indexação: {formatShortDateTime(activeTenant.pineconeConfig.lastIndexedAt)}
          </span>
          <button
            type="submit"
            disabled={savingPinecone}
            className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {savingPinecone ? 'Aplicando Pinecone...' : 'Salvar Configuração Pinecone'}
          </button>
        </div>

        {pineconeFeedback && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-xs text-foreground ${
              pineconeFeedback.ok
                ? 'border-status-ok/40 bg-status-ok/10'
                : 'border-destructive/50 bg-destructive/10'
            }`}
          >
            <CheckCircle2
              className={`h-4 w-4 shrink-0 ${
                pineconeFeedback.ok ? 'text-status-ok' : 'text-destructive'
              }`}
            />
            <span>{pineconeFeedback.message}</span>
          </div>
        )}
      </form>

      {/* Section 3: Normalized Catalog & Vector Index Table */}
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              Catálogo Normalizado e Índice Vetorial
            </h2>
            <p className="text-xs text-muted-foreground">
              {products.length} SKUs sincronizados para {activeTenant.name}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Filtrar por SKU ou nome..."
              className="h-8 w-full rounded-md border border-border bg-input pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 text-right font-medium">Preço</th>
                <th className="px-4 py-3 text-right font-medium">Estoque</th>
                <th className="px-6 py-3 text-right font-medium">Vetorização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-xs text-muted-foreground"
                  >
                    Nenhum produto no banco desta loja. Conecte a plataforma e sincronize o catálogo.
                  </td>
                </tr>
              ) : null}
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-muted/25">
                  <td className="px-6 py-3 font-mono text-muted-foreground">
                    {p.sku}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.category}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground tabular-nums">
                    {formatBRL(p.price)}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground tabular-nums">
                    {p.stock} un.
                  </td>
                  <td className="px-6 py-3 text-right text-muted-foreground tabular-nums">
                    No catálogo · {formatShortDateTime(p.vectorIndexedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function DashboardIntegrations(props: DashboardIntegrationsProps) {
  return <DashboardIntegrationsForm key={props.activeTenant.id} {...props} />;
}
