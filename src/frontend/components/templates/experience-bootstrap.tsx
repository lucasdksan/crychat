"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { Product, Tenant } from "@/backend/modules/experience/domain/types";
import { EmptyStoreOnboarding } from "@/frontend/components/molecules/empty-store-onboarding";
import { ExperienceWorkspace } from "@/frontend/components/organisms/experience/ExperienceWorkspace";
import { ExperienceVitrineShell } from "@/frontend/components/templates/experience-vitrine-shell";

type ExperienceBootstrapProps = {
  initialStoreId?: string;
};

export function ExperienceBootstrap({ initialStoreId }: ExperienceBootstrapProps) {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantId] = useState(initialStoreId ?? "");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async (tenantId: string) => {
    const res = await fetch(`/api/products/${tenantId}`);
    if (res.ok) {
      const data = (await res.json()) as { products: Product[] };
      setProducts(data.products);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        const res = await fetch("/api/tenants");
        if (res.status === 401) {
          router.replace("/entrar?to=/chat");
          return;
        }
        if (!res.ok) {
          throw new Error("Não foi possível carregar a vitrine.");
        }
        const data = (await res.json()) as { tenants: Tenant[] };
        if (!mounted) return;
        setTenants(data.tenants);
        const id =
          initialStoreId && data.tenants.some((t) => t.id === initialStoreId)
            ? initialStoreId
            : (data.tenants[0]?.id ?? "");
        setActiveTenantId(id);
        if (id) {
          await loadProducts(id);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Erro ao carregar vitrine.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    boot();
    return () => {
      mounted = false;
    };
  }, [initialStoreId, loadProducts, router]);

  const activeTenant = tenants.find((t) => t.id === activeTenantId) ?? tenants[0];

  if (loading) {
    return (
      <ExperienceVitrineShell
        backAction={{ label: "Voltar ao Admin", href: "/admin" }}
      >
        <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center text-sm text-muted-foreground">
          Carregando vitrine…
        </div>
      </ExperienceVitrineShell>
    );
  }

  if (error) {
    return (
      <ExperienceVitrineShell
        backAction={{ label: "Voltar ao Admin", href: "/admin" }}
      >
        <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {error}
        </div>
      </ExperienceVitrineShell>
    );
  }

  if (!activeTenant) {
    return (
      <ExperienceVitrineShell
        backAction={{ label: "Voltar ao Admin", href: "/admin" }}
      >
        <EmptyStoreOnboarding
          title="Nenhuma loja configurada para o chat"
          description="Conecte a loja no admin para importar o catálogo do banco e abrir a vitrine."
        />
      </ExperienceVitrineShell>
    );
  }

  return (
    <ExperienceVitrineShell
      backAction={{ label: "Voltar ao Admin", href: "/admin" }}
    >
      <ExperienceWorkspace
        tenants={tenants}
        activeTenant={activeTenant}
        products={products}
        onSelectTenant={async (tenantId) => {
          setActiveTenantId(tenantId);
          await loadProducts(tenantId);
        }}
        onChangeMode={async (mode) => {
          await fetch(`/api/tenants/${activeTenant.id}/config`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ defaultMode: mode }),
          }).catch(() => {});
        }}
        onRecordEvent={async (type) => {
          await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenantId: activeTenant.id, type }),
          }).catch(() => {});
        }}
        onSubmitFeedback={async (payload) => {
          await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenantId: activeTenant.id, ...payload }),
          }).catch(() => {});
        }}
      />
    </ExperienceVitrineShell>
  );
}