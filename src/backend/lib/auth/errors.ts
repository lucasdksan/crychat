const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "Este e-mail já está cadastrado. Entre com o mesmo provedor que usou no cadastro.",
  OAuthSignin: "Não foi possível entrar com o Google. Tente novamente.",
  default: "Não foi possível entrar. Tente novamente.",
};

export function getAuthErrorMessage(code?: string | null): string | null {
  if (!code) {
    return null;
  }
  return AUTH_ERRORS[code] ?? AUTH_ERRORS.default;
}
