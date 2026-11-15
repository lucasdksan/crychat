import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { CryChatSignet } from "@/frontend/components/atoms/crychat-signet";

type ExperienceVitrineShellProps = {
  children: ReactNode;
  backAction?: { label: string; onClick: () => void } | { label: string; href: string };
};

export function ExperienceVitrineShell({
  children,
  backAction,
}: ExperienceVitrineShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-8 px-6">
          <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
            <CryChatSignet size={20} />
            <span className="font-heading text-sm font-semibold text-foreground">
              CryChat · Simulador de Vitrine
            </span>
          </div>

          {backAction ? (
            "href" in backAction ? (
              <Link
                href={backAction.href}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:border-primary/60"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {backAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={backAction.onClick}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground hover:border-primary/60"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {backAction.label}
              </button>
            )
          ) : null}
        </div>
      </header>
      {children}
    </div>
  );
}