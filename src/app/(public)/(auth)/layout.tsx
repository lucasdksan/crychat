import { AuthSplitLayout } from "@/frontend/components/templates/auth-split-layout";

export default function AuthPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthSplitLayout>{children}</AuthSplitLayout>;
}
