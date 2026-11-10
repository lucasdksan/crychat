import { loadAdminDashboardMetrics } from "@/backend/controllers/analytics-query";
import { AiProviderForm } from "@/frontend/components/organisms/ai-provider-form";
import { AdminTemplate } from "@/frontend/components/templates/admin-template";

export default async function AdminIaPage() {
  const data = await loadAdminDashboardMetrics();
  const storeId = data?.store?.id;

  return (
    <AdminTemplate active="ia">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Provedores de IA</h1>
        <p className="text-sm text-muted-foreground">
          Configure BYOK por loja ou use as chaves de plataforma no `.env`.
        </p>
      </div>
      {storeId ? (
        <AiProviderForm storeId={storeId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Cadastre uma loja antes de configurar o provedor.
        </p>
      )}
    </AdminTemplate>
  );
}
