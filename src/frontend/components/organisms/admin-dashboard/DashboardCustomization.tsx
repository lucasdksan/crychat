"use client";

import { CheckCircle2, Plus, Save } from 'lucide-react';
import { useState } from 'react';
import { productImageSrc } from '@/frontend/lib/product-images';
import type { Product, Tenant, VisualCustomization } from '@/experience/commerce-types';
import { formatBRL } from '@/frontend/lib/format';

interface DashboardCustomizationProps {
  activeTenant: Tenant;
  sampleProduct?: Product;
  onTenantUpdated: (tenant: Tenant) => void;
}

const COLOR_PRESETS = [
  { label: 'CryChat Violet', hex: '#8234e9' },
  { label: 'Emerald Signal', hex: '#02c793' },
  { label: 'Cobalt Studio', hex: '#3b82f6' },
  { label: 'Amber Warm', hex: '#f6ab00' },
];

function DashboardCustomizationForm({
  activeTenant,
  sampleProduct,
  onTenantUpdated,
}: DashboardCustomizationProps) {
  const [visualConfig, setVisualConfig] = useState<VisualCustomization>(
    activeTenant.visualConfig,
  );
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(null);
    try {
      const res = await fetch(`/api/tenants/${activeTenant.id}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visualConfig }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao salvar personalização.');
      }
      onTenantUpdated(data.tenant);
      setSavedNotice('Identidade visual salva e aplicada na vitrine.');
    } catch (err) {
      setSavedNotice(
        err instanceof Error ? err.message : 'Erro ao salvar tema.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Personalização Visual
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Ajuste cores de ação, bordas, layout dos cards e CSS customizado do CryChat para {activeTenant.name}.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Aplicando...' : 'Salvar Personalização'}
        </button>
      </div>

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-md border border-status-ok/40 bg-status-ok/10 px-4 py-3 text-xs text-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-status-ok" />
          <span>{savedNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Controls */}
        <section className="rounded-md border border-border bg-card p-6 space-y-5 lg:col-span-2">
          <div>
            <label className="block text-xs font-medium text-foreground">
              Cor Principal de Ação
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              {COLOR_PRESETS.map((preset) => {
                const active =
                  visualConfig.primaryColor.toLowerCase() ===
                  preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() =>
                      setVisualConfig((prev) => ({
                        ...prev,
                        primaryColor: preset.hex,
                      }))
                    }
                    className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                      active
                        ? 'border-foreground bg-muted text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: preset.hex }}
                      className="h-3 w-3 rounded-xs shrink-0"
                    />
                    {preset.label}
                  </button>
                );
              })}
              <input
                aria-label="Cor hexadecimal personalizada"
                type="color"
                value={visualConfig.primaryColor}
                onChange={(e) =>
                  setVisualConfig((prev) => ({
                    ...prev,
                    primaryColor: e.target.value,
                  }))
                }
                className="h-8 w-10 cursor-pointer rounded border border-border bg-background p-0.5"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="radius-range"
                className="font-medium text-foreground"
              >
                Arredondamento de Bordas
              </label>
              <span className="font-mono text-muted-foreground tabular-nums">
                {visualConfig.borderRadiusPx}px
              </span>
            </div>
            <input
              id="radius-range"
              type="range"
              min={0}
              max={14}
              value={visualConfig.borderRadiusPx}
              onChange={(e) =>
                setVisualConfig((prev) => ({
                  ...prev,
                  borderRadiusPx: Number(e.target.value),
                }))
              }
              className="mt-2 w-full accent-primary"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="card-density"
                className="block text-xs font-medium text-foreground"
              >
                Layout dos Cards
              </label>
              <select
                id="card-density"
                value={visualConfig.cardDensity}
                onChange={(e) =>
                  setVisualConfig((prev) => ({
                    ...prev,
                    cardDensity: e.target.value as VisualCustomization['cardDensity'],
                  }))
                }
                className="mt-1.5 h-9 w-full rounded-md border border-border bg-input px-3 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="detalhado">Detalhado (com descrição)</option>
                <option value="compacto">Compacto (foco em preço/spec)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="widget-pos"
                className="block text-xs font-medium text-foreground"
              >
                Posição do Widget (Classic)
              </label>
              <select
                id="widget-pos"
                value={visualConfig.widgetPosition}
                onChange={(e) =>
                  setVisualConfig((prev) => ({
                    ...prev,
                    widgetPosition: e.target
                      .value as VisualCustomization['widgetPosition'],
                  }))
                }
                className="mt-1.5 h-9 w-full rounded-md border border-border bg-input px-3 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="bottom-right">Inferior direito</option>
                <option value="bottom-left">Inferior esquerdo</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="custom-css"
              className="block text-xs font-medium text-foreground"
            >
              Estilização Personalizada (CSS)
            </label>
            <textarea
              id="custom-css"
              rows={5}
              value={visualConfig.customCss}
              onChange={(e) =>
                setVisualConfig((prev) => ({
                  ...prev,
                  customCss: e.target.value,
                }))
              }
              className="mt-1.5 w-full rounded-md border border-border bg-input p-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </section>

        {/* Live Card Preview */}
        <section className="rounded-md border border-border bg-card p-6">
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Pré-visualização do Card
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Atualizada em tempo real
          </p>

          {sampleProduct && (
            <div
              style={{ borderRadius: `${visualConfig.borderRadiusPx}px` }}
              className="mt-4 overflow-hidden border border-border bg-background"
            >
              <div className="aspect-[4/3] w-full bg-muted">
                <img
                  src={productImageSrc(sampleProduct)}
                  alt={sampleProduct.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">
                  {sampleProduct.brand} · {sampleProduct.category}
                </p>
                <p className="mt-1 font-heading text-sm font-semibold text-foreground">
                  {sampleProduct.name}
                </p>
                {visualConfig.cardDensity === 'detalhado' && (
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                    {sampleProduct.shortDescription}
                  </p>
                )}
                <p className="mt-3 font-heading text-base font-semibold text-foreground tabular-nums">
                  {formatBRL(sampleProduct.price)}
                </p>
                <button
                  type="button"
                  style={{
                    backgroundColor: visualConfig.primaryColor,
                    borderRadius: `${visualConfig.borderRadiusPx}px`,
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </form>
  );
}

export function DashboardCustomization(props: DashboardCustomizationProps) {
  return (
    <DashboardCustomizationForm key={props.activeTenant.id} {...props} />
  );
}
