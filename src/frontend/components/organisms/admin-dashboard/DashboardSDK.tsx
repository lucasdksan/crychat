"use client";

import { Check, Code2, Copy } from 'lucide-react';
import { useState } from 'react';
import type { Tenant, VisualCustomization } from '@/experience/commerce-types';

interface DashboardSDKProps {
  activeTenant: Tenant;
  onTenantUpdated: (tenant: Tenant) => void;
  onOpenExperience: () => void;
}

const TARGET_OPTIONS: {
  id: VisualCustomization['installTarget'];
  title: string;
  description: string;
}[] = [
  {
    id: 'hybrid-page',
    title: 'Página de Descoberta Híbrida',
    description:
      'Substitui a página de busca da loja pela experiência split-view com vitrine + assistente lateral.',
  },
  {
    id: 'floating-widget',
    title: 'Widget Flutuante (Classic)',
    description:
      'Adiciona o assistente conversacional em todas as páginas sem alterar o layout da loja.',
  },
  {
    id: 'search-bar',
    title: 'Interceptar Barra de Pesquisa (Discover)',
    description:
      'Conecta o campo de pesquisa existente ao motor semântico e de intenção do CryChat.',
  },
  {
    id: 'custom-slot',
    title: 'Área Específica via Contêiner',
    description:
      'Monta os componentes do CryChat dentro de um seletor CSS dedicado na vitrine.',
  },
];

export function DashboardSDK({
  activeTenant,
  onTenantUpdated,
  onOpenExperience,
}: DashboardSDKProps) {
  const [copiedKey, setCopiedKey] = useState<'script' | 'react' | null>(null);
  const [savingTarget, setSavingTarget] = useState(false);

  const installTarget = activeTenant.visualConfig.installTarget;

  const handleSelectTarget = async (
    nextTarget: VisualCustomization['installTarget'],
  ) => {
    setSavingTarget(true);
    try {
      const res = await fetch(`/api/tenants/${activeTenant.id}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualConfig: { installTarget: nextTarget },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onTenantUpdated(data.tenant);
      }
    } finally {
      setSavingTarget(false);
    }
  };

  const scriptSnippet = `<!-- CryChat Intelligent Commerce SDK -->
<script>
  window.CryChatConfig = {
    tenantId: "${activeTenant.id}",
    storeSlug: "${activeTenant.slug}",
    mode: "${activeTenant.defaultMode}",
    mountTarget: "${installTarget}",
    theme: {
      primaryColor: "${activeTenant.visualConfig.primaryColor}",
      borderRadius: "${activeTenant.visualConfig.borderRadiusPx}px",
      position: "${activeTenant.visualConfig.widgetPosition}"
    }
  };
</script>
<script async src="https://cdn.crychat.io/sdk/v1/crychat.js"></script>`;

  const reactSnippet = `import { CryChatProvider, CryChatMount } from '@crychat/sdk-react';

export function StorefrontIntegration() {
  return (
    <CryChatProvider
      tenantId="${activeTenant.id}"
      mode="${activeTenant.defaultMode}"
      accentColor="${activeTenant.visualConfig.primaryColor}"
    >
      <CryChatMount target="${installTarget}" />
    </CryChatProvider>
  );
}`;

  const handleCopy = async (kind: 'script' | 'react', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(kind);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Instalação do Script e SDK
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Incorpore o CryChat em {activeTenant.domain} sem reconstruir o frontend da loja.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenExperience}
          className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Simular Experiência
        </button>
      </div>

      {/* Placement Options */}
      <div>
        <h2 className="mb-3 text-xs font-semibold text-muted-foreground">
          Onde implementar o CryChat em {activeTenant.name}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {TARGET_OPTIONS.map((option) => {
            const active = installTarget === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={savingTarget}
                onClick={() => handleSelectTarget(option.id)}
                className={`rounded-md border p-4 text-left transition-colors ${
                  active
                    ? 'border-primary bg-accent/40'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <p className="font-heading text-sm font-semibold text-foreground">
                  {option.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Snippets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-link" />
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Tag Universal JavaScript
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('script', scriptSnippet)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/60"
            >
              {copiedKey === 'script' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-status-ok" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto bg-background p-5 font-mono text-xs leading-relaxed text-foreground">
            <code>{scriptSnippet}</code>
          </pre>
        </div>

        <div className="overflow-hidden rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-brand-secondary" />
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Componente React / Next.js Headless
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('react', reactSnippet)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/60"
            >
              {copiedKey === 'react' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-status-ok" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto bg-background p-5 font-mono text-xs leading-relaxed text-foreground">
            <code>{reactSnippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
