import { GoogleSignInButton } from "@/frontend/components/molecules/google-sign-in-button";

type GoogleLoginPanelProps = {
  redirectTo?: string;
  errorMessage?: string | null;
};

export function GoogleLoginPanel({
  redirectTo,
  errorMessage,
}: GoogleLoginPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {errorMessage ? (
        <p className="rounded-[var(--radius-md)] border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
      <GoogleSignInButton redirectTo={redirectTo} />
    </div>
  );
}
