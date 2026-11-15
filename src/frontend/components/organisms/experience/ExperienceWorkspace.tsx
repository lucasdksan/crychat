"use client";

import {
  Camera,
  GitCompare,
  MessageSquare,
  PanelRightOpen,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CartItem,
  ChatMessage,
  ExperienceMode,
  Product,
  ProductCategory,
  SearchFilters,
  Tenant,
} from '@/experience/commerce-types';
import { fileToBase64, formatBRL } from '@/frontend/lib/format';
import { AssistantPanel } from './AssistantPanel';
import { CartDrawer } from './CartDrawer';
import { ComparisonModal } from './ComparisonModal';
import { ProductCard } from './ProductCard';
import { ProductDetailDrawer } from './ProductDetailDrawer';
import { QualitySurveyCard } from './QualitySurveyCard';

interface ExperienceWorkspaceProps {
  tenants: Tenant[];
  activeTenant: Tenant;
  products: Product[];
  onSelectTenant: (tenantId: string) => void;
  onChangeMode: (mode: ExperienceMode) => void;
  onRecordEvent: (
    type:
      | 'product_view'
      | 'recommendation_click'
      | 'comparison'
      | 'conversation_start',
  ) => void;
  onSubmitFeedback: (payload: {
    rating: number;
    helpful: boolean;
    context: 'chat' | 'busca' | 'comparacao';
    reason?: string;
    comment?: string;
  }) => Promise<void> | void;
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  category: 'Todos',
  minRamGb: null,
  maxPrice: null,
  brand: 'Todas',
  sortBy: 'relevance',
};

const CATEGORIES: (ProductCategory | 'Todos')[] = [
  'Todos',
  'Notebooks',
  'Smartphones',
  'Áudio',
  'Monitores',
];

function experienceCatalogKey(products: Product[]) {
  return products.map((p) => p.id).join("\u0001");
}

