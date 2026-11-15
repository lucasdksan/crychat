import Link from "next/link";

import { BrandLogo } from "@/frontend/components/atoms/brand-logo";
import { StoreForm } from "@/frontend/components/organisms/store-form";

export default function NovaLojaPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <BrandLogo size="sm" />
          <Link
            href="/admin"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Voltar ao admin
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10">
        <BrandLogo size="xl" showName={false} />
        <h1 className="mt-4 text-center font-heading text-2xl font-semibold">
          Conectar loja
        </h1>
        <p className="mt-2 max-w-lg text-center text-sm text-muted-foreground">
          As credenciais são criptografadas antes de ir para o banco. Na VTEX
          são necessários o App Key e o App Token, os dois juntos.
        </p>
        <div className="mt-8 w-full rounded-md border border-border bg-card p-6">
          <StoreForm />
        </div>
      </main>
    </div>
  );
}
