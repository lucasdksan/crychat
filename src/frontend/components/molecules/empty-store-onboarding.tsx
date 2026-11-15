"use client";

import { LogOut, Store } from "lucide-react";
import Link from "next/link";

import { signOutAction } from "@/backend/controllers/auth.controller";
import { BrandLogo } from "@/frontend/components/atoms/brand-logo";

type EmptyStoreOnboardingProps = {
  title?: string;
  description?: string;
};

export function EmptyStoreOnboarding({
  title = "Conecte sua loja ao CryChat",
  description = "O painel usa o catálogo salvo no banco. Conecte a VTEX, Shopify, WooCommerce, Nuvemshop ou uma API própria para importar os produtos.",
}: EmptyStoreOnboardingProps) {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-lg rounded-md border border-border bg-card p-6 sm:p-8">
        <BrandLogo size="lg" />

        <h1 className="mt-5 font-heading text-xl font-semibold text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        <Link
          href="/admin/lojas/nova"
          className="mt-6 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Store className="h-4 w-4" />
          Conectar loja
        </Link>

        <div className="mt-6 flex justify-end border-t border-border pt-4">
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
