import { loadAdminDashboardMetrics } from "@/backend/controllers/analytics-query";
import { MetricsBoard } from "@/frontend/components/organisms/metrics-board";
import { AdminTemplate } from "@/frontend/components/templates/admin-template";
import { Button } from "@/frontend/components/ui/button";
import { startCatalogSyncFormAction } from "@/backend/controllers/store.controller";

export default async function AdminDashboardPage() {
  const data = await loadAdminDashboardMetrics();

  return (
    <AdminTemplate active="dashboard">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {data?.store
              ? `Loja ativa: ${data.store.name}`
              : "Cadastre uma loja para ver métricas."}
          </p>
        </div>
        {data?.store ? (
          <form action={startCatalogSyncFormAction}>
            <input type="hidden" name="storeId" value={data.store.id} />
            <Button type="submit" variant="secondary">
              Sincronizar catálogo VTEX
            </Button>
          </form>
        ) : null}
      </div>
      {data?.metrics ? (
        <MetricsBoard metrics={data.metrics} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Sem métricas ainda. Conecte a VTEX, sincronize o catálogo e use o chat.
        </p>
      )}
    </AdminTemplate>
  );
}
