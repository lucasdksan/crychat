import Link from "next/link";

const links = [
  { href: "/privacidade", label: "Privacidade" },
  { href: "/termos", label: "Termos de uso" },
  { href: "/cookies", label: "Cookies" },
] as const;

export function PublicLegalFooter() {
  return (
    <footer className="mt-8 border-t border-border/60 pt-6">
      <nav
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground lg:justify-start"
        aria-label="Documentos legais"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="mt-3 text-center text-xs text-muted-foreground lg:text-left">
        Conteúdo informativo - {process.env.NEXT_PUBLIC_LGPD_DPO_NAME}
      </p>
    </footer>
  );
}
