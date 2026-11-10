import { StoreForm } from "@/frontend/components/organisms/store-form";
import { AdminTemplate } from "@/frontend/components/templates/admin-template";

export default function NovaLojaPage() {
  return (
    <AdminTemplate active="stores">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Conectar loja VTEX</h1>
        <p className="text-sm text-muted-foreground">
          Credenciais são criptografadas antes de salvar no Supabase.
        </p>
      </div>
      <StoreForm />
    </AdminTemplate>
  );
}
