"use client";

import {
  BarChart3,
  Bot,
  Code2,
  ExternalLink,
  Layers,
  LogOut,
  Palette,
  Plus,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { signOutAction } from '@/backend/controllers/auth.controller';
import type { Tenant } from '@/backend/modules/experience/domain/types';
import { BrandLogo } from '@/frontend/components/atoms/brand-logo';
import { formatNumber } from '@/frontend/lib/format';

export type DashboardSection =
  | 'analytics'
  | 'integrations'
  | 'ai-providers'
  | 'customization'
  | 'sdk'
  | 'experience';

interface SaasSidebarProps {
  tenants: Tenant[];
  activeTenant: Tenant;
  activeSection: DashboardSection;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectTenant: (tenantId: string) => void;
  onSelectSection: (section: DashboardSection) => void;
}

const NAV_GROUPS: {
  label: string;
  items: { id: Exclude<DashboardSection, 'experience'>; label: string; icon: typeof BarChart3 }[];
}[] = [
  {
    label: 'Operação',
    items: [
      { id: 'analytics', label: 'Métricas', icon: BarChart3 },
      { id: 'integrations', label: 'Integrações', icon: Layers },
    ],
  },
  {
    label: 'Inteligência & Marca',
    items: [
      { id: 'ai-providers', label: 'Provedores IA', icon: Bot },
      { id: 'customization', label: 'Personalização', icon: Palette },
    ],
  },
  {
    label: 'Implementação',
    items: [{ id: 'sdk', label: 'Instalação SDK', icon: Code2 }],
  },
];

export function SaasSidebar({
  tenants,
  activeTenant,
  activeSection,
  mobileOpen,
  onCloseMobile,
  onSelectTenant,
  onSelectSection,
}: SaasSidebarProps) {
  const connectedProvider = activeTenant.integrations.find((i) => i.connected);
  const tokenPercent = Math.min(
    100,
    Math.round(
      (activeTenant.aiConfig.tokensUsed /
        Math.max(activeTenant.aiConfig.monthlyTokenLimit, 1)) *
        100,
    ),
  );

  const sidebarContent = (
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand Lockup */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <button
          type="button"
          onClick={() => {
            onSelectSection('analytics');
            onCloseMobile();
          }}
          className="flex items-center gap-2.5 text-left whitespace-nowrap focus-visible:outline-none"
        >
          <BrandLogo size="sm" />
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Fechar menu"
          className="rounded p-1 text-muted-foreground hover:text-foreground lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tenant Switcher */}
      <div className="border-b border-sidebar-border p-3.5">
        <label
          htmlFor="sidebar-tenant-select"
          className="block text-[11px] font-medium text-muted-foreground"
        >
          Loja ativa
        </label>
        <select
          id="sidebar-tenant-select"
          value={activeTenant.id}
          onChange={(e) => onSelectTenant(e.target.value)}
          className="mt-1.5 h-8 w-full rounded-md border border-sidebar-border bg-background px-2.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
          {connectedProvider ? connectedProvider.label : 'Sem ERP'} ·{' '}
          {activeTenant.domain}
        </p>
        <Link
          href="/admin/lojas/nova"
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-link hover:underline"
        >
          <Plus className="h-3 w-3" />
          Conectar loja
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav aria-label="Menu do painel SaaS" className="flex-1 space-y-5 overflow-y-auto p-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2.5 text-[11px] font-medium text-muted-foreground">
              {group.label}
            </p>
            <div className="mt-1.5 space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectSection(item.id);
                      onCloseMobile();
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-sidebar-accent text-foreground'
                        : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? 'text-link' : 'text-muted-foreground'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Quota Summary & Live Storefront Launch */}
      <div className="border-t border-sidebar-border p-3.5 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Consumo IA mensal</span>
            <span className="font-medium text-foreground tabular-nums">
              {tokenPercent}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
            <div
              style={{ width: `${tokenPercent}%` }}
              className="h-full bg-primary"
            />
          </div>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Pinecone:{' '}
            {activeTenant.pineconeConfig.mode === 'crychat-quota'
              ? 'Cota CryChat'
              : 'Token próprio'}{' '}
            · {formatNumber(activeTenant.pineconeConfig.vectorsCount)} vetores
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            onSelectSection('experience');
            onCloseMobile();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir Vitrine / Chat
        </button>

        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-sidebar-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair da conta
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu lateral"
          className="fixed inset-0 z-50 flex bg-black/65 lg:hidden"
        >
          {sidebarContent}
          <button
            type="button"
            aria-label="Fechar menu lateral"
            onClick={onCloseMobile}
            className="flex-1"
          />
        </div>
      )}
    </>
  );
}
