"use client";

import { ExternalLink, Menu } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type {
  AnalyticsSummary,
  ExperienceMode,
  Product,
  Tenant,
} from "@/backend/modules/experience/domain/types";
import { EmptyStoreOnboarding } from "@/frontend/components/molecules/empty-store-onboarding";
import { DashboardAIProviders } from "@/frontend/components/organisms/admin-dashboard/DashboardAIProviders";
import { DashboardAnalytics } from "@/frontend/components/organisms/admin-dashboard/DashboardAnalytics";
import { DashboardCustomization } from "@/frontend/components/organisms/admin-dashboard/DashboardCustomization";
import { DashboardIntegrations } from "@/frontend/components/organisms/admin-dashboard/DashboardIntegrations";
import { DashboardSDK } from "@/frontend/components/organisms/admin-dashboard/DashboardSDK";
import {
  SaasSidebar,
  type DashboardSection,
} from "@/frontend/components/organisms/admin-dashboard/SaasSidebar";
import { ExperienceWorkspace } from "@/frontend/components/organisms/experience/ExperienceWorkspace";
import { ExperienceVitrineShell } from "@/frontend/components/templates/experience-vitrine-shell";

const SECTION_LABELS: Record<Exclude<DashboardSection, "experience">, string> = {
  analytics: "Métricas",
  integrations: "Integrações & Pinecone",
  "ai-providers": "Provedores IA",
  customization: "Personalização",
  sdk: "Instalação SDK",
};

const DASHBOARD_SECTIONS: DashboardSection[] = [
  "analytics",
  "integrations",
  "ai-providers",
  "customization",
  "sdk",
  "experience",
];

function sectionFromSearchParam(value: string | null): DashboardSection {
  if (value && DASHBOARD_SECTIONS.includes(value as DashboardSection)) {
    return value as DashboardSection;
  }
  return "analytics";
}

