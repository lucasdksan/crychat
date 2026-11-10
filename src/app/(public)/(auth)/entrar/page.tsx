import { getAuthErrorMessage } from "@/backend/lib/auth/errors";
import { sanitizeRedirectPath } from "@/backend/lib/auth/redirect";
import { GoogleLoginPanel } from "@/frontend/components/organisms/google-login-panel";
import { AuthCardTemplate } from "@/frontend/components/templates/auth-card-template";

type EntrarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EntrarPage({ searchParams }: EntrarPageProps) {
  const params = await searchParams;
  const redirectTo = sanitizeRedirectPath(
    typeof params.to === "string" ? params.to : undefined,
  );
  const errorMessage = getAuthErrorMessage(
    typeof params.error === "string" ? params.error : undefined,
  );

  return (
    <AuthCardTemplate title="Acesse o CryChat">
      <GoogleLoginPanel redirectTo={redirectTo} errorMessage={errorMessage} />
    </AuthCardTemplate>
  );
}