function ExperienceWorkspaceInner({
  tenants,
  activeTenant,
  products,
  onSelectTenant,
  onChangeMode,
  onRecordEvent,
  onSubmitFeedback,
}: ExperienceWorkspaceProps) {
  const [mode, setMode] = useState<ExperienceMode>(activeTenant.defaultMode);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>(products);
  const [intentSignals, setIntentSignals] = useState<string[]>([]);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  // Hybrid split pane state
  const [assistantWidth, setAssistantWidth] = useState<number>(380);
  const [assistantCollapsed, setAssistantCollapsed] = useState<boolean>(false);
  const [mobileChatOpen, setMobileChatOpen] = useState<boolean>(false);
  const [classicWidgetOpen, setClassicWidgetOpen] = useState<boolean>(false);
  const resizingRef = useRef(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Discover quality survey state
  const [discoverSurveyOpen, setDiscoverSurveyOpen] = useState(false);

  // Comparison, PDP, Cart
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [visualSearchStatus, setVisualSearchStatus] = useState<string | null>(null);
  const searchFileRef = useRef<HTMLInputElement>(null);

  const productsById = useMemo(() => {
    const map: Record<string, Product> = {};
    for (const p of products) map[p.id] = p;
    return map;
  }, [products]);

  const runSearch = useCallback(
    async (nextFilters: SearchFilters, inferIntent: boolean) => {
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: activeTenant.id,
            filters: nextFilters,
            inferIntentFromQuery: inferIntent,
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          products: Product[];
          parsedIntent: {
            correctedQuery: string | null;
            intentSignals: string[];
          };
          effectiveFilters: SearchFilters;
        };
        setVisibleProducts(data.products);
        setIntentSignals(data.parsedIntent.intentSignals);
        setCorrectedQuery(data.parsedIntent.correctedQuery);
        if (inferIntent) {
          setFilters(data.effectiveFilters);
        }
        if (nextFilters.query.trim().length > 2) {
          setDiscoverSurveyOpen(true);
        }
      } catch {
        // Keep current visible list on transient error
      }
    },
    [activeTenant.id],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const next = Math.min(540, Math.max(300, window.innerWidth - e.clientX));
      setAssistantWidth(next);
    };
    const onMouseUp = () => {
      resizingRef.current = false;
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleModeSwitch = (nextMode: ExperienceMode) => {
    setMode(nextMode);
    onChangeMode(nextMode);
  };

  const handleFilterChange = (patch: Partial<SearchFilters>, inferIntent = false) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setVisualSearchStatus(null);
    runSearch(next, inferIntent);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setHighlightedIds([]);
    setIntentSignals([]);
    setCorrectedQuery(null);
    setVisualSearchStatus(null);
    setDiscoverSurveyOpen(false);
    runSearch(DEFAULT_FILTERS, false);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setChatLoading(true);
    setChatError(null);

    if (messages.length === 0) {
      onRecordEvent('conversation_start');
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenant.id,
          message: text,
          currentFilters: filters,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao consultar assistente de IA.');
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        recommendedProductIds: data.recommendedProductIds,
        compareProductIds: data.compareProductIds,
        appliedFilters: data.appliedFilters,
        suggestedFollowUps: data.suggestedFollowUps,
        escalatedToHuman: data.escalatedToHuman,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.appliedFilters && Object.keys(data.appliedFilters).length > 0) {
        const mergedFilters: SearchFilters = {
          ...filters,
          ...data.appliedFilters,
        };
        setFilters(mergedFilters);
        await runSearch(mergedFilters, false);
      }

      if (data.recommendedProductIds?.length) {
        setHighlightedIds(data.recommendedProductIds);
      }

      if (data.compareProductIds?.length >= 2) {
        setCompareIds(data.compareProductIds);
        setComparisonOpen(true);
        onRecordEvent('comparison');
      }
    } catch (err) {
      setChatError(
        err instanceof Error
          ? err.message
          : 'Erro de comunicação com o motor de IA.',
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleVoteMessage = async (
    messageId: string,
    vote: 'helpful' | 'unhelpful',
  ) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedbackVote: vote } : m)),
    );
    await onSubmitFeedback({
      rating: vote === 'helpful' ? 5 : 2,
      helpful: vote === 'helpful',
      context: 'chat',
      reason: vote === 'helpful' ? 'Resposta útil' : 'Resposta pouco clara',
    });
  };

  const handleVisualSearchFile = async (file: File) => {
    setChatLoading(true);
    setChatError(null);
    setVisualSearchStatus('Analisando imagem enviada...');
    try {
      const { base64, mimeType } = await fileToBase64(file);
      const res = await fetch('/api/ai/visual-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenant.id,
          imageBase64: base64,
          mimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro na busca visual.');
      }

      setVisualSearchStatus(`Busca visual: ${data.visualSummary}`);
      const nextFilters: SearchFilters = {
        ...DEFAULT_FILTERS,
        category: data.detectedCategory ?? 'Todos',
      };
      setFilters(nextFilters);

      const matched = (data.matchedProductIds as string[])
        .map((id) => productsById[id])
        .filter(Boolean);
      if (matched.length > 0) {
        setVisibleProducts(matched);
        setHighlightedIds(matched.map((p) => p.id));
      } else {
        await runSearch(nextFilters, false);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `u-vis-${Date.now()}`,
          role: 'user',
          content: `[Imagem enviada para busca visual: ${file.name}]`,
          timestamp: new Date().toISOString(),
        },
        {
          id: `a-vis-${Date.now()}`,
          role: 'assistant',
          content: `Identifiquei na imagem: ${data.visualSummary}. Separei as opções mais semelhantes do catálogo.`,
          timestamp: new Date().toISOString(),
          recommendedProductIds: data.matchedProductIds,
          appliedFilters: { category: data.detectedCategory },
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha na busca visual.';
      setVisualSearchStatus(null);
      setChatError(msg);
    } finally {
      setChatLoading(false);
    }
  };

  const handleToggleCompare = (productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), productId];
      }
      const next = [...prev, productId];
      if (next.length >= 2) {
        onRecordEvent('comparison');
      }
      return next;
    });
  };

  const handleInspectProduct = (product: Product, fromRecommendation = false) => {
    setInspectedProduct(product);
    onRecordEvent('product_view');
    if (fromRecommendation) {
      onRecordEvent('recommendation_click');
    }
  };

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const totalCartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const comparedProducts = compareIds
    .map((id) => productsById[id])
    .filter(Boolean);

  const primaryColor = activeTenant.visualConfig.primaryColor || '#8234e9';
  const borderRadiusPx = activeTenant.visualConfig.borderRadiusPx ?? 5;

  const hasActiveFilter =
    Boolean(filters.query.trim()) ||
    filters.category !== 'Todos' ||
    filters.minRamGb !== null ||
    filters.maxPrice !== null;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
      {/* Workspace Toolbar */}
      <div className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="tenant-select"
                className="text-xs font-medium text-muted-foreground"
              >
                Loja:
              </label>
              <select
                id="tenant-select"
                value={activeTenant.id}
                onChange={(e) => onSelectTenant(e.target.value)}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.integrations.find((i) => i.connected)?.label ?? 'Sem ERP'})
                  </option>
                ))}
              </select>
            </div>

            <div
              role="tablist"
              aria-label="Modalidade de experiência CryChat"
              className="flex items-center gap-1 rounded-md border border-border bg-background p-1"
            >
              {(
                [
                  { id: 'hybrid', label: 'Hybrid' },
                  { id: 'discover', label: 'Discover' },
                  { id: 'classic', label: 'Classic' },
                ] as { id: ExperienceMode; label: string }[]
              ).map((tab) => {
                const active = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleModeSwitch(tab.id)}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {compareIds.length > 0 && (
              <button
                type="button"
                onClick={() => setComparisonOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-primary/50 bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground whitespace-nowrap shrink-0"
              >
                <GitCompare className="h-3.5 w-3.5" />
                Comparar ({compareIds.length})
              </button>
            )}

            {mode === 'discover' && !discoverSurveyOpen && (
              <button
                type="button"
                onClick={() => setDiscoverSurveyOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/60 whitespace-nowrap shrink-0"
              >
                <Star className="h-3.5 w-3.5 text-status-untested" />
                Avaliar busca
              </button>
            )}

            {mode === 'hybrid' && assistantCollapsed && (
              <button
                type="button"
                onClick={() => setAssistantCollapsed(false)}
                className="hidden lg:flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary whitespace-nowrap shrink-0"
              >
                <PanelRightOpen className="h-3.5 w-3.5" />
                Abrir Assistente
              </button>
            )}

            {mode === 'hybrid' && (
              <button
                type="button"
                onClick={() => setMobileChatOpen(true)}
                className="flex lg:hidden items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground whitespace-nowrap shrink-0"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Assistente IA
              </button>
            )}

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/60 whitespace-nowrap shrink-0 tabular-nums"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Sacola ({totalCartCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <section
          aria-label="Descoberta de produtos"
          className="flex-1 overflow-y-auto"
        >
          <div
            className={`mx-auto px-6 py-6 ${
              mode === 'hybrid' ? 'max-w-[1120px]' : 'max-w-[1320px]'
            }`}
          >
            <div className="mb-6">
              {mode === 'discover' && (
                <div className="mb-5">
                  <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance">
                    Busca Inteligente por Intenção — {activeTenant.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Descreva sua necessidade em linguagem natural ou envie uma foto para localizar produtos compatíveis.
                  </p>
                </div>
              )}

              <input
                ref={searchFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleVisualSearchFile(file);
                    e.target.value = '';
                  }
                }}
              />

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch(filters, mode !== 'classic');
                }}
                className="flex flex-wrap items-center gap-2"
              >
                <div className="relative min-w-[240px] flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={filters.query}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, query: e.target.value }))
                    }
                    placeholder={
                      mode === 'classic'
                        ? 'Buscar por nome, marca ou SKU...'
                        : 'Ex: notebook para programação com 16 GB de RAM até R$ 5.000'
                    }
                    className="h-10 w-full rounded-md border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {mode !== 'classic' && (
                  <button
                    type="button"
                    onClick={() => searchFileRef.current?.click()}
                    className="flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3.5 text-xs font-medium text-foreground hover:border-primary/60 whitespace-nowrap shrink-0"
                  >
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    Busca Visual
                  </button>
                )}

                <button
                  type="submit"
                  style={{
                    backgroundColor: primaryColor,
                    borderRadius: `${borderRadiusPx}px`,
                  }}
                  className="h-10 px-5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                >
                  Buscar
                </button>
              </form>

              {mode === 'discover' && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Exemplos:</span>
                  {[
                    'Quero um notebook para programação até R$ 5.000',
                    'Celular com boa câmera até R$ 3.000',
                    'Fone ANC para escritório',
                  ].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        const next = { ...DEFAULT_FILTERS, query: example };
                        setFilters(next);
                        runSearch(next, true);
                      }}
                      className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              )}

              {(intentSignals.length > 0 || correctedQuery || visualSearchStatus) && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card px-3.5 py-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-brand-secondary shrink-0" />
                    {visualSearchStatus && (
                      <span className="text-foreground">{visualSearchStatus}</span>
                    )}
                    {correctedQuery && (
                      <span>
                        Busca ajustada para{' '}
                        <strong className="text-foreground">{correctedQuery}</strong> ·
                      </span>
                    )}
                    {intentSignals.length > 0 && (
                      <span className="text-foreground">
                        Intenção detectada: {intentSignals.join(' · ')}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-link hover:underline shrink-0"
                  >
                    Redefinir
                  </button>
                </div>
              )}

              {mode === 'discover' && discoverSurveyOpen && (
                <div className="mt-4 max-w-xl">
                  <QualitySurveyCard
                    context="busca"
                    primaryColor={primaryColor}
                    onSubmit={onSubmitFeedback}
                    onDismiss={() => setDiscoverSurveyOpen(false)}
                  />
                </div>
              )}
            </div>

            {/* Category Tabs + Structured Filters */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {CATEGORIES.map((cat) => {
                  const active = filters.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleFilterChange({ category: cat })}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-accent text-accent-foreground border border-primary/50'
                          : 'border border-transparent text-muted-foreground hover:bg-card hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Memória RAM mínima"
                  value={filters.minRamGb ?? ''}
                  onChange={(e) =>
                    handleFilterChange({
                      minRamGb: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Qualquer RAM</option>
                  <option value="8">RAM ≥ 8 GB</option>
                  <option value="12">RAM ≥ 12 GB</option>
                  <option value="16">RAM ≥ 16 GB</option>
                  <option value="32">RAM ≥ 32 GB</option>
                </select>

                <select
                  aria-label="Orçamento máximo"
                  value={filters.maxPrice ?? ''}
                  onChange={(e) =>
                    handleFilterChange({
                      maxPrice: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Qualquer preço</option>
                  <option value="2500">Até R$ 2.500</option>
                  <option value="3000">Até R$ 3.000</option>
                  <option value="5000">Até R$ 5.000</option>
                  <option value="8000">Até R$ 8.000</option>
                </select>

                <select
                  aria-label="Ordenar por"
                  value={filters.sortBy}
                  onChange={(e) =>
                    handleFilterChange({
                      sortBy: e.target.value as SearchFilters['sortBy'],
                    })
                  }
                  className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="relevance">Relevância IA</option>
                  <option value="price_asc">Menor preço</option>
                  <option value="price_desc">Maior preço</option>
                  <option value="rating">Melhor avaliação</option>
                </select>

                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="tabular-nums">
                {visibleProducts.length}{' '}
                {visibleProducts.length === 1
                  ? 'produto encontrado'
                  : 'produtos encontrados'}
              </span>
              {filters.maxPrice && (
                <span className="tabular-nums">
                  Teto de orçamento: {formatBRL(filters.maxPrice)}
                </span>
              )}
            </div>

            {visibleProducts.length === 0 ? (
              <div className="rounded-md border border-border bg-card p-10 text-center">
                <p className="font-heading text-base font-semibold text-foreground">
                  Nenhum produto corresponde aos filtros atuais
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Tente ampliar a faixa de preço ou peça ao assistente para sugerir alternativas próximas.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Mostrar catálogo completo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isCompared={compareIds.includes(product.id)}
                    isHighlighted={highlightedIds.includes(product.id)}
                    primaryColor={primaryColor}
                    borderRadiusPx={borderRadiusPx}
                    density={activeTenant.visualConfig.cardDensity}
                    onToggleCompare={handleToggleCompare}
                    onInspect={(p) => handleInspectProduct(p, false)}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {mode === 'hybrid' && !assistantCollapsed && (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Redimensionar painel do assistente"
              onMouseDown={() => {
                resizingRef.current = true;
                document.body.style.cursor = 'col-resize';
              }}
              className="hidden lg:block w-1.5 cursor-col-resize border-l border-border bg-background hover:bg-primary/50 transition-colors shrink-0"
            />
            <aside
              style={{ width: `${assistantWidth}px` }}
              aria-label="Painel do assistente de IA"
              className="hidden lg:flex h-[calc(100vh-7.25rem)] sticky top-[3.5rem] flex-col shrink-0"
            >
              <AssistantPanel
                tenantName={activeTenant.name}
                welcomeMessage={activeTenant.aiConfig.welcomeMessage}
                starterPrompts={activeTenant.aiConfig.starterPrompts}
                messages={messages}
                productsById={productsById}
                loading={chatLoading}
                error={chatError}
                primaryColor={primaryColor}
                borderRadiusPx={borderRadiusPx}
                onSendMessage={handleSendMessage}
                onVisualSearchFile={handleVisualSearchFile}
                onSelectProduct={(p, fromRec) => handleInspectProduct(p, fromRec)}
                onVoteMessage={handleVoteMessage}
                onSubmitSurvey={onSubmitFeedback}
                onResetFilters={handleResetFilters}
                onClearChat={() => setMessages([])}
                onCollapse={() => setAssistantCollapsed(true)}
              />
            </aside>
          </>
        )}
      </div>

      {mode === 'hybrid' && mobileChatOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Assistente CryChat"
          className="fixed inset-0 z-50 flex justify-end bg-black/65 lg:hidden"
        >
          <div className="h-full w-full max-w-md border-l border-border bg-card">
            <AssistantPanel
              tenantName={activeTenant.name}
              welcomeMessage={activeTenant.aiConfig.welcomeMessage}
              starterPrompts={activeTenant.aiConfig.starterPrompts}
              messages={messages}
              productsById={productsById}
              loading={chatLoading}
              error={chatError}
              primaryColor={primaryColor}
              borderRadiusPx={borderRadiusPx}
              onSendMessage={handleSendMessage}
              onVisualSearchFile={handleVisualSearchFile}
              onSelectProduct={(p, fromRec) => handleInspectProduct(p, fromRec)}
              onVoteMessage={handleVoteMessage}
              onSubmitSurvey={onSubmitFeedback}
              onResetFilters={handleResetFilters}
              onClearChat={() => setMessages([])}
              onCollapse={() => setMobileChatOpen(false)}
            />
          </div>
        </div>
      )}

      {mode === 'classic' && (
        <div
          className={`fixed bottom-5 z-40 ${
            activeTenant.visualConfig.widgetPosition === 'bottom-left'
              ? 'left-5'
              : 'right-5'
          }`}
        >
          {classicWidgetOpen ? (
            <div
              style={{ borderRadius: `${borderRadiusPx + 4}px` }}
              className="flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden border border-border bg-card shadow-2xl"
            >
              <AssistantPanel
                tenantName={activeTenant.name}
                welcomeMessage={activeTenant.aiConfig.welcomeMessage}
                starterPrompts={activeTenant.aiConfig.starterPrompts}
                messages={messages}
                productsById={productsById}
                loading={chatLoading}
                error={chatError}
                primaryColor={primaryColor}
                borderRadiusPx={borderRadiusPx}
                compact
                onSendMessage={handleSendMessage}
                onVisualSearchFile={handleVisualSearchFile}
                onSelectProduct={(p, fromRec) => handleInspectProduct(p, fromRec)}
                onVoteMessage={handleVoteMessage}
                onSubmitSurvey={onSubmitFeedback}
                onResetFilters={handleResetFilters}
                onClearChat={() => setMessages([])}
                onCollapse={() => setClassicWidgetOpen(false)}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setClassicWidgetOpen(true)}
              style={{
                backgroundColor: primaryColor,
                borderRadius: `${Math.max(borderRadiusPx, 6)}px`,
              }}
              className="flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-primary-foreground shadow-lg hover:opacity-95 transition-opacity"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Assistente {activeTenant.name}</span>
            </button>
          )}
        </div>
      )}

      {comparisonOpen && (
        <ComparisonModal
          products={comparedProducts}
          primaryColor={primaryColor}
          onClose={() => setComparisonOpen(false)}
          onRemoveProduct={(id) =>
            setCompareIds((prev) => prev.filter((item) => item !== id))
          }
          onAddToCart={handleAddToCart}
          onSubmitComparisonFeedback={(helpful) =>
            onSubmitFeedback({
              rating: helpful ? 5 : 2,
              helpful,
              context: 'comparacao',
              reason: helpful ? 'Comparação clara' : 'Faltou detalhe técnico',
            })
          }
        />
      )}

      <ProductDetailDrawer
        product={inspectedProduct}
        isCompared={inspectedProduct ? compareIds.includes(inspectedProduct.id) : false}
        primaryColor={primaryColor}
        onClose={() => setInspectedProduct(null)}
        onToggleCompare={handleToggleCompare}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        open={cartOpen}
        items={cartItems}
        primaryColor={primaryColor}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={(productId, delta) =>
          setCartItems((prev) =>
            prev
              .map((item) =>
                item.product.id === productId
                  ? { ...item, quantity: item.quantity + delta }
                  : item,
              )
              .filter((item) => item.quantity > 0),
          )
        }
        onRemoveItem={(productId) =>
          setCartItems((prev) => prev.filter((i) => i.product.id !== productId))
        }
        onCompleteOrder={() => {
          setCartItems([]);
        }}
        onSubmitFeedback={onSubmitFeedback}
      />
    </div>
  );
}

export function ExperienceWorkspace(props: ExperienceWorkspaceProps) {
  const catalogKey = experienceCatalogKey(props.products);
  return (
    <ExperienceWorkspaceInner
      key={`${props.activeTenant.id}\u0001${props.activeTenant.defaultMode}\u0001${catalogKey}`}
      {...props}
    />
  );
}
