import Link from "next/link";

import { BrandLogo } from "@/frontend/components/atoms/brand-logo";
import { ChatPanel } from "@/frontend/components/organisms/chat-panel";

type ChatTemplateProps = {
  storeId?: string;
};

export function ChatTemplate({ storeId }: ChatTemplateProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background lg:pr-[min(420px,38vw)]">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <BrandLogo size="sm" />
        <nav className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex h-7 items-center rounded-[var(--radius-md)] px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Admin
          </Link>
        </nav>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">
        <ChatPanel storeId={storeId} />
      </main>
    </div>
  );
}
