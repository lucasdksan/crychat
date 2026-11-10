import Image from "next/image";

import { cn } from "@/frontend/lib/utils";

type AuthHeroPanelProps = {
  className?: string;
};

export function AuthHeroPanel({ className }: AuthHeroPanelProps) {
  return (
    <aside
      aria-hidden
      className={cn(
        "relative hidden overflow-hidden lg:flex lg:min-h-dvh",
        "auth-hero-panel-bg",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-[10%] top-[18%] size-[55%] rotate-12 rounded-full border border-sky-300/20" />
        <div className="absolute bottom-[8%] right-[6%] size-[38%] -rotate-6 rounded-full border border-rose-400/25" />
        <div className="absolute left-[28%] top-[62%] size-[22%] rounded-full border border-amber-300/20" />
      </div>
      <div className="relative z-10 flex flex-1 items-center justify-center p-12">
        <Image
          src="/brand/logo/signet.svg"
          alt=""
          width={640}
          height={640}
          unoptimized
          className="size-52 max-w-[min(320px,36vw)] drop-shadow-[0_24px_80px_rgba(56,189,248,0.25)] xl:size-72"
          priority
        />
      </div>
    </aside>
  );
}
