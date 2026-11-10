import Image from "next/image";

import { AuthHeroPanel } from "@/frontend/components/organisms/auth-hero-panel";
import { PublicLegalFooter } from "@/frontend/components/molecules/public-legal-footer";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
};

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_min(28rem,40vw)] lg:grid-rows-1 xl:grid-cols-[minmax(0,1fr)_32rem]">
      <div className="auth-hero-bg relative shrink-0 overflow-hidden lg:hidden">
        <div className="relative flex items-center justify-center px-6 py-8">
          <Image
            src="/brand/logo/signet.svg"
            alt="CryChat"
            width={96}
            height={96}
            className="size-20"
            priority
            unoptimized
          />
        </div>
      </div>
      <AuthHeroPanel />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain border-border/40 px-5 py-8 sm:px-8 sm:py-10 lg:border-l lg:px-10 lg:py-12 xl:px-12">
        <div className="my-auto ml-auto flex w-full max-w-md flex-col lg:max-w-none">
          {children}
          <PublicLegalFooter />
        </div>
      </div>
    </div>
  );
}
