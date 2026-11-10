import type { Metadata } from "next";

import { rootHtmlClassName } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "CryChat",
  description: "Inteligência conversacional para e-commerce",
  icons: {
    icon: [
      {
        url: "/brand/logo/signet-favicon.svg",
        type: "image/svg+xml",
      },
      { url: "/brand/logo/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/brand/logo/icon-192.png", sizes: "192x192" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={rootHtmlClassName}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