export function AdminPlatformShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = sectionFromSearchParam(searchParams.get("section"));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const navigateSection = useCallback(
    (sec: DashboardSection) => {
      if (sec === "analytics") {
        router.replace("/admin", { scroll: false });
        return;
      }
      router.replace(`/admin?section=${sec}`, { scroll: false });
    },
    [router],
  );

  const fetchTenantData = useCallback(async (tenantId: string) => {
    const [prodRes, analyticsRes] = await Promise.all([
      fetch(`/api/products/${tenantId}`),
      fetch(`/api/analytics/${tenantId}`),
    ]);
    if (prodRes.ok) {
      const pData = (await prodRes.json()) as { products: Product[] };
      setProducts(pData.products);
    }
    if (analyticsRes.ok) {
      const aData = (await analyticsRes.json()) as {
        analytics: AnalyticsSummary;
      };
      setAnalytics(aData.analytics);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        const res = await fetch("/api/tenants");
        if (res.status === 401) {
          router.replace("/entrar?to=/admin");
          return;
        }
        if (!res.ok) {
          throw new Error("Falha ao carregar configurações das lojas.");
        }
        const data = (await res.json()) as { tenants: Tenant[] };
        if (!active) return;
        setTenants(data.tenants);
        const initialId = data.tenants[0]?.id ?? "";
        setActiveTenantId(initialId);
        if (initialId) {
          await fetchTenantData(initialId);
        }
      } catch (err) {
        if (active) {
          setLoadError(
            err instanceof Error ? err.message : "Erro ao inicializar plataforma.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, [fetchTenantData, router]);

  const handleSelectTenant = async (tenantId: string) => {
    setActiveTenantId(tenantId);
    await fetchTenantData(tenantId);
  };

  const handleTenantUpdated = (updated: Tenant) => {
    setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    fetchTenantData(updated.id);
  };

  const handleChangeMode = async (mode: ExperienceMode) => {
    if (!activeTenantId) return;
    setTenants((prev) =>
      prev.map((t) =>
        t.id === activeTenantId ? { ...t, defaultMode: mode } : t,
      ),
    );
    await fetch(`/api/tenants/${activeTenantId}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultMode: mode }),
    }).catch(() => {});
  };

  const handleRecordEvent = async (
    type:
      | "product_view"
      | "recommendation_click"
      | "comparison"
      | "conversation_start",
  ) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: activeTenantId, type }),
      });
      if (res.ok) {
        const data = (await res.json()) as { analytics: AnalyticsSummary };
        setAnalytics(data.analytics);
      }
    } catch {
      // Ignore transient analytics tracking failure
    }
  };

  const handleSubmitFeedback = async (payload: {
    rating: number;
    helpful: boolean;
    context: "chat" | "busca" | "comparacao";
    reason?: string;
    comment?: string;
  }) => {
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: activeTenantId,
          ...payload,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { analytics: AnalyticsSummary };
        setAnalytics(data.analytics);
      }
    } catch {
      // Ignore transient feedback failure
    }
  };

  const activeTenant = tenants.find((t) => t.id === activeTenantId) ?? tenants[0];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <div className="hidden w-64 border-r border-border bg-sidebar lg:block" />
        <div className="flex-1 p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="h-28 animate-pulse rounded-md border border-border bg-card"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="w-full max-w-md rounded-md border border-destructive/40 bg-card p-6 text-center">
          <h1 className="font-heading text-lg font-semibold text-foreground">
            Não foi possível carregar o CryChat
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!activeTenant) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <EmptyStoreOnboarding />
      </div>
    );
  }

  if (activeSection === "experience") {
    return (
      <ExperienceVitrineShell
        backAction={{
          label: "Voltar ao Dashboard",
          onClick: () => {
            navigateSection("analytics");
            fetchTenantData(activeTenant.id);
          },
        }}
      >
        <ExperienceWorkspace
          tenants={tenants}
          activeTenant={activeTenant}
          products={products}
          onSelectTenant={handleSelectTenant}
          onChangeMode={handleChangeMode}
          onRecordEvent={handleRecordEvent}
          onSubmitFeedback={handleSubmitFeedback}
        />
      </ExperienceVitrineShell>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SaasSidebar
        tenants={tenants}
        activeTenant={activeTenant}
        activeSection={activeSection}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onSelectTenant={handleSelectTenant}
        onSelectSection={(sec) => {
          navigateSection(sec);
          if (sec === "analytics") {
            fetchTenantData(activeTenant.id);
          }
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-card/90 px-6 backdrop-blur-sm">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Abrir menu lateral"
              className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 truncate text-xs"
            >
              <span className="text-muted-foreground">CryChat</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{activeTenant.name}</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium text-foreground">
                {SECTION_LABELS[activeSection]}
              </span>
            </nav>
          </div>

          <button
            type="button"
            onClick={() => navigateSection("experience")}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir Vitrine
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-8">
          {activeSection === "analytics" && (
            <DashboardAnalytics
              activeTenant={activeTenant}
              analytics={analytics}
              onOpenExperience={() => navigateSection("experience")}
            />
          )}
          {activeSection === "integrations" && (
            <DashboardIntegrations
              activeTenant={activeTenant}
              products={products}
              onTenantUpdated={handleTenantUpdated}
            />
          )}
          {activeSection === "ai-providers" && (
            <DashboardAIProviders
              activeTenant={activeTenant}
              onTenantUpdated={handleTenantUpdated}
            />
          )}
          {activeSection === "customization" && (
            <DashboardCustomization
              activeTenant={activeTenant}
              sampleProduct={products[0]}
              onTenantUpdated={handleTenantUpdated}
            />
          )}
          {activeSection === "sdk" && (
            <DashboardSDK
              activeTenant={activeTenant}
              onTenantUpdated={handleTenantUpdated}
              onOpenExperience={() => navigateSection("experience")}
            />
          )}
        </main>
      </div>
    </div>
  );
}