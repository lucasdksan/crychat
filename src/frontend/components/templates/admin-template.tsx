import Link from "next/link";

import { BrandLogo } from "@/frontend/components/atoms/brand-logo";
import { cn } from "@/frontend/lib/utils";

type AdminTemplateProps = {
  children: React.ReactNode;
  active?: "dashboard" | "stores" | "ia" | "chat";
};

const links = [
  { href: "/admin", key: "dashboard", label: "Métricas" },
  { href: "/admin/lojas/nova", key: "stores", label: "Loja VTEX" },
  { href: "/admin/ia", key: "ia", label: "Provedores IA" },
  { href: "/chat", key: "chat", label: "Chat" },
] as const;

export function AdminTemplate({ children, active = "dashboard" }: AdminTemplateProps) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <BrandLogo size="sm" />
          <nav className="flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex h-8 items-center rounded-[var(--radius-md)] px-2.5 text-sm font-medium",
                  active === link.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className={cn("mx-auto w-full max-w-6xl px-4 py-6")}>{children}</main>
    </div>
  );
}
